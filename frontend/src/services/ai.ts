import type { ExpenseListResponse, ExpensePeriodSummary, ProcessExpenseResponse } from "@/types/expense";

async function getApiUrl() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) throw new Error("SnapAI API is not configured.");
  return apiUrl;
}

export async function processExpense(imageUrl: string): Promise<ProcessExpenseResponse> {
  const apiUrl = await getApiUrl();
  const response = await fetch(`${apiUrl}/api/v1/ai/process-expense`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_url: imageUrl }),
  });
  if (!response.ok) throw new Error("SnapAI could not analyze the receipt.");
  return response.json() as Promise<ProcessExpenseResponse>;
}

export async function getExpenses(): Promise<ExpenseListResponse> {
  const apiUrl = await getApiUrl();
  const response = await fetch(`${apiUrl}/api/v1/ai/expenses`, { cache: "no-store" });
  if (!response.ok) throw new Error("SnapAI could not load your expenses.");
  return response.json() as Promise<ExpenseListResponse>;
}

export async function getExpenseSummary(): Promise<ExpensePeriodSummary> {
  const apiUrl = await getApiUrl();
  const response = await fetch(`${apiUrl}/api/v1/ai/expenses-summary`, { cache: "no-store" });
  if (!response.ok) throw new Error("SnapAI could not load your expense summary.");
  return response.json() as Promise<ExpensePeriodSummary>;
}
