import { UiController } from "../controllers/UiController";
import { Router } from "express";
import { AgentController } from "../controllers/AgentController";
import { AgentService } from "../services/agentService";
import { AgentRepository } from "../repositories/AgentRepository";
import { asyncErrorWrapper } from "../utils/asyncErrorWrapper";

const router = Router();
const agentController = new AgentController(
  new AgentService(new AgentRepository()),
);

const ui = new UiController();
router.get(
  "/",
  asyncErrorWrapper((req, res) => ui.execute(req, res, "agents")),
);
router.post(
  "/panic",
  asyncErrorWrapper((req, res) => ui.execute(req, res, "panic")),
);
router.patch(
  "/:id/whitelist",
  asyncErrorWrapper((req, res) => ui.execute(req, res, "whitelist")),
);
router.patch(
  "/:id",
  asyncErrorWrapper((req, res) => ui.execute(req, res, "agent")),
);
router.get(
  "/:id/history",
  asyncErrorWrapper((req, res) => ui.execute(req, res, "history")),
);
router.post(
  "/",
  asyncErrorWrapper((req, res) => agentController.createAgent(req, res)),
);

export default router;
