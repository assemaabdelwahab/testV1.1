import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY')!

const CATEGORY_ENUM = [
  'Groceries', 'Dining Out', 'Online Food Delivery', 'Transportation',
  'Bills & Utilities', 'Health & Wellness', 'Subscriptions', 'Instapay Transfers',
  'Cash Withdrawal', 'Rent', 'Loans & Installments', 'Fuel', 'Investments', 'Others',
]

const SYSTEM_PROMPT = `You are a financial transaction parser for CIB bank (Egypt) SMS messages. Handles Arabic and English.
Respond ONLY with valid JSON — no markdown, no explanation, no code block:
{ "merchant": string | null, "amount": number, "currency": string, "category": string, "date": string }

DATE FORMATS — CIB uses three, convert ALL to YYYY-MM-DD:
• DD/MM/YY  → "17/11/25" = 2025-11-17   (credit card, ATM, debit card)
• DD-MM-YYYY → "02-03-2026" = 2026-03-02  (Instapay, IPN transfers)
• DD MMM YYYY → "04 MAR 2026" = 2026-03-04 (English bank transfers)

FIELD RULES:
- merchant: merchant name, ATM location, or counterparty. null for unclear or bank-internal fees. NEVER include currency codes in merchant name (e.g. output "ANTHROPIC" not "ANTHROPIC (USD)").
- amount: transaction amount as a plain number (e.g. 84.40). Arabic SMS: use the number before "جم". For FX transactions, use the foreign currency amount as-is (e.g. 5.00 for "USD 5.00"). Remove commas.
- currency: ISO 4217 currency code. "EGP" for all Egyptian pound transactions. For FX, use the detected code (e.g. "USD", "EUR", "GBP"). Default "EGP" if unclear.
- category: MUST be exactly one of: ${CATEGORY_ENUM.join(', ')}
- date: transaction date in YYYY-MM-DD. Use today if not found.

SMS FORMATS AND CATEGORY MAPPING:
1a. Credit card EGP (EN): "charged for EGP [amount] at [merchant] on DD/MM/YY at HH:MM"
   → merchant = merchant name; currency = "EGP"; category by merchant type

1b. Credit card FX (EN): "credit card #XXXX was charged for [CURRENCY] [amount] at [merchant]"
   → merchant = clean merchant name (no currency suffix); currency = detected code (e.g. "USD"); category by merchant type

2. Instapay outgoing (AR): "تحويل لحظي ... بمبلغ [amount] جم من حسابك ... بتاريخ DD-MM-YYYY HH:MM"
   → merchant = null; currency = "EGP"; category = Instapay Transfers

3. ATM withdrawal (AR): "تم سحب مبلغ EGP [amount] من بطاقة الخصم المباشر ... في DD/MM/YY HH:MM"
   → merchant = location name (after "من CIB"); currency = "EGP"; category = Cash Withdrawal

4. IPN transfer (AR): "خصم مبلغ EGP [amount] ... شبكة المدفوعات اللحظية (IPN) ... بتاريخ DD-MM-YYYY إلى [recipient]"
   → merchant = recipient name (after "إلى"); currency = "EGP"; category = Investments if securities/brokerage, else Instapay Transfers

5. Debit card purchase (AR): "تم خصم مبلغ EGP [amount] من بطاقة الخصم المباشر ... عند [merchant] في DD/MM/YY HH:MM"
   → merchant = merchant name (after "عند"); currency = "EGP"; category by merchant type

6a. Bank transfer EGP (EN): "is debited with amount EGP [amount]DR On DD MMM YYYY with transfer to another account"
   → merchant = null; currency = "EGP"; category = Instapay Transfers

6b. Bank transfer FX (EN): "is debited with amount [CURRENCY] [amount]DR On DD MMM YYYY with transfer to another account"
   → merchant = null; currency = detected code (e.g. "USD"); amount = foreign amount as-is; category = Others

Do not invent new categories. If unsure, use Others.`

const MONTHS: Record<string, string> = {
  JAN:'01',FEB:'02',MAR:'03',APR:'04',MAY:'05',JUN:'06',
  JUL:'07',AUG:'08',SEP:'09',OCT:'10',NOV:'11',DEC:'12',
}

function normalizeDate(dateStr: string): string {
  const today = new Date().toISOString().split('T')[0]
  if (!dateStr) return today

  // Already YYYY-MM-DD — return as-is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr

  // DD/MM/YY or DD/MM/YYYY — CIB credit card, ATM, debit card
  const ddmmSlash = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
  if (ddmmSlash) {
    const [, day, month, yearStr] = ddmmSlash
    const year = yearStr.length === 2 ? `20${yearStr}` : yearStr
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  // DD-MM-YYYY — CIB Instapay / IPN (dashes, 4-digit year, NOT YYYY-MM-DD)
  const ddmmDash = dateStr.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/)
  if (ddmmDash) {
    const [, day, month, year] = ddmmDash
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  // DD MMM YYYY — CIB English bank transfer (e.g. "04 MAR 2026")
  const ddMonYYYY = dateStr.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/)
  if (ddMonYYYY) {
    const [, day, mon, year] = ddMonYYYY
    const month = MONTHS[mon.toUpperCase()]
    if (month) return `${year}-${month}-${day.padStart(2, '0')}`
  }

  // ISO timestamp or other JS-parseable fallback
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? today : d.toISOString().split('T')[0]
}

