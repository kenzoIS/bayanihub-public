const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004/api/v1';

export async function apiFetch<T = any>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const token =
    typeof window !== 'undefined'
      ? sessionStorage.getItem('admin-token')
      : null;

  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
    ...options,
  });

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('admin-token');
      window.location.href = '/login';
    }
    throw new Error('Unauthorised');
  }

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}
