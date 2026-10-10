import { Router } from "express";
import rateLimit from "express-rate-limit";
import { AuthController } from "../controllers/AuthController";
import { asyncErrorWrapper } from "../utils/asyncErrorWrapper";
const router = Router(),
  controller = new AuthController();
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: "Too many authentication attempts" },
});
router.post(
  "/challenge",
  limiter,
  asyncErrorWrapper((req, res) => controller.challenge(req, res)),
);
router.post(
  "/verify",
  limiter,
  asyncErrorWrapper((req, res) => controller.verify(req, res)),
);
router.get(
  "/session",
  asyncErrorWrapper((req, res) => controller.session(req, res)),
);
router.post(
  "/logout",
  asyncErrorWrapper((req, res) => controller.logout(req, res)),
);
export default router;