// Extract date directly from raw SMS body — more reliable than DeepSeek date parsing
// for ambiguous DD/MM/YY values where day and month are both < 12.
function extractDateFromSms(body: string): string | null {
  // Formats 1a/1b: "on DD/MM/YY at HH:MM" (credit card EN)
  const creditCard = body.match(/\bon\s+(\d{1,2}\/\d{1,2}\/\d{2,4})\s+at\b/i)
  if (creditCard) return normalizeDate(creditCard[1])

  // Formats 3/5: "في DD/MM/YY HH:MM" (ATM / debit card AR)
  const arabicSlash = body.match(/في\s+(\d{1,2}\/\d{1,2}\/\d{2,4})\s+\d/)
  if (arabicSlash) return normalizeDate(arabicSlash[1])

  // Formats 2/4: "بتاريخ DD-MM-YYYY" (Instapay / IPN AR)
  const arabicDash = body.match(/بتاريخ\s+(\d{1,2}-\d{1,2}-\d{4})/)
  if (arabicDash) return normalizeDate(arabicDash[1])

  // Format 6: "On DD MMM YYYY with" (bank transfer EN)
  const bankTransfer = body.match(/\bOn\s+(\d{1,2}\s+[A-Za-z]{3}\s+\d{4})\b/i)
  if (bankTransfer) return normalizeDate(bankTransfer[1])

  return null
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  let payload: { sender?: string; body?: string; received_at?: string }
  try {
    payload = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 })
  }

  const { sender, body, received_at } = payload

  if (!body?.trim()) {
    return new Response(JSON.stringify({ error: 'body is required' }), { status: 400 })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  // Normalize received_at to valid ISO timestamp
  const receivedAtDate = received_at ? new Date(received_at) : null
  const normalizedReceivedAt = (receivedAtDate && !isNaN(receivedAtDate.getTime()))
    ? receivedAtDate.toISOString()
    : new Date().toISOString()

  // 1. Insert raw_sms — UNIQUE(body_hash) deduplicates identical SMS
  const { data: rawSms, error: rawInsertError } = await supabase
    .from('raw_sms')
    .insert({
      sender: sender ?? null,
      body: body.trim(),
      received_at: normalizedReceivedAt,
    })
    .select('id')
    .single()

  if (rawInsertError) {
    // 23505 = unique_violation — duplicate SMS body, safe to skip
    if (rawInsertError.code === '23505') {
      return new Response(JSON.stringify({ status: 'duplicate', skipped: true }), { status: 200 })
    }
    return new Response(JSON.stringify({ error: rawInsertError.message }), { status: 500 })
  }

  const rawSmsId = rawSms.id

  // 2. Call DeepSeek to parse the SMS
  const VALID_CURRENCIES = new Set(['EGP', 'USD', 'EUR', 'GBP'])
  let parsed: { merchant: string | null; amount: number; currency: string; category: string; date: string }

  try {
    const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: body.trim() },
        ],
        temperature: 0,
      }),
    })

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content ?? ''
    const cleanContent = content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
    parsed = JSON.parse(cleanContent)

    // Enforce category enum — don't trust LLM output blindly
    if (!CATEGORY_ENUM.includes(parsed.category)) {
      parsed.category = 'Others'
    }

    // Validate currency — default to EGP if absent or unrecognized
    if (!parsed.currency || !VALID_CURRENCIES.has(parsed.currency.toUpperCase())) {
      parsed.currency = 'EGP'
    } else {
      parsed.currency = parsed.currency.toUpperCase()
    }

    // Prefer date extracted directly from raw SMS (regex-based, immune to LLM DD/MM vs MM/DD confusion).
    // Fall back to normalizing whatever DeepSeek returned if SMS extraction finds nothing.
    parsed.date = extractDateFromSms(body.trim()) ?? normalizeDate(parsed.date)
  } catch (err) {
    // Parse failed — mark in raw_sms, return 200 so Make.com doesn't retry
    await supabase
      .from('raw_sms')
      .update({ error: `deepseek_parse_error: ${String(err)}` })
      .eq('id', rawSmsId)

    return new Response(
      JSON.stringify({ status: 'parse_error', raw_sms_id: rawSmsId }),
      { status: 200 }
    )
  }

  // 3. Corrections lookup — override category if a rule exists for this merchant
  let categorySource = 'deepseek'
  if (parsed.merchant) {
    const { data: correction } = await supabase
      .from('category_corrections')
      .select('correct_category')
      .or(
        `and(match_type.eq.exact,merchant_pattern.ilike.${parsed.merchant}),` +
        `and(match_type.eq.contains,body.ilike.%${parsed.merchant}%)`
      )
      .limit(1)
      .maybeSingle()

    if (correction) {
      parsed.category = correction.correct_category
      categorySource = 'correction_lookup'
    }
  }

  // 4. Insert transaction
  const { data: txn, error: txnError } = await supabase
    .from('transactions')
    .insert({
      category: parsed.category,
      merchant_name: parsed.merchant ?? null,
      amount: parsed.amount,
      currency: parsed.currency,
      transaction_date: parsed.date,
      raw_sms_id: rawSmsId,
      category_source: categorySource,
    })
    .select('id')
    .single()

  if (txnError) {
    const isDuplicate = txnError.code === '23505'
    await supabase
      .from('raw_sms')
      .update({
        error: isDuplicate ? 'duplicate_transaction' : txnError.message,
        processed: false,  // never mark a failed transaction insert as processed
      })
      .eq('id', rawSmsId)

    return new Response(
      JSON.stringify({
        status: isDuplicate ? 'duplicate_transaction' : 'transaction_insert_error',
        raw_sms_id: rawSmsId,
        error: txnError.message,
      }),
      { status: 200 }
    )
  }

  // 5. Mark raw_sms processed
  await supabase
    .from('raw_sms')
    .update({ processed: true, transaction_id: txn.id })
    .eq('id', rawSmsId)

  return new Response(
    JSON.stringify({ status: 'ok', transaction_id: txn.id, raw_sms_id: rawSmsId }),
    { status: 200 }
  )
})
