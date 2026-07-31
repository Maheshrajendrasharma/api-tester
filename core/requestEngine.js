const supportedMethods = new Set(["GET", "POST", "PUT", "PATCH", "DELETE"]);

export async function execute(request) {
  const { method, url, headers = {}, body = "" } = request ?? {};

  if (!supportedMethods.has(method)) {
    throw new Error("Unsupported HTTP method.");
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error("Please enter a valid request URL.");
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error("Only HTTP and HTTPS URLs are supported.");
  }

  const requestOptions = { method, headers };
  if (body && method !== "GET") {
    requestOptions.body = body;
  }

  const startedAt = performance.now();
  const response = await fetch(parsedUrl, requestOptions);
  const responseBody = await response.text();

  return {
    status: response.status,
    statusText: response.statusText,
    headers: Object.fromEntries(response.headers.entries()),
    responseBody,
    responseTime: Math.round(performance.now() - startedAt),
    responseSize: Buffer.byteLength(responseBody, "utf8"),
  };
}
