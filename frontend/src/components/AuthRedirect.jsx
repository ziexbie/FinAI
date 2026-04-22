"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function AuthRedirect({ children }) {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      const redirectPath =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("redirect")
          : null;

      router.replace(redirectPath || "/app");
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return <div className="shell-message">Loading authentication...</div>;
  }

  if (isAuthenticated) {
    return null;
  }

  return children;
}
