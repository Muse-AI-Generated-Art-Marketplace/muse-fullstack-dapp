import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import App from "./App";
import "./index.css";
import "./i18n";
import { logError } from "./services/errorLogger";

// Runtime JS errors
window.onerror = (
  message: string | Event,
  source?: string,
  lineno?: number,
  colno?: number,
  error?: Error
) => {
  logError({
    message: typeof message === "string" ? message : "Unknown error",
    source,
    lineno,
    colno,
    stack: error?.stack,
  });
};

// Unhandled promises
window.onunhandledrejection = (event: PromiseRejectionEvent) => {
  logError({
    message:
      event.reason?.message || "Unhandled Promise Rejection",
    stack: event.reason?.stack,
  });
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </HelmetProvider>
  </React.StrictMode>,
);
