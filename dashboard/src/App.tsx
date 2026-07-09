import { useEffect, useState } from "react";
import { Layout } from "./components/Layout";
import { api } from "./lib/api";
import type { SessionResponse, SessionUser } from "./lib/auth";
import { LoginPage } from "./pages/LoginPage";
import { DashboardHome } from "./pages/DashboardHome";
import { ConversationsPage } from "./pages/ConversationsPage";
import { CustomersPage } from "./pages/CustomersPage";
import { TyreCataloguePage } from "./pages/TyreCataloguePage";
import { HandoffsPage } from "./pages/HandoffsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { PublicLandingPage } from "./pages/PublicLandingPage";
import { JobsSchedulePage } from "./pages/JobsSchedulePage";
import { JobLogPage } from "./pages/JobLogPage";
import { QuotesPage } from "./pages/QuotesPage";
import { UserManagementPage } from "./pages/UserManagementPage";

function route(user: SessionUser) {
  if (window.location.pathname.startsWith("/dashboard/jobs")) {
    return <JobsSchedulePage currentUser={user} />;
  }

  switch (window.location.pathname) {
    case "/dashboard/settings/users":
      return <UserManagementPage currentUser={user} />;
    case "/dashboard/job-log":
      return <JobLogPage currentUser={user} />;
    case "/dashboard/quotes":
      return <QuotesPage currentUser={user} />;
    case "/dashboard/conversations":
      return <ConversationsPage />;
    case "/dashboard/customers":
      return <CustomersPage />;
    case "/dashboard/tyres":
      return <TyreCataloguePage currentUser={user} />;
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
  const [session, setSession] = useState<SessionResponse | null>(isPublicHome ? { authenticated: false, user: null } : null);

  useEffect(() => {
    if (isPublicHome) {
      return;
    }

    api<SessionResponse>("/api/auth/session")
      .then(setSession)
      .catch(() => setSession({ authenticated: false, user: null }));
  }, [isPublicHome]);

  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    setSession({ authenticated: false, user: null });
    window.location.assign("/admin");
  }

  if (isPublicHome) {
    return <PublicLandingPage />;
  }

  if (session === null) {
    return <div className="grid min-h-screen place-items-center text-sm font-semibold text-slate-600">Loading staff area...</div>;
  }

  if (currentPath === "/admin" && session.authenticated) {
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

  if (!session.authenticated || !session.user) {
    if (currentPath.startsWith("/dashboard")) {
      window.location.assign("/admin");
      return <div className="grid min-h-screen place-items-center text-sm font-semibold text-slate-600">Redirecting to staff login...</div>;
    }

    return <LoginPage onLogin={() => window.location.assign("/dashboard")} />;
  }

  return <Layout user={session.user} onLogout={logout}>{route(session.user)}</Layout>;
}
