import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export type AppRole = 'ADMINISTRADOR' | 'GERENCIA' | 'EJECUTIVO' | 'OPERACIONES' | (string & {});

export interface RoleAttributes {
  id: number;
  name: AppRole;
}
export type RoleCreation = Optional<RoleAttributes, 'id'>;
export class Role extends Model<RoleAttributes, RoleCreation> implements RoleAttributes {
  declare id: number;
  declare name: AppRole;
}
Role.init(
  { id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true }, name: { type: DataTypes.STRING(30), allowNull: false, unique: true } },
  { sequelize, tableName: 'roles', timestamps: false }
);

export interface RolePermissionAttributes {
  id: number;
  roleId: number;
  module: string;
  view: boolean;
}
export type RolePermissionCreation = Optional<RolePermissionAttributes, 'id'>;
export class RolePermission extends Model<RolePermissionAttributes, RolePermissionCreation> implements RolePermissionAttributes {
  declare id: number;
  declare roleId: number;
  declare module: string;
  declare view: boolean;
}
RolePermission.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    roleId: { type: DataTypes.INTEGER, allowNull: false, field: 'role_id' },
    module: { type: DataTypes.STRING(50), allowNull: false },
    view: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  { sequelize, tableName: 'role_permissions', timestamps: false }
);

Role.hasMany(RolePermission, { foreignKey: 'roleId', as: 'permissions' });
RolePermission.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });

export interface UserAttributes {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  roleId: number;
  active: boolean;
}
export type UserCreation = Optional<UserAttributes, 'id' | 'active'>;
export class User extends Model<UserAttributes, UserCreation> implements UserAttributes {
  declare id: number;
  declare name: string;
  declare email: string;
  declare passwordHash: string;
  declare roleId: number;
  declare active: boolean;
}
User.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(150), allowNull: false },
    email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
    passwordHash: { type: DataTypes.STRING(255), allowNull: false, field: 'password_hash' },
    roleId: { type: DataTypes.INTEGER, allowNull: false, field: 'role_id' },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { sequelize, tableName: 'users' }
);

User.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });
Role.hasMany(User, { foreignKey: 'roleId', as: 'users' });
