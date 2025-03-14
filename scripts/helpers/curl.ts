import { delay } from "./delay.js";

type CurlResult<T = never> = {
  status: number;
  statusText: string;
  error: Error | undefined;
  body: T
}

type CurlOptions = {
  config? : RequestInit;
  type?: {
    json?: boolean;
    text?: boolean;
    buffer?: boolean;
  },
  cache?: boolean
  retries?: number;
}

const cacheResults = new Map<string, CurlResult>();

export const curl = async <T>(url: string, options: CurlOptions = {}): Promise<CurlResult<T>> => {
  const retries = options["retries"] || 3;
  const cache = options["cache"] || false;
  const config = options["config"] || { method: "GET" };


  const cacheKey = `${config.method} ${url}`;

  if (cache) {
    if (cacheResults.has(cacheKey)) return cacheResults.get(cacheKey) as CurlResult<T>;
  }

  let output = "json";

  if (options["type"]) {
    if (Object.keys(options.type).length > 1)
      throw new Error(`Invalid type option, only one can be used, received: ${JSON.stringify(options.type, null, 2)}`);

    output = Object.keys(options.type)[0];
  }

  let status = 200;
  let statusText = "";
  let body: T;
  let error;

  for (let i = 0; i < retries; i++) {
    if (i > 0) await delay(1000 * (i + 1));

    let response: Response;
    try {
      response = await fetch(url, config);
    } catch (cause) {
      // DebugLog("$", "curl", href, "-> error");
      error = new Error(`Fetch failed: ${config.method} ${url}`, { cause });
      continue;
    }

    status = response["status"];
    statusText = response["statusText"];
    // DebugLog("$", "curl", href, "->", status, statusText);

    const ok = response["ok"];

    try {
      if (output === "buffer" && ok) body = await response.arrayBuffer() as T;
      else if (output === "json" && ok) body = await response.json() as T;
      else body = await response.text() as T;
    } catch (cause) {
      error = new Error(`Fetch failed: ${config.method} ${url}`, { cause });
      continue;
    }

    if (response["ok"]) break;

    error = new Error(`Fetch failed: ${config.method} ${url}: ${status} ${statusText}`, { cause: body });

    if (status === 400 || status === 404 || status === 422) break;

  }

  if (cache) {
    cacheResults.set(cacheKey, { status, statusText, error, body });
  }

  return {
    status,
    statusText,
    error,
    body,
  } as CurlResult<T>;
};