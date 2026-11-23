import { useCallback, useEffect, useState } from "react";
import {
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
    signOut,
    syncNow,
  };
}
