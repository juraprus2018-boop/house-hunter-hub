import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const clearDevServiceWorkers = async () => {
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  } catch {}

  if ("caches" in window) {
    try {
      const cacheKeys = await caches.keys();
      await Promise.all(cacheKeys.map((cacheKey) => caches.delete(cacheKey)));
    } catch {}
  }
};

if ("serviceWorker" in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    });
  } else {
    clearDevServiceWorkers().catch(() => {});
  }
}

createRoot(document.getElementById("root")!).render(<App />);
