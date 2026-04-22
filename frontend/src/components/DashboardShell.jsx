"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCurrency } from "@/context/CurrencyContext";

const navGroups = [
  {
    label: "Workspace",
    links: [
      { href: "/app", label: "Overview" },
      { href: "/finance", label: "Financial Input" },
      { href: "/records", label: "Saved Records" },
    ],
  },
  {
    label: "Account",
    links: [{ href: "/profile", label: "Profile" }],
  },
];

export default function DashboardShell({ title, description, children }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { currency, currencyOptions, setCurrency } = useCurrency();

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-top">
          <Link className="brand-link" href="/">
            <div className="brand-block minimal">
              <div className="brand-mark">AI</div>
              <div>
                <h2>Risk Manager</h2>
                <p className="brand-subtitle">Financial workspace</p>
              </div>
            </div>
          </Link>
        </div>

        <div className="sidebar-middle">
          {navGroups.map((group) => (
            <div className="nav-group" key={group.label}>
              <p className="nav-group-label">{group.label}</p>
              <nav className="sidebar-nav">
                {group.links.map((link) => (
                  <Link
                    key={link.href}
                    className={pathname === link.href ? "nav-link active" : "nav-link"}
                    href={link.href}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          <div className="user-card compact">
            <p>{user?.name}</p>
            <span>{user?.email}</span>
          </div>
          <label className="sidebar-select">
            <span>Currency</span>
            <select value={currency} onChange={(event) => setCurrency(event.target.value)}>
              {currencyOptions.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.code}
                </option>
              ))}
            </select>
          </label>
          <div className="sidebar-actions">
            <button className="secondary-button" onClick={logout} type="button">
              Logout
            </button>
          </div>
        </div>
      </aside>

      <main className="content">
        <header className="page-header shell-header">
          <div className="page-heading">
            <p className="eyebrow">Workspace</p>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
          <div className="header-meta">
            <Link className="secondary-button" href="/">
              Landing page
            </Link>
            <span className="meta-chip">{currency}</span>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}
