import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';

interface CrudService {
  list: () => Promise<unknown>;
  getById: (id: number) => Promise<unknown>;
  create: (data: any) => Promise<unknown>;
  update: (id: number, data: any) => Promise<unknown>;
  setActive: (id: number, active: boolean) => Promise<unknown>;
}

/** Fábrica de controladores CRUD genéricos que delega en un servicio con la misma forma. */
export function createCrudController(service: CrudService) {
  return {
    list: asyncHandler(async (_req: Request, res: Response) => {
      res.json(await service.list());
    }),
    getById: asyncHandler(async (req: Request, res: Response) => {
      res.json(await service.getById(Number(req.params.id)));
    }),
    create: asyncHandler(async (req: Request, res: Response) => {
      res.status(201).json(await service.create(req.body));
    }),
    update: asyncHandler(async (req: Request, res: Response) => {
      res.json(await service.update(Number(req.params.id), req.body));
    }),
    deactivate: asyncHandler(async (req: Request, res: Response) => {
      res.json(await service.setActive(Number(req.params.id), false));
    }),
    activate: asyncHandler(async (req: Request, res: Response) => {
      res.json(await service.setActive(Number(req.params.id), true));
    }),
  };
}

export type { CrudService };
