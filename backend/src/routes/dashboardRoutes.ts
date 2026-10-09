import { UiController } from "../controllers/UiController";
import { Router } from "express";
import { DashboardController } from "../controllers/DashboardController";
import { asyncErrorWrapper } from "../utils/asyncErrorWrapper";

const router = Router();
const dashboardController = new DashboardController();

const ui = new UiController();
router.get(
  "/",
  asyncErrorWrapper((req, res) => ui.execute(req, res, "dashboard")),
);
router.post("/withdraw", (_req, res) =>
  res
    .status(501)
    .json({
      success: false,
      error:
        "Withdrawals require authenticated authorization; unavailable in this local prototype.",
    }),
);
router.post(
  "/deposit",
  asyncErrorWrapper((req, res) => dashboardController.deposit(req, res)),
);

export default router;
