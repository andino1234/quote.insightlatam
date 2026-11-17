import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { quoteService } from '../services/quote.service';

export const quoteController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const result = await quoteService.listForUser(req.user!.userId, req.user!.role);
    res.json(result);
  }),
  getById: asyncHandler(async (req: Request, res: Response) => {
    const result = await quoteService.getById(Number(req.params.id), req.user!.userId, req.user!.role);
    res.json(result);
  }),
  create: asyncHandler(async (req: Request, res: Response) => {
    const result = await quoteService.create(req.body, req.user!.userId);
    res.status(201).json(result);
  }),
  update: asyncHandler(async (req: Request, res: Response) => {
    const result = await quoteService.update(Number(req.params.id), req.body, req.user!.userId, req.user!.role);
    res.json(result);
  }),
  delete: asyncHandler(async (req: Request, res: Response) => {
    await quoteService.delete(Number(req.params.id), req.user!.userId, req.user!.role);
    res.status(204).send();
  }),
  duplicate: asyncHandler(async (req: Request, res: Response) => {
    const result = await quoteService.duplicate(Number(req.params.id), req.user!.userId, req.user!.role);
    res.status(201).json(result);
  }),
  updateStatus: asyncHandler(async (req: Request, res: Response) => {
    const result = await quoteService.updateStatus(Number(req.params.id), req.body.status, req.user!.userId, req.user!.role);
    res.json(result);
  }),
};
