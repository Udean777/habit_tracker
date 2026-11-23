import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  loginInputSchema,
  refreshInputSchema,
  registerInputSchema,
} from "@habit/shared";
import { rateLimitAuth } from "../middleware/rateLimit";
import {
  loginUser,
  registerUser,
  revokeRefreshToken,
  rotateRefreshToken,
} from "../services/authService";

export const authRoutes = new Hono()
  .use("*", rateLimitAuth)
  .post("/register", zValidator("json", registerInputSchema), async (c) => {
    const { email, password, deviceId } = c.req.valid("json");
    const result = await registerUser(email, password, deviceId);
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
    const result = await loginUser(email, password, deviceId);
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
    const result = await rotateRefreshToken(refreshToken, deviceId);
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
    await revokeRefreshToken(refreshToken);
    return c.json({ ok: true });
  });
