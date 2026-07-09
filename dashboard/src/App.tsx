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
import { PublicLandingPage } from "./pages/PublicLandingPage";
import { JobsSchedulePage } from "./pages/JobsSchedulePage";

function route() {
  if (window.location.pathname.startsWith("/dashboard/jobs")) {
    return <JobsSchedulePage />;
  }

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
  const currentPath = window.location.pathname;
  const isPublicHome = currentPath === "/";
  const [authenticated, setAuthenticated] = useState<boolean | null>(isPublicHome ? false : null);

  useEffect(() => {
    if (isPublicHome) {
      return;
    }

    api<{ authenticated: boolean }>("/api/auth/session")
      .then((session) => setAuthenticated(session.authenticated))
      .catch(() => setAuthenticated(false));
  }, [isPublicHome]);

  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    setAuthenticated(false);
  }

  if (isPublicHome) {
    return <PublicLandingPage />;
  }

  if (authenticated === null) {
    return <div className="grid min-h-screen place-items-center text-sm font-semibold text-slate-600">Loading staff area...</div>;
  }

  if (currentPath === "/admin" && authenticated) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 px-4">
        <section className="panel w-full max-w-md p-6">
          <p className="text-sm font-semibold text-whatsapp-700">Rugby Tyre Services</p>
          <h1 className="mt-1 text-2xl font-bold">You are signed in</h1>
          <p className="mt-2 text-sm text-slate-600">Open the WhatsApp operations dashboard or sign out.</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a className="button-primary" href="/dashboard">
              Open dashboard
            </a>
            <button className="button-secondary" onClick={logout}>
              Sign out
            </button>
          </div>
          <a className="mt-5 inline-flex text-sm font-semibold text-slate-600 transition hover:text-whatsapp-700" href="/">
            Back to public site
          </a>
        </section>
      </main>
    );
  }

  if (!authenticated) {
    return <LoginPage onLogin={() => window.location.assign("/dashboard")} />;
  }

  return <Layout onLogout={logout}>{route()}</Layout>;
}
