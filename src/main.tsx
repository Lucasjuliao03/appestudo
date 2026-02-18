import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// O service worker será registrado automaticamente pelo vite-plugin-pwa
// Este código é apenas um fallback caso necessário
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("✅ Service Worker registrado:", registration);
      })
      .catch((registrationError) => {
        console.log("❌ Falha ao registrar Service Worker:", registrationError);
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
