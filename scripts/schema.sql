-- Expense Tracker Database Schema
-- Run this in Supabase SQL Editor to set up the database

-- transactions: the core table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  merchant_name TEXT,
  amount DECIMAL(10,2) NOT NULL,
  transaction_date DATE NOT NULL,
  year_month TEXT GENERATED ALWAYS AS (to_char(transaction_date, 'YYYY-MM')) STORED,
  created_at TIMESTAMPTZ DEFAULT now(),
  -- composite unique for idempotent inserts (dedup if Make retries)
  UNIQUE(merchant_name, amount, transaction_date)
);

-- budgets: reference table, seeded once
CREATE TABLE IF NOT EXISTS budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT UNIQUE NOT NULL,
  budgeted_amount DECIMAL(10,2) NOT NULL
);

-- indexes for common queries
CREATE INDEX IF NOT EXISTS idx_txn_year_month ON transactions(year_month);
CREATE INDEX IF NOT EXISTS idx_txn_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_txn_date ON transactions(transaction_date);

-- Enable RLS (Row Level Security) — for single-user MVP, allow all
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anon key (single-user app)
CREATE POLICY "Allow all for transactions" ON transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for budgets" ON budgets FOR ALL USING (true) WITH CHECK (true);
