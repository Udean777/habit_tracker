import * as SecureStore from "expo-secure-store";

const ONBOARDING_COMPLETED_KEY = "glimkin_onboarding_completed_v1";

export async function hasCompletedOnboarding(): Promise<boolean> {
  try {
    const val = await SecureStore.getItemAsync(ONBOARDING_COMPLETED_KEY);
    return val === "1";
  } catch {
    return false;
  }
}

export async function markOnboardingCompleted(): Promise<void> {
  try {
    await SecureStore.setItemAsync(ONBOARDING_COMPLETED_KEY, "1");
  } catch {
    // Ignore secure store errors in unsupported/test environments
  }
}
