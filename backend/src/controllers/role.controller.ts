import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { roleService } from '../services/role.service';

export const roleController = {
  list: asyncHandler(async (_req: Request, res: Response) => res.json(await roleService.list())),
  getById: asyncHandler(async (req: Request, res: Response) => res.json(await roleService.getById(Number(req.params.id)))),
  create: asyncHandler(async (req: Request, res: Response) => res.status(201).json(await roleService.create(req.body))),
  update: asyncHandler(async (req: Request, res: Response) => res.json(await roleService.update(Number(req.params.id), req.body))),
};
