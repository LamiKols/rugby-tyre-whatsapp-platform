import {
  Gauge,
  MessageCircle,
  Settings,
  Siren,
  Tags,
  Users
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard Home", icon: Gauge },
  { href: "/dashboard/conversations", label: "Conversations", icon: MessageCircle },
  { href: "/dashboard/customers", label: "Customers", icon: Users },
  { href: "/dashboard/tyres", label: "Tyre Catalogue", icon: Tags },
  { href: "/dashboard/handoffs", label: "Handoffs", icon: Siren },
  { href: "/dashboard/settings", label: "Settings", icon: Settings }
];

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
}

export function Layout({ children, onLogout }: LayoutProps) {
  const currentPath = window.location.pathname;

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-slate-200 bg-white px-5 py-6 lg:block">
        <div className="rounded-lg bg-whatsapp-50 p-4">
          <p className="text-sm font-semibold text-whatsapp-700">Rugby Tyre Services</p>
          <h1 className="mt-1 text-xl font-bold text-charcoal">WhatsApp Operations</h1>
        </div>
        <nav className="mt-6 space-y-1">
          {navItems.map((item) => {
            const active = currentPath === item.href;
            const Icon = item.icon;

            return (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition ${
                  active
                    ? "bg-whatsapp-600 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-charcoal"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </a>
            );
          })}
        </nav>
        <button className="button-secondary mt-8 w-full" onClick={onLogout}>
          Sign out
        </button>
      </aside>

      <header className="border-b border-slate-200 bg-white px-4 py-4 lg:hidden">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-whatsapp-700">Rugby Tyre Services</p>
            <h1 className="text-lg font-bold">WhatsApp Operations</h1>
          </div>
          <button className="button-secondary" onClick={onLogout}>
            Sign out
          </button>
        </div>
        <nav className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"
              >
                <Icon className="h-4 w-4 text-whatsapp-600" />
                {item.label.replace("Dashboard Home", "Home")}
              </a>
            );
          })}
        </nav>
      </header>

      <main className="px-4 py-6 lg:ml-72 lg:px-8">{children}</main>
    </div>
  );
}

