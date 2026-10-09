import { Request, Response } from "express";
import { z } from "zod";
import { BaseController } from "./BaseController";
import { UiService } from "../services/uiService";
import {
  idSchema,
  editAgentSchema,
  policiesSchema,
  simulationSchema,
  pubkeySchema,
} from "../validators/ui.schema";
export class UiController extends BaseController {
  constructor(private service = new UiService()) {
    super();
  }
  async execute(req: Request, res: Response, action: string) {
    try {
      let data;
      const id = () => idSchema.parse(req.params.id);
      switch (action) {
        case "whitelist":
          data = await this.service.whitelist(
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
          data = await this.service.localVault(
            z.object({ owner_pubkey: pubkeySchema }).strict().parse(req.body)
              .owner_pubkey,
          );
          break;
        case "vaults":
          data = await this.service.vaults();
          break;
        case "agents":
          data = await this.service.agents();
          break;
        case "dashboard":
          data = await this.service.dashboard();
          break;
        case "events":
          data = await this.service.events();
          break;
        case "history":
          data = await this.service.history(id());
          break;
        case "panic":
          z.object({}).strict().parse(req.body);
          data = await this.service.panic();
          break;
        case "agent":
          data = await this.service.mutate(
            "agents",
            id(),
            editAgentSchema.parse(req.body),
          );
          break;
        case "vault":
          data = await this.service.mutate(
            "vaults",
            id(),
            z
              .object({ status: z.enum(["ACTIVE", "FROZEN"]) })
              .strict()
              .parse(req.body),
          );
          break;
        case "policies":
          data = await this.service.mutate("vaults", id(), {
            policies: policiesSchema.parse(req.body),
          });
          break;
        case "optimize":
          z.object({}).strict().parse(req.body);
          data = await this.service.optimize(id());
          break;
        case "simulate":
          data = await this.service.simulate(simulationSchema.parse(req.body));
          break;
        case "simulations":
          data = await this.service.simulations();
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
