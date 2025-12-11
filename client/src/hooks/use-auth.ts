import { useState, useEffect, useCallback } from "react";
import type { User } from "@shared/schema";
import * as api from "@/lib/api";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      const currentUser = await api.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error("Failed to load user:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const signup = async (name: string, email: string, password: string) => {
    const newUser = await api.signup(name, email, password);
    setUser(newUser);
    return newUser;
  };

  const login = async (email: string, password: string) => {
    const loggedInUser = await api.login(email, password);
    setUser(loggedInUser);
    return loggedInUser;
  };

  const logout = async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
    }
  };

  const deleteAccount = async (confirmEmail: string) => {
    await api.deleteAccount(confirmEmail);
    setUser(null);
  };

  const updateProfile = async (updates: Partial<User>) => {
    const updatedUser = await api.updateProfile(updates);
    setUser(updatedUser);
    return updatedUser;
  };

  const refreshUser = async () => {
    await loadUser();
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    signup,
    login,
    logout,
    deleteAccount,
    updateProfile,
    refreshUser,
  };
}
