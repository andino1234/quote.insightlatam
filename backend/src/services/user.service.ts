import { Role, User } from '../models';
import { ApiError } from '../utils/ApiError';
import { hashPassword } from '../utils/password';

export const userService = {
  async list() {
    return User.findAll({ include: [{ model: Role, as: 'role' }], order: [['id', 'ASC']], attributes: { exclude: ['passwordHash'] } });
  },
  async getById(id: number) {
    const user = await User.findByPk(id, { include: [{ model: Role, as: 'role' }], attributes: { exclude: ['passwordHash'] } });
    if (!user) throw ApiError.notFound('Usuario no encontrado');
    return user;
  },
  async create(data: { name: string; email: string; password: string; roleId: number }) {
    const existing = await User.findOne({ where: { email: data.email } });
    if (existing) throw ApiError.conflict('Ya existe un usuario con ese correo');
    const passwordHash = await hashPassword(data.password);
    const user = await User.create({ name: data.name, email: data.email, passwordHash, roleId: data.roleId });
    return userService.getById(user.id);
  },
  async update(id: number, data: { name?: string; email?: string; password?: string; roleId?: number }) {
    const user = await User.findByPk(id);
    if (!user) throw ApiError.notFound('Usuario no encontrado');
    const updates: Record<string, unknown> = { ...data };
    delete updates.password;
    if (data.password) updates.passwordHash = await hashPassword(data.password);
    await user.update(updates);
    return userService.getById(id);
  },
  async setActive(id: number, active: boolean) {
    const user = await User.findByPk(id);
    if (!user) throw ApiError.notFound('Usuario no encontrado');
    await user.update({ active });
    return userService.getById(id);
  },
};
