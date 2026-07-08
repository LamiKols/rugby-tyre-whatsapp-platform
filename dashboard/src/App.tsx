import { useEffect, useState } from "react";
import { Layout } from "./components/Layout";
import { api } from "./lib/api";
import { LoginPage } from "./pages/LoginPage";
import { DashboardHome } from "./pages/DashboardHome";
import { ConversationsPage } from "./pages/ConversationsPage";
import { CustomersPage } from "./pages/CustomersPage";
import { TyreCataloguePage } from "./pages/TyreCataloguePage";
import { HandoffsPage } from "./pages/HandoffsPage";
import { SettingsPage } from "./pages/SettingsPage";

function route() {
  switch (window.location.pathname) {
    case "/dashboard/conversations":
      return <ConversationsPage />;
    case "/dashboard/customers":
      return <CustomersPage />;
    case "/dashboard/tyres":
      return <TyreCataloguePage />;
    case "/dashboard/handoffs":
      return <HandoffsPage />;
    case "/dashboard/settings":
      return <SettingsPage />;
    default:
      return <DashboardHome />;
  }
}

export function App() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    api<{ authenticated: boolean }>("/api/auth/session")
      .then((session) => setAuthenticated(session.authenticated))
      .catch(() => setAuthenticated(false));
  }, []);

  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    setAuthenticated(false);
  }

  if (authenticated === null) {
    return <div className="grid min-h-screen place-items-center text-sm font-semibold text-slate-600">Loading dashboard...</div>;
  }

  if (!authenticated) {
    return <LoginPage onLogin={() => setAuthenticated(true)} />;
  }

  return <Layout onLogout={logout}>{route()}</Layout>;
}

