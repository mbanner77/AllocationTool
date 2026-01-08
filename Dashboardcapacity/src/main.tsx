import { createRoot } from "react-dom/client";
import { AppProvider } from "./store/AppContext";
import { LanguageProvider } from "./i18n";
import { ToastProvider } from "./components/ui/Toast";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <LanguageProvider>
    <AppProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </AppProvider>
  </LanguageProvider>
);
  