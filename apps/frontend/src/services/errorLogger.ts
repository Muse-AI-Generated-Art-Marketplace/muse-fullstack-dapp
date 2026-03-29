export interface FrontendErrorLog {
  message: string;
  stack?: string;
  componentStack?: string;
  source?: string;
  lineno?: number;
  colno?: number;
  userAgent?: string;
  url?: string;
  timestamp?: string;
}

export const logError = async (error: FrontendErrorLog): Promise<void> => {
  try {
    await fetch(`${import.meta.env.VITE_API_URL}/logs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...error,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (err) {
    console.error("Logging failed:", err);
  }
};
