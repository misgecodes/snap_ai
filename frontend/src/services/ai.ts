import type { ProcessReceiptResponse } from "@/types/expense";

export async function processReceipt(imageUrl: string): Promise<ProcessReceiptResponse> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) throw new Error("SnapAI API is not configured.");

  const response = await fetch(`${apiUrl}/api/v1/ai/process-receipt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_url: imageUrl }),
  });
  if (!response.ok) throw new Error("SnapAI could not analyze the receipt.");
  return response.json() as Promise<ProcessReceiptResponse>;
}
