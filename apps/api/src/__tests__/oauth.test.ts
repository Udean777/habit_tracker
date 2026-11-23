import { describe, expect, it } from "bun:test";
import {
  buildOAuthAuthorizationUrl,
  isAllowedClientRedirect,
  signOAuthTicket,
} from "../services/oauthService";

describe("OAuth 2.0 service (Google & GitHub)", () => {
  it("allows only whitelisted deep-link and localhost redirect URIs", () => {
    expect(isAllowedClientRedirect("glimkin://auth/callback")).toBe(true);
    expect(isAllowedClientRedirect("exp://192.168.1.7:8081/--/auth/callback")).toBe(true);
    expect(isAllowedClientRedirect("http://localhost:8081/auth/callback")).toBe(true);
    expect(isAllowedClientRedirect("https://evil.example.com/steal")).toBe(false);
  });

  it("returns 501 when provider credentials are not configured", async () => {
    const res = await buildOAuthAuthorizationUrl({
      provider: "google",
      apiOrigin: "https://glimkin-api.hono-backend.workers.dev",
      deviceId: "dev-1",
      env: {},
    });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.status).toBe(501);
    }
  });

  it("builds signed Google and GitHub authorization URLs when configured", async () => {
    const env = {
      JWT_SECRET: "test-oauth-secret",
      GOOGLE_CLIENT_ID: "google-cid",
      GOOGLE_CLIENT_SECRET: "google-csec",
      GITHUB_CLIENT_ID: "github-cid",
      GITHUB_CLIENT_SECRET: "github-csec",
    };

    const googleRes = await buildOAuthAuthorizationUrl({
      provider: "google",
      apiOrigin: "https://glimkin-api.hono-backend.workers.dev",
      deviceId: "dev-1",
      env,
    });
    expect(googleRes.ok).toBe(true);
    if (googleRes.ok) {
      expect(googleRes.url).toContain("https://accounts.google.com/o/oauth2/v2/auth");
      expect(googleRes.url).toContain("client_id=google-cid");
      expect(googleRes.url).toContain("state=");
    }

    const githubRes = await buildOAuthAuthorizationUrl({
      provider: "github",
      apiOrigin: "https://glimkin-api.hono-backend.workers.dev",
      deviceId: "dev-1",
      env,
    });
    expect(githubRes.ok).toBe(true);
    if (githubRes.ok) {
      expect(githubRes.url).toContain("https://github.com/login/oauth/authorize");
      expect(githubRes.url).toContain("client_id=github-cid");
      expect(githubRes.url).toContain("state=");
    }
  });

  it("signs short-lived OAuth exchange tickets", async () => {
    const ticket = await signOAuthTicket({
      provider: "github",
      providerAccountId: "12345",
      email: "hero@example.com",
      deviceId: "dev-1",
      jwtSecret: "test-oauth-secret",
    });
    expect(ticket.split(".")).toHaveLength(3);
  });
});
