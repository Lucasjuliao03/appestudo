import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// O service worker será registrado automaticamente pelo vite-plugin-pwa
// Não registrar manualmente para evitar conflitos

createRoot(document.getElementById("root")!).render(<App />);
