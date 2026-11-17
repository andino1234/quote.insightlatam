import { Role, RolePermission } from '../models';
import { AppRole } from '../models/security.models';
import { ApiError } from '../utils/ApiError';

export const roleService = {
  async list() {
    return Role.findAll({
      order: [['id', 'ASC']],
      include: [{ model: RolePermission, as: 'permissions' }],
    });
  },

  async getById(id: number) {
    const role = await Role.findByPk(id, { include: [{ model: RolePermission, as: 'permissions' }] });
    if (!role) throw ApiError.notFound('Rol no encontrado');
    return role;
  },

  async create(data: { name: AppRole; permissions?: Array<{ module: string; view?: boolean }> }) {
    const name = data.name?.trim();
    if (!name) throw ApiError.badRequest('El nombre del rol es obligatorio');

    const existing = await Role.findOne({ where: { name } });
    if (existing) throw ApiError.conflict('Ya existe ese nombre de rol');

    const role = await Role.create({ name: name as AppRole });
    if (Array.isArray(data.permissions) && data.permissions.length > 0) {
      await RolePermission.bulkCreate(
        data.permissions.map((permission) => ({
          roleId: role.id,
          module: permission.module,
          view: Boolean(permission.view),
        })),
        { validate: true }
      );
    }

    return this.getById(role.id);
  },

  async update(id: number, data: { name?: AppRole; permissions?: Array<{ module: string; view?: boolean }> }) {
    const role = await Role.findByPk(id);
    if (!role) throw ApiError.notFound('Rol no encontrado');

    const nextName = data.name?.trim() ?? role.name;
    if (data.name && data.name !== role.name) {
      const existing = await Role.findOne({ where: { name: nextName } });
      if (existing) throw ApiError.conflict('Ya existe ese nombre de rol');
    }

    await role.update({ name: nextName as AppRole });

    if (Array.isArray(data.permissions)) {
      await RolePermission.destroy({ where: { roleId: id } });
      if (data.permissions.length > 0) {
        await RolePermission.bulkCreate(
          data.permissions.map((permission) => ({
            roleId: id,
            module: permission.module,
            view: Boolean(permission.view),
          })),
          { validate: true }
        );
      }
    }

    return this.getById(id);
  },
};
