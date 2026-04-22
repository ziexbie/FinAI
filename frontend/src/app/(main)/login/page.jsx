"use client";

import { useRouter } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import AuthRedirect from "@/components/AuthRedirect";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const handleLogin = async (payload) => {
    const response = await login(payload);
    const redirectPath =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("redirect")
        : null;

    router.push(redirectPath || "/app");
    return response;
  };

  return (
    <AuthRedirect>
      <main className="auth-page">
        <AuthForm
          mode="login"
          title="Sign in to your workspace"
          subtitle="Enter your email and password to continue to the protected dashboard."
          submitLabel="Login"
          alternateText="Need an account?"
          alternateHref="/signup"
          alternateLabel="Create one"
          onSubmit={handleLogin}
        />
      </main>
    </AuthRedirect>
  );
}
