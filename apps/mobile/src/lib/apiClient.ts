import * as SecureStore from "expo-secure-store";
import { hc } from "hono/client";
import type { AppType } from "../../../api/src/index";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";
const ACCESS_TOKEN_KEY = "habit_access_token";
const REFRESH_TOKEN_KEY = "habit_refresh_token";
const USER_EMAIL_KEY = "habit_user_email";

export const apiClient = hc<AppType>(API_URL);

export type StoredAuth = {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly email: string;
};

export async function saveAuthTokens(auth: StoredAuth): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, auth.accessToken),
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, auth.refreshToken),
    SecureStore.setItemAsync(USER_EMAIL_KEY, auth.email),
  ]);
}

export async function getAuthTokens(): Promise<StoredAuth | null> {
  const [accessToken, refreshToken, email] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.getItemAsync(USER_EMAIL_KEY),
  ]);
  if (!accessToken || !refreshToken || !email) return null;
  return { accessToken, refreshToken, email };
}

export async function clearAuthTokens(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.deleteItemAsync(USER_EMAIL_KEY),
  ]);
}
