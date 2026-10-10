import { Response } from "express";

export class BaseController {
  protected handleSuccess(res: Response, data: any, statusCode = 200): void {
    res.status(statusCode).json({ success: true, data });
  }

  protected handleError(error: any, res: Response, context: string): void {
    // Sentry.captureException(error); // Placeholder for Sentry

    if (error.name === "ZodError") {
      res
        .status(400)
        .json({
          success: false,
          error: "Validation Error",
          details: error.errors,
        });
      return;
    }
    if ([400, 404, 409, 501].includes(error.status)) {
      res.status(error.status).json({ success: false, error: error.message });
      return;
    }
    console.error(`[${context}] Internal error`, { code: error.code });
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
}
