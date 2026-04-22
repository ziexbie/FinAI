"use client";

import DashboardShell from "@/components/DashboardShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { useCurrency } from "@/context/CurrencyContext";

export default function ProfilePage() {
  const { user } = useAuth();
  const { currency } = useCurrency();

  return (
    <ProtectedRoute>
      <DashboardShell
        title="Profile"
        description="Account and workspace preferences."
      >
        <section className="profile-layout">
          <article className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Account</p>
                <h3>Personal details</h3>
              </div>
            </div>

            <div className="detail-row">
              <span>Name</span>
              <strong>{user?.name}</strong>
            </div>
            <div className="detail-row">
              <span>Email</span>
              <strong>{user?.email}</strong>
            </div>
          </article>

          <article className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Preferences</p>
                <h3>Workspace settings</h3>
              </div>
            </div>

            <div className="detail-row">
              <span>Currency</span>
              <strong>{currency}</strong>
            </div>
            <div className="detail-row">
              <span>Theme</span>
              <strong>Dark only</strong>
            </div>
            <div className="detail-row">
              <span>Access</span>
              <strong>Protected</strong>
            </div>
          </article>
        </section>
      </DashboardShell>
    </ProtectedRoute>
  );
}
