export const CATEGORIES = [
  "Groceries",
  "Dining Out",
  "Online Food Delivery",
  "Transportation",
  "Bills & Utilities",
  "Health & Wellness",
  "Subscriptions",
  "Instapay Transfers",
  "Cash Withdrawal",
  "Rent",
  "Loans & Installments",
  "Fuel",
  "Others",
  "Investments",
  "Finishing Appartment",
] as const;

export type CategoryName = (typeof CATEGORIES)[number];

export const CATEGORY_COLORS: Record<string, string> = {
  Groceries: "#10B981",
  "Dining Out": "#F59E0B",
  "Online Food Delivery": "#EF4444",
  Transportation: "#3B82F6",
  "Bills & Utilities": "#8B5CF6",
  "Health & Wellness": "#EC4899",
  Subscriptions: "#06B6D4",
  "Instapay Transfers": "#6366F1",
  "Cash Withdrawal": "#78716C",
  Rent: "#F97316",
  "Loans & Installments": "#DC2626",
  Fuel: "#14B8A6",
  Others: "#A1A1AA",
  Investments: "#22C55E",
  "Finishing Appartment": "#D97706",
};

export const BUDGET_AMOUNTS: Record<string, number> = {
  Groceries: 1000,
  "Dining Out": 1000,
  "Online Food Delivery": 1000,
  Transportation: 1000,
  "Bills & Utilities": 1000,
  "Health & Wellness": 1000,
  Subscriptions: 1000,
  "Instapay Transfers": 1000,
  "Cash Withdrawal": 1000,
  Rent: 16450,
  "Loans & Installments": 41000,
  Fuel: 5000,
  Others: 1000,
  Investments: 30000,
  "Finishing Appartment": 1000,
};

// Approximate EGP conversion rates — update when rate drifts significantly
export const FX_RATES_TO_EGP: Record<string, number> = {
  USD: 50.5,
  EUR: 55.0,
  GBP: 64.0,
};

export const CATEGORY_SLUGS: Record<string, string> = {
  Groceries: "groceries",
  "Dining Out": "dining-out",
  "Online Food Delivery": "online-food-delivery",
  Transportation: "transportation",
  "Bills & Utilities": "bills-utilities",
  "Health & Wellness": "health-wellness",
  Subscriptions: "subscriptions",
  "Instapay Transfers": "instapay-transfers",
  "Cash Withdrawal": "cash-withdrawal",
  Rent: "rent",
  "Loans & Installments": "loans-installments",
  Fuel: "fuel",
  Others: "others",
  Investments: "investments",
  "Finishing Appartment": "finishing-appartment",
};

export const SLUG_TO_CATEGORY: Record<string, string> = Object.fromEntries(
  Object.entries(CATEGORY_SLUGS).map(([cat, slug]) => [slug, cat])
);

// Categories where more spending = positive behavior (inverts mover direction coloring)
export const BENEFICIAL_CATEGORIES = ["Investments"] as const;
