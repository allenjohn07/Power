type FetchJsonOptions = {
  retries?: number;
  retryDelayMs?: number;
  signal?: AbortSignal;
};

export async function fetchJson<T>(
  url: string,
  options: FetchJsonOptions = {},
): Promise<T> {
  const { retries = 2, retryDelayMs = 400, signal } = options;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }

    try {
      const res = await fetch(url, { cache: "no-store", signal });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          typeof data?.error === "string" ? data.error : `HTTP ${res.status}`,
        );
      }
      return data as T;
    } catch (err) {
      if (signal?.aborted) throw err;
      lastError = err;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, retryDelayMs * (attempt + 1)));
      }
    }
  }

  throw lastError;
}
