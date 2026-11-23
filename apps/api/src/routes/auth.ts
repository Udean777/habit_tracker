import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  loginInputSchema,
  oauthExchangeInputSchema,
  oauthProviderSchema,
  refreshInputSchema,
  registerInputSchema,
} from "@habit/shared";
import { resolveJwtSecret } from "../env";
import type { AppEnv } from "../middleware/auth";
import { rateLimitAuth } from "../middleware/rateLimit";
import {
  loginUser,
  registerUser,
  revokeRefreshToken,
  rotateRefreshToken,
} from "../services/authService";
import {
  buildOAuthAuthorizationUrl,
  exchangeOAuthTicket,
  handleOAuthProviderCallback,
} from "../services/oauthService";

export const authRoutes = new Hono<AppEnv>()
  .use("*", rateLimitAuth)
  .get("/oauth/:provider/start", async (c) => {
    const parsedProvider = oauthProviderSchema.safeParse(
      c.req.param("provider"),
    );
    if (!parsedProvider.success) {
      return c.json(
        { error: { code: "VALIDATION_ERROR", message: "Unsupported OAuth provider" } },
        400,
      );
    }

    const deviceId = c.req.query("deviceId")?.trim() || "mobile-device";
    const redirectUri = c.req.query("redirectUri")?.trim();
    const apiOrigin = new URL(c.req.url).origin;

    const result = await buildOAuthAuthorizationUrl({
      provider: parsedProvider.data,
      apiOrigin,
      deviceId,
      clientRedirectUri: redirectUri,
      env: c.env,
    });

    if (!result.ok) {
      return c.json(
        { error: { code: "VALIDATION_ERROR", message: result.message } },
        result.status,
      );
    }

    return c.redirect(result.url, 302);
  })
  .get("/oauth/:provider/callback", async (c) => {
    const parsedProvider = oauthProviderSchema.safeParse(
      c.req.param("provider"),
    );
    if (!parsedProvider.success) {
      return c.json(
        { error: { code: "VALIDATION_ERROR", message: "Unsupported OAuth provider" } },
        400,
      );
    }

    const apiOrigin = new URL(c.req.url).origin;
    const { redirectUrl } = await handleOAuthProviderCallback({
      provider: parsedProvider.data,
      code: c.req.query("code"),
      stateToken: c.req.query("state"),
      providerError: c.req.query("error_description") ?? c.req.query("error"),
      apiOrigin,
      env: c.env,
    });

    return c.redirect(redirectUrl, 302);
  })
  .post(
    "/oauth/exchange",
    zValidator("json", oauthExchangeInputSchema),
    async (c) => {
      const { ticket, deviceId } = c.req.valid("json");
      const result = await exchangeOAuthTicket({
        ticket,
        deviceId,
        database: c.get("getDb")(),
        jwtSecret: resolveJwtSecret(c.env),
      });
      if (!result.ok) {
        return c.json(
          { error: { code: result.code, message: result.message } },
          result.status,
        );
      }
      return c.json(result.data);
    },
  )
  .post("/register", zValidator("json", registerInputSchema), async (c) => {
    const { email, password, deviceId } = c.req.valid("json");
    const result = await registerUser(
      email,
      password,
      deviceId,
      c.get("getDb")(),
      resolveJwtSecret(c.env),
    );
    if (!result.ok) {
      return c.json(
        { error: { code: result.code, message: result.message } },
        result.status,
      );
    }
    return c.json(result.data, 201);
  })
  .post("/login", zValidator("json", loginInputSchema), async (c) => {
    const { email, password, deviceId } = c.req.valid("json");
    const result = await loginUser(
      email,
      password,
      deviceId,
      c.get("getDb")(),
      resolveJwtSecret(c.env),
    );
    if (!result.ok) {
      return c.json(
        { error: { code: result.code, message: result.message } },
        result.status,
      );
    }
    return c.json(result.data);
  })
  .post("/refresh", zValidator("json", refreshInputSchema), async (c) => {
    const { refreshToken, deviceId } = c.req.valid("json");
    const result = await rotateRefreshToken(
      refreshToken,
      deviceId,
      c.get("getDb")(),
      resolveJwtSecret(c.env),
    );
    if (!result.ok) {
      return c.json(
        { error: { code: result.code, message: result.message } },
        result.status,
      );
    }
    return c.json(result.data);
  })
  .post("/logout", zValidator("json", refreshInputSchema), async (c) => {
    const { refreshToken } = c.req.valid("json");
    await revokeRefreshToken(refreshToken, c.get("getDb")());
    return c.json({ ok: true });
  });
