import { Role, RolePermission, User } from '../models';
import { AppRole } from '../models/security.models';
import { ApiError } from '../utils/ApiError';
import { comparePassword } from '../utils/password';
import { signToken } from '../utils/jwt';
import { LoginInput } from '../validations/auth.validation';

export const authService = {
  async login(input: LoginInput) {
    const user = await User.findOne({
      where: { email: input.email },
      include: [{ model: Role, as: 'role', include: [{ model: RolePermission, as: 'permissions' }] }],
    });
    if (!user || !user.active) throw ApiError.unauthorized('Credenciales inválidas');

    const valid = await comparePassword(input.password, user.passwordHash);
    if (!valid) throw ApiError.unauthorized('Credenciales inválidas');

    const role = (user as any).role as Role & { permissions?: RolePermission[] };
    const roleName = (role?.name ?? 'ADMINISTRADOR') as AppRole;
    const permissions = (role?.permissions ?? []).map((permission) => ({
      module: permission.module,
      view: Boolean(permission.view),
    }));
    const token = signToken({ userId: user.id, role: roleName, permissions });

    return {
      token,
      user: { id: user.id, name: user.name, email: user.email, role: roleName, permissions },
    };
  },
};
