export type UserProfile = {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function clearAuth() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("snapai_user");
}

export async function getCurrentUser(): Promise<UserProfile> {
  if (!API_URL) throw new Error("SnapAI API is not configured.");

  const token = localStorage.getItem("access_token");
  if (!token) {
    window.location.replace("/login");
    throw new Error("Authentication is required.");
  }

  const response = await fetch(`${API_URL}/api/v1/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (response.status === 401) {
    clearAuth();
    window.location.replace("/login");
    throw new Error("Your session has expired. Please sign in again.");
  }

  if (!response.ok) throw new Error("SnapAI could not load your profile.");
  return response.json() as Promise<UserProfile>;
}

export function logout() {
  clearAuth();
  window.location.replace("/login");
}
