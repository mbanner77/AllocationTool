import { createRoot } from "react-dom/client";
import { AppProvider } from "./store/AppContext";
import { LanguageProvider } from "./i18n";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <LanguageProvider>
    <AppProvider>
      <App />
    </AppProvider>
  </LanguageProvider>
);
  