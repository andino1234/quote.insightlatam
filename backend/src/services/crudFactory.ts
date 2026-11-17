import { Model, ModelStatic } from 'sequelize';
import { ApiError } from '../utils/ApiError';

/**
 * Fábrica de servicios CRUD genéricos para mantenimientos simples (con soft-delete vía `active`).
 * Evita repetir la misma lógica de list/get/create/update/deactivate en cada mantenimiento.
 */
export function createCrudService<M extends Model>(model: ModelStatic<M>, entityName: string) {
  return {
    async list(): Promise<M[]> {
      return model.findAll({ order: [['id', 'ASC']] } as any);
    },
    async getById(id: number): Promise<M> {
      const record = await model.findByPk(id);
      if (!record) throw ApiError.notFound(`${entityName} no encontrado`);
      return record;
    },
    async create(data: Partial<M['_creationAttributes']>): Promise<M> {
      return model.create(data as any);
    },
    async update(id: number, data: Partial<M['_creationAttributes']>): Promise<M> {
      const record = await model.findByPk(id);
      if (!record) throw ApiError.notFound(`${entityName} no encontrado`);
      await record.update(data as any);
      return record;
    },
    async setActive(id: number, active: boolean): Promise<M> {
      const record = await model.findByPk(id);
      if (!record) throw ApiError.notFound(`${entityName} no encontrado`);
      await record.update({ active } as any);
      return record;
    },
  };
}
