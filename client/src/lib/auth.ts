import { getUserByEmail, createUser, getUser, updateUser, clearAllUserData } from "./db";
import type { User } from "@shared/schema";

const AUTH_TOKEN_KEY = "studyflow_auth_token";

export function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(userId: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, userId);
}

export function clearAuthToken(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

export async function getCurrentUser(): Promise<User | null> {
  const userId = getAuthToken();
  if (!userId) return null;
  
  const user = await getUser(userId);
  return user || null;
}

export async function signup(name: string, email: string, password: string): Promise<User> {
  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    throw new Error("An account with this email already exists");
  }
  
  const user = await createUser({
    name,
    email,
    password,
    isPremium: false,
    hasCompletedSetup: false,
  });
  
  setAuthToken(user.id);
  return user;
}

export async function login(email: string, password: string): Promise<User> {
  const user = await getUserByEmail(email);
  if (!user) {
    throw new Error("No account found with this email");
  }
  
  if (user.password !== password) {
    throw new Error("Incorrect password");
  }
  
  setAuthToken(user.id);
  return user;
}

export function logout(): void {
  clearAuthToken();
}

export async function deleteAccount(userId: string, confirmEmail: string): Promise<void> {
  const user = await getUser(userId);
  if (!user) {
    throw new Error("User not found");
  }
  
  if (user.email !== confirmEmail) {
    throw new Error("Email does not match");
  }
  
  await clearAllUserData(userId);
  clearAuthToken();
}

export async function updateUserProfile(userId: string, updates: Partial<User>): Promise<User> {
  const user = await getUser(userId);
  if (!user) {
    throw new Error("User not found");
  }
  
  const updatedUser = { ...user, ...updates };
  await updateUser(updatedUser);
  return updatedUser;
}
