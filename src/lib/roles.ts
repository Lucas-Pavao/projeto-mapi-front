import { roleSchema, type Role } from '@/lib/apiSchemas';

/** ADR 0010: hierarquia USER < OPERADOR < ADMIN (ADMIN herda OPERADOR, OPERADOR herda USER). */
const RANK: Record<Role, number> = { USER: 0, OPERADOR: 1, ADMIN: 2 };

/** Perfil vindo de /api/auth/me (Role.name()). Ausente ou desconhecido = USER (menor privilégio). */
export function parseRole(raw: string | null | undefined): Role {
  const r = roleSchema.safeParse(raw);
  return r.success ? r.data : 'USER';
}

export const hasRole = (current: Role, min: Role): boolean => RANK[current] >= RANK[min];
