import { useCallback, useEffect, useState } from "react";
import * as WebBrowser from "expo-web-browser";
import type { OAuthProvider } from "@habit/shared";
import {
  API_URL,
  apiClient,
  clearAuthTokens,
  getAuthTokens,
  saveAuthTokens,
} from "@/lib/apiClient";
import { useUiStore } from "@/stores/uiStore";
import {
  enqueueAllLocalDataForSync,
  runSyncCycle,
  type SyncResult,
} from "@/sync/syncEngine";
import { getLocalDeviceId } from "../repository";

const OAUTH_RETURN_URI = "glimkin://auth/callback";
const DEV_LOCAL_EMAIL = "hero.dev@glimkin.local";
const DEV_LOCAL_PASSWORD = "glimkin-local-dev-password";

function extractQueryParam(url: string, key: string): string | null {
  const queryIndex = url.indexOf("?");
  if (queryIndex < 0) return null;
  const rawQuery = url.slice(queryIndex + 1).split("#")[0] ?? "";
  const params = new URLSearchParams(rawQuery);
  return params.get(key);
}

export function useAuthActions() {
  const dataVersion = useUiStore((s) => s.dataVersion);
  const bumpDataVersion = useUiStore((s) => s.bumpDataVersion);
  const [accountEmail, setAccountEmail] = useState<string | null>(null);

  const loadAccountEmail = useCallback(async () => {
    const auth = await getAuthTokens();
    setAccountEmail(auth?.email ?? null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void getAuthTokens().then((auth) => {
      if (!cancelled) {
        setAccountEmail(auth?.email ?? null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [dataVersion]);

  const authenticate = useCallback(
    async (
      mode: "login" | "register",
      email: string,
      password: string,
    ): Promise<{ readonly ok: true } | { readonly ok: false; readonly message: string }> => {
      const deviceId = await getLocalDeviceId();
      const res =
        mode === "login"
          ? await apiClient.auth.login.$post({
              json: { email: email.trim(), password, deviceId },
            })
          : await apiClient.auth.register.$post({
              json: { email: email.trim(), password, deviceId },
            });

      if (!res.ok) {
        let serverMessage: string | undefined;
        try {
          const errBody = (await res.json()) as { error?: { message?: string } };
          serverMessage = errBody?.error?.message;
        } catch {
          // Ignore non-JSON error body
        }
        return {
          ok: false,
          message:
            serverMessage ??
            (mode === "login"
              ? "Invalid email or password"
              : "Could not create account"),
        };
      }

      const data = await res.json();
      await saveAuthTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        email: data.user.email,
      });
      setAccountEmail(data.user.email);

      await enqueueAllLocalDataForSync();
      await runSyncCycle();
      bumpDataVersion();
      return { ok: true };
    },
    [bumpDataVersion],
  );

  const authenticateWithOAuth = useCallback(
    async (
      provider: OAuthProvider,
    ): Promise<
      | { readonly ok: true }
      | {
          readonly ok: false;
          readonly cancelled?: boolean;
          readonly message: string;
        }
    > => {
      const deviceId = await getLocalDeviceId();
      const params = new URLSearchParams({
        deviceId,
        redirectUri: OAUTH_RETURN_URI,
      });
      const startUrl = `${API_URL}/auth/oauth/${provider}/start?${params.toString()}`;

      const session = await WebBrowser.openAuthSessionAsync(
        startUrl,
        OAUTH_RETURN_URI,
      );

      if (session.type !== "success" || !session.url) {
        return {
          ok: false,
          cancelled: true,
          message: "Sign-in was cancelled before completion.",
        };
      }

      const oauthError = extractQueryParam(session.url, "error");
      if (oauthError) {
        return {
          ok: false,
          message: oauthError,
        };
      }

      const ticket = extractQueryParam(session.url, "ticket");
      if (!ticket) {
        return {
          ok: false,
          message: "Did not receive a valid sign-in ticket from the server.",
        };
      }

      const exchangeRes = await apiClient.auth.oauth.exchange.$post({
        json: { ticket, deviceId },
      });

      if (!exchangeRes.ok) {
        let serverMessage: string | undefined;
        try {
          const errBody = (await exchangeRes.json()) as {
            error?: { message?: string };
          };
          serverMessage = errBody?.error?.message;
        } catch {
          // Ignore non-JSON body
        }
        return {
          ok: false,
          message: serverMessage ?? "Could not complete OAuth sign-in.",
        };
      }

      const data = await exchangeRes.json();
      await saveAuthTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        email: data.user.email,
      });
      setAccountEmail(data.user.email);

      await enqueueAllLocalDataForSync();
      await runSyncCycle();
      bumpDataVersion();
      return { ok: true };
    },
    [bumpDataVersion],
  );

  const authenticateDevLocal = useCallback(async (): Promise<
    { readonly ok: true } | { readonly ok: false; readonly message: string }
  > => {
    const loginAttempt = await authenticate(
      "login",
      DEV_LOCAL_EMAIL,
      DEV_LOCAL_PASSWORD,
    );
    if (loginAttempt.ok) return loginAttempt;
    return authenticate("register", DEV_LOCAL_EMAIL, DEV_LOCAL_PASSWORD);
  }, [authenticate]);

  const signOut = useCallback(async () => {
    await clearAuthTokens();
    setAccountEmail(null);
    bumpDataVersion();
  }, [bumpDataVersion]);

  const syncNow = useCallback(async (): Promise<SyncResult> => {
    const result = await runSyncCycle();
    if (result.kind === "signed_out") {
      setAccountEmail(null);
    } else if (result.kind === "synced") {
      bumpDataVersion();
    }
    return result;
  }, [bumpDataVersion]);

  return {
    accountEmail,
    loadAccountEmail,
    authenticate,
    authenticateWithOAuth,
    authenticateDevLocal,
    signOut,
    syncNow,
  };
}
