export class VerificationError extends Error {
  constructor(message: string) { super(message); this.name = "VerificationError"; }
}

/** No provider response bodies, request headers, URLs, or secrets are logged or returned on failure. */
export async function postJson(url: string, headers: Record<string, string>, body: unknown, service: string, timeoutMs = 20000): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST", headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body), redirect: "manual", signal: AbortSignal.timeout(timeoutMs),
    });
  } catch { throw new VerificationError(`${service} could not be reached or timed out. Please try again.`); }
  if (!response.ok) {
    await response.body?.cancel();
    if (response.status === 401 || response.status === 403) throw new VerificationError(`${service} rejected its access key. The project owner needs to update it securely.`);
    if (response.status === 429) throw new VerificationError(`${service} reached a rate or usage limit. Please try again later.`);
    throw new VerificationError(`${service} is unavailable. Please try again later.`);
  }
  try { return await response.json(); }
  catch { throw new VerificationError(`${service} returned an unreadable response.`); }
}