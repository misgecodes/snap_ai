import type {
  ExpenseListResponse,
  ExpensePeriodSummary,
  ProcessExpenseResponse,
} from "@/types/expense";

export interface AskExpensesResponse {
  answer: string;
}

async function getApiUrl() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) throw new Error("SnapAI API is not configured.");
  return apiUrl;
}

function getAuthHeaders() {
  const token = localStorage.getItem("access_token");
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function handleApiResponse(response: Response, message: string) {
  if (response.status === 401) {
    localStorage.removeItem("access_token");
    localStorage.removeItem("snapai_user");
    window.location.replace("/login");
    throw new Error("Your session has expired. Please sign in again.");
  }
  if (!response.ok) throw new Error(message);
}

export async function processExpense(imageUrl: string): Promise<ProcessExpenseResponse> {
  const apiUrl = await getApiUrl();
  const response = await fetch(`${apiUrl}/api/v1/ai/process-expense`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ image_url: imageUrl }),
  });
  handleApiResponse(response, "SnapAI could not analyze the receipt.");
  return response.json() as Promise<ProcessExpenseResponse>;
}

export async function getExpenses(): Promise<ExpenseListResponse> {
  const apiUrl = await getApiUrl();
  const response = await fetch(`${apiUrl}/api/v1/ai/expenses`, { cache: "no-store", headers: getAuthHeaders() });
  handleApiResponse(response, "SnapAI could not load your expenses.");
  return response.json() as Promise<ExpenseListResponse>;
}

export async function getExpenseSummary(): Promise<ExpensePeriodSummary> {
  const apiUrl = await getApiUrl();
  const response = await fetch(`${apiUrl}/api/v1/ai/expenses-summary`, { cache: "no-store", headers: getAuthHeaders() });
  handleApiResponse(response, "SnapAI could not load your expense summary.");
  return response.json() as Promise<ExpensePeriodSummary>;
}

export async function askExpenses(question: string): Promise<AskExpensesResponse> {
  const apiUrl = await getApiUrl();
  const response = await fetch(`${apiUrl}/api/v1/ai/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ question }),
  });
  handleApiResponse(response, "SnapAI could not answer that question.");
  return response.json() as Promise<AskExpensesResponse>;
}
