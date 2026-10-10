import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/authService";
import { config } from "../config/unifiedConfig";
export interface Identity {
  user_id: string;
  owner_pubkey: string;
  expires_at: string;
}
declare global {
  namespace Express {
    interface Request {
      identity?: Identity;
    }
  }
}
export const cookieName = config.auth.production
  ? "__Host-agentsafe_session"
  : "agentsafe_session";
export const browserCookieName = config.auth.production
  ? "__Host-agentsafe_login"
  : "agentsafe_login";
export function cookie(req: Request, name: string) {
  return (
    req.headers.cookie
      ?.split(";")
      .map((v) => v.trim())
      .find((v) => v.startsWith(name + "="))
      ?.slice(name.length + 1) ?? ""
  );
}
export function originGuard(req: Request, res: Response, next: NextFunction) {
  res.set("Cache-Control", "no-store");
  const origin = req.get("Origin");
  if (origin && !config.auth.allowedOrigins.includes(origin)) {
    res.status(403).json({ success: false, error: "Origin not allowed" });
    return;
  }
  if (
    !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
    (!origin || req.get("X-AgentSafe-CSRF") !== "1")
  ) {
    res
      .status(403)
      .json({
        success: false,
        error: "Allowed Origin and CSRF header required",
      });
    return;
  }
  next();
}
export async function requireWallet(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const identity = await new AuthService().session(cookie(req, cookieName));
    if (!identity) {
      res
        .status(401)
        .json({ success: false, error: "Wallet authentication required" });
      return;
    }
    req.identity = identity;
    next();
  } catch {
    res
      .status(503)
      .json({ success: false, error: "Authentication unavailable" });
  }
}
