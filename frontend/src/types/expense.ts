export interface ProcessExpenseResponse {
  merchant: string | null;
  reason: string | null;
  amount: number | null;
  category: string | null;
  currency: string | null;
  date: string | null;
}

export interface Expense {
  id: string;
  image_url: string;
  merchant: string | null;
  amount: number | null;
  currency: string;
  expense_date: string | null;
  reason: string | null;
  category: string | null;
  confidence: number | null;
  created_at: string;
}

export interface CategorySummary {
  category: string;
  totals_by_currency: Record<string, number>;
  count: number;
}

export interface ExpenseListResponse {
  expenses: Expense[];
  summary: CategorySummary[];
}
