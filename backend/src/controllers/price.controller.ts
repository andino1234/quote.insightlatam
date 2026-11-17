import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { priceService } from '../services/price.service';

export const priceController = {
  list: asyncHandler(async (_req: Request, res: Response) => res.json(await priceService.list())),
  create: asyncHandler(async (req: Request, res: Response) => {
    const result = await priceService.create({ ...req.body, createdBy: req.user!.userId });
    res.status(201).json(result);
  }),
  update: asyncHandler(async (req: Request, res: Response) => {
    const result = await priceService.update(Number(req.params.id), req.body);
    res.json(result);
  }),
  deactivate: asyncHandler(async (req: Request, res: Response) => res.json(await priceService.deactivate(Number(req.params.id)))),
};
