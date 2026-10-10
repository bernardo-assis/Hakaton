import { Request, Response } from "express";
import { z } from "zod";
import { randomBytes } from "crypto";
import { BaseController } from "./BaseController";
import { AuthService, decodeKey } from "../services/authService";
import {
  cookie,
  cookieName,
  browserCookieName,
} from "../middleware/walletAuth";
import { config } from "../config/unifiedConfig";
const options = {
  httpOnly: true,
  sameSite: "strict" as const,
  secure: config.auth.production,
  path: "/",
};
export class AuthController extends BaseController {
  constructor(private service = new AuthService()) {
    super();
  }
  async challenge(req: Request, res: Response) {
    try {
      const pubkey = z
        .object({
          owner_pubkey: z
            .string()
            .min(32)
            .max(44)
            .refine((v) => {
              try {
                decodeKey(v);
                return true;
              } catch {
                return false;
              }
            }),
        })
        .strict()
        .parse(req.body).owner_pubkey;
      let browser = cookie(req, browserCookieName);
      if (!/^[a-zA-Z0-9_-]{43}$/.test(browser))
        browser = randomBytes(32).toString("base64url");
      res.cookie(browserCookieName, browser, {
        ...options,
        maxAge: 5 * 60 * 1000,
      });
      this.handleSuccess(
        res,
        await this.service.challenge(pubkey, req.get("Origin")!, browser),
      );
    } catch (e) {
      this.handleError(e, res, "challenge");
    }
  }
  async verify(req: Request, res: Response) {
    try {
      const input = z
        .object({
          challenge_id: z.string().uuid(),
          signature: z.string().regex(/^[A-Za-z0-9+/]{86}==$/),
        })
        .strict()
        .parse(req.body);
      const v = await this.service.verify(
        input.challenge_id,
        input.signature,
        req.get("Origin")!,
        cookie(req, browserCookieName),
      );
      res.cookie(cookieName, v.token, {
        ...options,
        maxAge: 8 * 60 * 60 * 1000,
      });
      this.handleSuccess(res, {
        authenticated: true,
        owner_pubkey: v.owner_pubkey,
        expires_at: v.expires_at,
      });
    } catch (e) {
      this.handleError(e, res, "verify");
    }
  }
  async session(req: Request, res: Response) {
    try {
      const identity = await this.service.session(cookie(req, cookieName));
      this.handleSuccess(
        res,
        identity
          ? {
              authenticated: true,
              owner_pubkey: identity.owner_pubkey,
              expires_at: identity.expires_at,
            }
          : { authenticated: false },
      );
    } catch (e) {
      this.handleError(e, res, "session");
    }
  }
  async logout(req: Request, res: Response) {
    try {
      z.object({}).strict().parse(req.body);
      await this.service.logout(cookie(req, cookieName));
      res.clearCookie(cookieName, options);
      res.clearCookie(browserCookieName, options);
      this.handleSuccess(res, { authenticated: false });
    } catch (e) {
      this.handleError(e, res, "logout");
    }
  }
}
