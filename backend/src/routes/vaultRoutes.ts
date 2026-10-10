import { UiController } from "../controllers/UiController";
import { Router } from "express";
import { asyncErrorWrapper } from "../utils/asyncErrorWrapper";

const router = Router();
const ui = new UiController();
router.post(
  "/local",
  asyncErrorWrapper((req, res) => ui.execute(req, res, "local")),
);
router.get(
  "/",
  asyncErrorWrapper((req, res) => ui.execute(req, res, "vaults")),
);
router.patch(
  "/:id",
  asyncErrorWrapper((req, res) => ui.execute(req, res, "vault")),
);
router.patch(
  "/:id/policies",
  asyncErrorWrapper((req, res) => ui.execute(req, res, "policies")),
);
router.post(
  "/:id/optimize",
  asyncErrorWrapper((req, res) => ui.execute(req, res, "optimize")),
);
router.post("/", (_req, res) =>
  res
    .status(501)
    .json({ success: false, error: "Use authenticated wallet vault creation" }),
);

export default router;
