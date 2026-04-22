"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api, { setAuthToken } from "@/lib/api";
import { getStoredToken, removeToken, storeToken } from "@/lib/auth";

const AuthContext = createContext(null);

const normalizeUser = (user) => {
  if (!user) {
    return null;
  }

  return {
    ...user,
    id: user.id || user._id,
  };
};

export function AuthProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const syncSession = async (activeToken) => {
    try {
      // Rehydrate the user from the protected API whenever the app boots with a stored token.
      setAuthToken(activeToken);
      const response = await api.get("/auth/me");
      setUser(normalizeUser(response.data.user));
      setToken(activeToken);
      return normalizeUser(response.data.user);
    } catch (error) {
      removeToken();
      setAuthToken(null);
      setToken(null);
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedToken = getStoredToken();

    if (!storedToken) {
      setLoading(false);
      return;
    }

    syncSession(storedToken);
  }, []);

  const saveSession = async (nextToken, nextUser) => {
    storeToken(nextToken);
    setAuthToken(nextToken);
    setToken(nextToken);
    setUser(normalizeUser(nextUser));

    if (!nextUser) {
      await syncSession(nextToken);
    } else {
      setLoading(false);
    }
  };

  const signup = async (payload) => {
    const response = await api.post("/auth/signup", payload);
    await saveSession(response.data.token, response.data.user);
    return response.data;
  };

  const login = async (payload) => {
    const response = await api.post("/auth/login", payload);
    await saveSession(response.data.token, response.data.user);
    return response.data;
  };

  const logout = () => {
    removeToken();
    setAuthToken(null);
    setToken(null);
    setUser(null);
    router.push("/login");
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(token && user),
    signup,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
