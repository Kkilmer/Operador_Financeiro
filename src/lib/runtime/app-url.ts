const LOCAL_FALLBACK_URL = "http://127.0.0.1:3000";

function normalizeBaseUrl(value?: string | null) {
  if (!value) {
    return null;
  }

  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export function getPublicAppUrl() {
  return (
    normalizeBaseUrl(process.env.APP_URL) ??
    normalizeBaseUrl(process.env.RENDER_EXTERNAL_URL) ??
    LOCAL_FALLBACK_URL
  );
}
