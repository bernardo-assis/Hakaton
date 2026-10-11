import { Request, Response } from 'express';
import { z } from 'zod';
import { BaseController } from './BaseController';
import { PaymentService } from '../services/paymentService';
export class PaymentController extends BaseController {
    constructor(private service = new PaymentService()) {
        super();
    }
    async execute(req: Request, res: Response, action: string) {
        try {
            const id = () => z.string().uuid().parse(req.params.id);
            let data: any;
            switch (action) {
                case 'createVault': {
                    const input = z.object({ daily_cap_lamports: z.string().regex(/^\d{1,19}$/).optional() }).strict().parse(req.body);
                    data = await this.service.createVault(req.identity!, input);
                    break;
                }
                case 'config':
                    data = await this.service.paymentConfig(req.identity!, id());
                    break;
                case 'mode': {
                    const input = z.object({ execution_mode: z.enum(['AUTOMATIC', 'MANUAL']), expected_mode_version: z.string().regex(/^\d+$/), daily_cap_lamports: z.string().regex(/^\d{1,19}$/).optional() }).strict().parse(req.body);
                    data = await this.service.setMode(req.identity!, id(), input.execution_mode, input.expected_mode_version, input.daily_cap_lamports);
                    break;
                }
                case 'issue': {
                    const input = z.object({ ttl_seconds: z.number().int().min(60).max(86400).default(3600) }).strict().parse(req.body);
                    data = await this.service.issueCredential(req.identity!, id(), input.ttl_seconds);
                    break;
                }
                case 'revoke':
                    data = await this.service.revokeCredential(req.identity!, id(), z.string().uuid().parse(req.params.credentialId));
                    break;
                case 'request': {
                    const token = z.string().regex(/^Bearer [A-Za-z0-9_-]{43}$/).parse(req.get('Authorization')).slice(7);
                    data = await this.service.request(token, req.body);
                    break;
                }
                case 'list': {
                    const input = z.object({ approval_status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'NOT_REQUIRED']).optional(), vault_id: z.string().uuid().optional(), limit: z.coerce.number().int().min(1).max(100).default(100), offset: z.coerce.number().int().min(0).max(100000).default(0) }).strict().parse(req.query);
                    data = await this.service.list(req.identity!, input);
                    break;
                }
                case 'detail':
                    data = await this.service.detail(req.identity!, id());
                    break;
                case 'requestOwner':
                    data = await this.service.requestOwner(req.identity!, req.body);
                    break;
                case 'approve': {
                    const input = z.object({ expected_mode_version: z.string().regex(/^\d+$/) }).strict().parse(req.body);
                    data = await this.service.approve(req.identity!, id(), input.expected_mode_version);
                    break;
                }
                case 'reject':
                    z.object({}).strict().parse(req.body);
                    data = await this.service.reject(req.identity!, id());
                    break;
                default: throw Object.assign(new Error('Not found'), { status: 404 });
            }
            this.handleSuccess(res, data, ['createVault', 'issue'].includes(action) ? 201 : 200);
        }
        catch (e) {
            this.handleError(e, res, 'payments:' + action);
        }
    }
}
