export function getApiOrigin(): string {
  const explicitOrigin = process.env.NEXT_PUBLIC_API_ORIGIN;
  if (explicitOrigin) return explicitOrigin.replace(/\/$/, "");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
  try {
    return new URL(apiUrl).origin;
  } catch {
    return "";
  }
}

export function getPublicFileUrl(fileUrl?: string | null): string {
  if (!fileUrl) return "";
  if (/^https?:\/\//i.test(fileUrl) || fileUrl.startsWith("data:")) return fileUrl;

  const origin = getApiOrigin();
  const cleanPath = fileUrl.startsWith("/") ? fileUrl : `/${fileUrl}`;

  return origin ? `${origin}${cleanPath}` : cleanPath;
}
