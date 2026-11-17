import { z } from 'zod';

const permissionSchema = z.object({
  module: z.string().min(1).max(50),
  view: z.boolean().optional().default(true),
});

export const createRoleSchema = z.object({
  name: z.string().min(2).max(60),
  permissions: z.array(permissionSchema).optional(),
});

export const updateRoleSchema = createRoleSchema.partial();
