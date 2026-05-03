import { NextRequest, NextResponse } from "next/server";
import { buildAgentContext, AgentContext } from "@/lib/agent-context";
import { supabase } from "@/lib/supabase";
import { AGENT_MODEL } from "@/lib/constants";

const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";

function buildSystemPrompt(ctx: AgentContext): string {
  const goalLine = ctx.active_goal
    ? `ACTIVE SAVINGS GOAL: ${ctx.active_goal.target} EGP for ${ctx.active_goal.month.substring(0, 7)}`
    : "";

  return `You are a brutally honest personal financial coach for a user in Egypt.
You have access to their spending data — aggregated summaries, not individual transactions.
All amounts are in EGP unless otherwise noted.
Today is ${ctx.today}. Current month: ${ctx.days_elapsed} days elapsed, ${ctx.days_remaining} remaining.

## EGYPT CALENDAR
- Workdays: Sunday through Thursday
- Weekend: Friday and Saturday
- Apply this when analyzing day-of-week patterns. "Weekend spike" means Fri+Sat, not Sat+Sun.

## DATA YOU HAVE

FIXED COSTS — never suggest cutting these (rent, loans, essentials):
${JSON.stringify(ctx.fixed_costs, null, 2)}

DISCRETIONARY SPENDING — 12-month averages:
${JSON.stringify(ctx.monthly_averages, null, 2)}

CURRENT MONTH ACTUALS (${ctx.days_elapsed} days in):
${JSON.stringify(ctx.current_month_actuals, null, 2)}

LAST 6 MONTHS — per-category monthly totals:
${JSON.stringify(ctx.monthly_totals, null, 2)}

TOP MERCHANTS — last 3 months:
${JSON.stringify(ctx.top_merchants, null, 2)}

SPENDING BY DAY OF WEEK — average daily spend:
${JSON.stringify(ctx.day_of_week_pattern, null, 2)}

${goalLine}

## POSITIVE SPEND CATEGORIES
Investments is GOOD behavior — never frame it as a cost driver or suggest cutting it. If the user is investing consistently, acknowledge it positively.

## CAPABILITIES
- Create savings plans with specific per-category cut targets. Verify that the sum of cuts equals total_cut before responding.
- Analyze spending trends and compare months
- Identify top merchants and suggest cuts
- Spot temporal patterns (workday vs weekend using Egypt calendar)
- Assess whether a savings goal is realistic — be honest if it's not

## CONSTRAINTS
- You cannot see individual transactions. If asked about a specific charge, tell the user to check the expense tracker app.
- Never suggest cutting fixed costs or Investments.

## RESPONSE STYLE
- Brutally honest. Say it plainly even if uncomfortable.
- Concise. No fluff, no filler phrases, no "Great question!".
- Use approximate numbers for readability: "~7.4K" not "7,431", "~2.5K" not "2,489".
- Structure responses with bullet points for multi-point answers — easier to scan than paragraphs.
- When suggesting cuts, be specific: which category, how much, and why.
- For feasibility assessments: be direct. If a goal is unrealistic, say so clearly.
- Point out behavioral patterns and make them actionable. Example: "You're hitting McDonald's ~3x/week averaging ~X EGP/visit — dropping to 2x saves ~Y EGP/month." Use top merchant data + category averages to surface these. Don't just say "spend less on dining" — name the habit and quantify the fix.

## RESPONSE FORMAT
Always respond with valid JSON only — no prose, no markdown, no code blocks.

For savings plans:
{"type":"plan","message":"...","plan":{"target_amount":number,"category_targets":[{"category":"...","current_avg":number,"target":number,"cut":number}],"total_cut":number,"feasibility":"..."}}

For everything else:
{"type":"conversation","message":"..."}`;
}

function extractJSON(text: string): Record<string, unknown> {
  try {
    return JSON.parse(text);
  } catch {
    const stripped = text.replace(/```(?:json)?\n?/g, "").trim();
    try {
      return JSON.parse(stripped);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        try { return JSON.parse(match[0]); } catch { /* fall through */ }
      }
      return { type: "conversation", message: text };
    }
  }
}

export async function POST(req: NextRequest) {
  const { message, conversationHistory = [], goalId } = await req.json();

  if (!message?.trim()) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ error: "DEEPSEEK_API_KEY not configured" }, { status: 500 });
  }

  const ctx = await buildAgentContext();
  const systemPrompt = buildSystemPrompt(ctx);

  const history = (conversationHistory as Array<{ role: string; content: string }>).map((turn) => ({
    role: turn.role === "assistant" ? "assistant" : "user",
    content: turn.content,
  }));

  const messages = [
    { role: "system", content: systemPrompt },
    ...history,
    { role: "user", content: message },
  ];

  const res = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: AGENT_MODEL,
      messages,
      response_format: { type: "json_object" },
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("DeepSeek error:", err);
    return NextResponse.json({ error: "Model call failed", detail: err }, { status: 500 });
  }

  const data = await res.json();
  const responseText: string = data.choices?.[0]?.message?.content ?? "";
  const parsedResponse = extractJSON(responseText);

  // Persist goal when agent returns a plan
  let currentGoalId: string | null = goalId ?? null;
  if (parsedResponse.type === "plan" && parsedResponse.plan && !currentGoalId) {
    const plan = parsedResponse.plan as Record<string, unknown>;
    const now = new Date();
    const monthDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

    const { data: savedGoal } = await supabase
      .from("savings_goals")
      .insert({
        goal_text: message,
        target_amount: plan.target_amount,
        target_currency: "EGP",
        month: monthDate,
        agent_plan: plan,
        status: "active",
      })
      .select("id")
      .single();

    currentGoalId = savedGoal?.id ?? null;
  }

  if (currentGoalId) {
    await supabase.from("agent_conversations").insert([
      { goal_id: currentGoalId, role: "user", content: message },
      { goal_id: currentGoalId, role: "assistant", content: responseText },
    ]);
  }

  return NextResponse.json({ response: parsedResponse, goalId: currentGoalId });
}
