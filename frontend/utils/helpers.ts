export const getBaseUrl = (options?: { isBackendAPI: boolean }) => {
  if (options?.isBackendAPI) {
    return process.env.NEXT_PUBLIC_BACKEND_API_URL ?? "http://localhost:8000";
  }

  if (process.env.NEXT_PUBLIC_BASE_API_URL) {
    return process.env.NEXT_PUBLIC_BASE_API_URL;
  }

  // Fallback, ensure one of these is always set in .env
  return process.env.NEXT_PUBLIC_BASE_API_URL || "http://localhost:3000"; // Example fallback
};
