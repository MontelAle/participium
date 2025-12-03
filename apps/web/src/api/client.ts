export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const isFormData = options.body instanceof FormData;

  const headers = isFormData
    ? options.headers || {}
    : {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      };

  const res = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Network error' }));
    const errorMessage = Array.isArray(error.message)
      ? error.message[0]
      : error.message || `Request failed with status ${res.status}`;
    throw new Error(errorMessage);
  }

  return res.json() as Promise<T>;
}
