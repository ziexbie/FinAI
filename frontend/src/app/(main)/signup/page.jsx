"use client";

import { useRouter } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import AuthRedirect from "@/components/AuthRedirect";
import { useAuth } from "@/context/AuthContext";

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();

  const handleSignup = async (payload) => {
    const response = await signup(payload);
    router.push("/app");
    return response;
  };

  return (
    <AuthRedirect>
      <main className="auth-page">
        <AuthForm
          mode="signup"
          title="Create your account"
          subtitle="Sign up with your name, email, and password to start an authenticated session."
          submitLabel="Signup"
          alternateText="Already have an account?"
          alternateHref="/login"
          alternateLabel="Login"
          onSubmit={handleSignup}
        />
      </main>
    </AuthRedirect>
  );
}
