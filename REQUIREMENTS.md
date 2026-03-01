# Expense Tracker MVP — Requirements & Documentation

## Overview

A personal expense tracking dashboard that visualises spending data pulled from a Google Sheet (via Supabase). Dark-themed, mobile-friendly, privacy-aware.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, React 19) |
| Styling | Tailwind CSS 3.4 |
| Charts | Recharts 3.7 |
| Database | Supabase (PostgreSQL) |
| Data Source | Google Sheets → seed script |
| Hosting | Vercel |
| Currency | EGP (Egyptian Pound) |

## Pages & Routes

### 1. Summary Dashboard (`/`)
- 4 KPI cards: Total Spend, Avg Monthly, vs Previous Quarter, Top Category
- Stacked bar chart — monthly spend grouped by category
- Category heatmap table — intensity-coloured cells, clickable to drilldown
- Sparkline trends — last 6 months per category
- Quarter selector (Q1–Q4) with previous quarter comparison

### 2. Spending Trends (`/trends`)
- 2 KPI cards: This Month total, vs Last Month (with trend arrow)
- 12-month area chart with toggle between stacked and total views
- Category filter buttons (multi-select, with "Clear" reset)

### 3. Category Breakdown (`/categories`)
- Donut chart of spending by category (clickable slices)
- Category list with transaction counts and percentage shares
- Month selector navigation

### 4. Category Drilldown (`/categories/[slug]`)
- Category header with colour indicator and total
- Mini bar chart — last 6 months history for the category
- Merchants grouped by merchant name with individual transactions
- Back button navigation

### 5. Budget vs Actual (`/budget`)
- 4 KPI cards: Total Budget, Total Spent, % Used (excl. Investments), Over-Budget count
- Progress bars per category — colour-coded green/yellow/red by utilisation
- Special handling for "Investments" (shown as savings target, not expense)
- Month selector navigation

### 6. API — Add Transaction (`POST /api/transactions`)
- Accepts `{ category, merchant_name, amount, transaction_date }`
- Validates required fields, returns 400 on missing data
- Designed for Make.com webhook integration

## Cross-Cutting Features

### Privacy Toggle
- Eye icon in the header toggles privacy mode
- All monetary amounts masked with "••••••" when active
- Persisted in localStorage
- Integrated across every chart and component

### Responsive Layout
- **Desktop**: 56px fixed sidebar with icon + label navigation
- **Mobile**: Fixed bottom tab bar (4 tabs)
- Breakpoint: Tailwind `md:`

### Loading States
- React Suspense boundaries on every page
- Skeleton components: CardSkeleton, ChartSkeleton, TableSkeleton

### Navigation
- 4 main sections: Dashboard, Trends, Categories, Budget
- Interactive chart elements link to drilldown views
- URL query params for state (month, quarter)

## Data Model

### `transactions` table
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Auto-generated |
| category | TEXT | One of 14 defined categories |
| merchant_name | TEXT | Store/vendor name |
| amount | DECIMAL(10,2) | Transaction amount |
| transaction_date | DATE | When the transaction occurred |
| year_month | TEXT | Generated column (`YYYY-MM`) |
| created_at | TIMESTAMPTZ | Auto-generated |

Unique constraint on `(merchant_name, amount, transaction_date)` for idempotent upserts.

### `budgets` table
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Auto-generated |
| category | TEXT | Unique per category |
| budgeted_amount | DECIMAL(10,2) | Monthly budget target |

### 14 Categories
Groceries, Dining Out, Transportation, Entertainment, Shopping, Health & Fitness, Utilities, Subscriptions, Personal Care, Education, Gifts & Donations, Travel, Rent, Loans, Investments

## Seed Script (`npm run seed`)
- Reads transaction data from a Google Sheet via Google Sheets API
- Parses flexible column headers and multiple date formats
- Bulk inserts to Supabase in batches of 500
- Seeds budgets table with default amounts from `lib/constants.ts`

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=         # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # Supabase anon/public key
GOOGLE_SERVICE_ACCOUNT_EMAIL=     # For seed script only
GOOGLE_PRIVATE_KEY=               # For seed script only
```

## Design System

- **Background**: Dark navy (#0F172A) with card surfaces (#1E293B)
- **Text**: Light (#F8FAFC) primary, muted gray (#94A3B8) secondary
- **Accents**: Green (positive), Red (negative/over-budget), Yellow (warning)
- **Font**: Inter (body), "Press Start 2P" (pixel accent in header)
- **Category colours**: 14 distinct hex colours consistent across all charts
