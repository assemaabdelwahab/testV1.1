export interface Transaction {
  id: string;
  category: string;
  merchant_name: string | null;
  amount: number;
  transaction_date: string;
  year_month: string;
  created_at: string;
  category_source?: string;
  currency?: string;
}

export interface CategoryCorrection {
  id: string;
  merchant_pattern: string;
  correct_category: string;
  match_type: 'exact' | 'contains';
  source: 'manual' | 'seeded';
  created_at: string;
}

export interface Budget {
  id: string;
  category: string;
  budgeted_amount: number;
}

export interface CategorySpend {
  category: string;
  total: number;
  count: number;
}

export interface MonthlySpend {
  year_month: string;
  total: number;
}

export interface MonthlyCategorySpend {
  year_month: string;
  category: string;
  total: number;
}

export interface BudgetComparison {
  category: string;
  budgeted_amount: number;
  actual: number;
  remaining: number;
  percentage: number;
}

export interface QuarterInfo {
  label: string;
  quarter: number;
  year: number;
  months: string[];
  monthLabels: string[];
  key: string;
}

export interface MerchantGroup {
  merchant_name: string;
  total: number;
  count: number;
  transactions: Transaction[];
}
