import { UiController } from "../controllers/UiController";
import { Router } from "express";
import { VaultController } from "../controllers/VaultController";
import { VaultService } from "../services/vaultService";
import { VaultRepository } from "../repositories/VaultRepository";
import { asyncErrorWrapper } from "../utils/asyncErrorWrapper";

const router = Router();
const vaultController = new VaultController(
  new VaultService(new VaultRepository()),
);

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
router.post(
  "/",
  asyncErrorWrapper((req, res) => vaultController.createVault(req, res)),
);

export default router;
