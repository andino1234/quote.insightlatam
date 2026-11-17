import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { exchangeRateService } from '../services/exchangeRate.service';

export const exchangeRateController = {
  list: asyncHandler(async (_req: Request, res: Response) => res.json(await exchangeRateService.list())),
  create: asyncHandler(async (req: Request, res: Response) => {
    const result = await exchangeRateService.create({ ...req.body, createdBy: req.user!.userId });
    res.status(201).json(result);
  }),
  deactivate: asyncHandler(async (req: Request, res: Response) => res.json(await exchangeRateService.deactivate(Number(req.params.id)))),
};
