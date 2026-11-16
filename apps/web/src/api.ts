export type ApiConfig = { baseUrl: string };
export const API: ApiConfig = {baseUrl: import.meta.env.VITE_API_URL || "http://localhost:8000"};

export async function getCatalog(signal?: AbortSignal) {
  const response = await fetch(API.baseUrl + "/api/v1/medicines", {signal});
  if (!response.ok) throw new Error("Inventory sync failed (" + response.status + ")");
  return response.json();
}
