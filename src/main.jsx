import { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { ToastProvider } from "./components/ui.jsx";
import { useRoute, TG, go } from "./lib/util.js";
import Landing from "./pages/Landing.jsx";
import TableEntry from "./pages/Table.jsx";
import Menu from "./pages/Menu.jsx";
import Status from "./pages/Status.jsx";
import AppHome, { parseTarget } from "./pages/AppHome.jsx";
import Kitchen from "./pages/Kitchen.jsx";
import Admin from "./pages/Admin.jsx";
import Auth from "./pages/Auth.jsx";

// Telegram Mini App: startapp=slug__CODE → to'g'ridan-to'g'ri menyu
(function boot() {
  const sp = TG?.initDataUnsafe?.start_param || new URLSearchParams(location.search).get("tgWebAppStartParam");
  const h = location.hash.replace(/^#/, "");
  if (sp && (!h || h === "/" || h === "/app")) {
    const t = parseTarget(sp);
    if (t) go(`/m/${t.slug}/${t.code}`);
  } else if (TG?.initData && (!h || h === "/")) go("/app");
})();

function App() {
  const path = useRoute();
  const p = path.split("/").filter(Boolean);
  useEffect(() => { window.scrollTo(0, 0); }, [path]);
  switch (p[0]) {
    case undefined: return <Landing />;
    case "t": return <TableEntry key={path} slug={p[1]} code={p[2] || ""} />;
    case "m": return <Menu key={path} slug={p[1]} code={p[2] || ""} />;
    case "o": return <Status key={path} token={p[1]} />;
    case "app": return <AppHome />;
    case "kitchen": return <Kitchen />;
    case "admin": return <Admin />;
    case "login": return <Auth key="l" mode="login" />;
    case "register": return <Auth key="r" mode="register" />;
    default: return <Landing />;
  }
}

createRoot(document.getElementById("root")).render(<ToastProvider><App /></ToastProvider>);
