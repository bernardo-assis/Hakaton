import { Request, Response } from "express";
import { z } from "zod";
import { BaseController } from "./BaseController";
import { UiRepository } from "../repositories/UiRepository";
import { UiService } from "../services/uiService";
import {
  idSchema,
  editAgentSchema,
  policiesSchema,
  simulationSchema,
  pubkeySchema,
} from "../validators/ui.schema";
export class UiController extends BaseController {
  constructor() {
    super();
  }
  async execute(req: Request, res: Response, action: string) {
    try {
      const service = new UiService(new UiRepository(req.identity!));
      let data;
      const id = () => idSchema.parse(req.params.id);
      switch (action) {
        case "whitelist":
          data = await service.whitelist(
            id(),
            z
              .object({
                recipients: z
                  .array(
                    z
                      .object({
                        recipient_pubkey: pubkeySchema,
                        label: z.string().trim().min(1).max(100),
                      })
                      .strict(),
                  )
                  .max(100)
                  .refine(
                    (r) =>
                      new Set(r.map((x) => x.recipient_pubkey)).size ===
                      r.length,
                    "Duplicate recipient",
                  ),
              })
              .strict()
              .parse(req.body).recipients,
          );
          break;
        case "local":
          data = await service.localVault(
            z.object({ owner_pubkey: pubkeySchema }).strict().parse(req.body)
              .owner_pubkey,
          );
          break;
        case "vaults":
          data = await service.vaults();
          break;
        case "agents":
          data = await service.agents();
          break;
        case "dashboard":
          data = await service.dashboard();
          break;
        case "events":
          data = await service.events();
          break;
        case "history":
          data = await service.history(id());
          break;
        case "panic":
          z.object({}).strict().parse(req.body);
          data = await service.panic();
          break;
        case "agent":
          data = await service.mutate(
            "agents",
            id(),
            editAgentSchema.parse(req.body),
          );
          break;
        case "vault":
          data = await service.mutate(
            "vaults",
            id(),
            z
              .object({ status: z.enum(["ACTIVE", "FROZEN"]) })
              .strict()
              .parse(req.body),
          );
          break;
        case "policies":
          data = await service.mutate("vaults", id(), {
            policies: policiesSchema.parse(req.body),
          });
          break;
        case "optimize":
          z.object({}).strict().parse(req.body);
          data = await service.optimize(id());
          break;
        case "simulate":
          data = await service.simulate(simulationSchema.parse(req.body));
          break;
        case "simulations":
          data = await service.simulations();
          break;
        default:
          throw new Error("Unknown action");
      }
      this.handleSuccess(res, data);
    } catch (e) {
      this.handleError(e, res, action);
    }
  }
}
