export interface ProcessReceiptResponse {
  merchant: string | null;
  reason: string | null;
  amount: number | null;
  category: string | null;
  currency: string | null;
  date: string | null;
}

export interface Expense extends ProcessReceiptResponse {
  id: string;
}
