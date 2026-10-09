import { Response } from 'express';

export class BaseController {
  protected handleSuccess(res: Response, data: any, statusCode = 200): void {
    res.status(statusCode).json({ success: true, data });
  }

  protected handleError(error: any, res: Response, context: string): void {
    // Sentry.captureException(error); // Placeholder for Sentry
    console.error(`[${context}] Error:`, error);
    if (error.name === 'ZodError') {
      res.status(400).json({ success: false, error: 'Validation Error', details: error.errors });
      return;
    }
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}
