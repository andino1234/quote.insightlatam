import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { userService } from '../services/user.service';

export const userController = {
  list: asyncHandler(async (_req: Request, res: Response) => res.json(await userService.list())),
  getById: asyncHandler(async (req: Request, res: Response) => res.json(await userService.getById(Number(req.params.id)))),
  create: asyncHandler(async (req: Request, res: Response) => res.status(201).json(await userService.create(req.body))),
  update: asyncHandler(async (req: Request, res: Response) => res.json(await userService.update(Number(req.params.id), req.body))),
  deactivate: asyncHandler(async (req: Request, res: Response) => res.json(await userService.setActive(Number(req.params.id), false))),
  activate: asyncHandler(async (req: Request, res: Response) => res.json(await userService.setActive(Number(req.params.id), true))),
};
