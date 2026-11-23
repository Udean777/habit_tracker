import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { hc } from "hono/client";
import type { AppType } from "../../../api/src/index";

const DEV_ANDROID_API_URL = "http://10.0.2.2:3000";
const DEV_DEFAULT_API_URL = "http://localhost:3000";

export function resolveApiUrl(
  rawUrl: string | undefined,
  isDev: boolean,
  platformOs: string,
): string {
  const trimmed = rawUrl?.trim();
  if (trimmed) {
    return trimmed.replace(/\/+$/, "");
  }
  if (isDev) {
    return platformOs === "android" ? DEV_ANDROID_API_URL : DEV_DEFAULT_API_URL;
  }
  throw new Error(
    "EXPO_PUBLIC_API_URL is required in release builds. Configure it in CI/CD or eas.json.",
  );
}

const API_URL = resolveApiUrl(
  process.env.EXPO_PUBLIC_API_URL,
  __DEV__,
  Platform.OS,
);
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
