export interface User {
  username: string;
  /** USER | OPERADOR | ADMIN (vem de GET /api/auth/me, que lê o perfil do token). */
  role?: string;
  /** De GET /api/auth/me. Ausente logo após o login, até o primeiro /me. */
  id?: number;
  email?: string | null;
  name?: string | null;
}

export interface AuthResponse {
  user: User;
}

export interface RegisterRequest {
  username: string;
  password: string;
  /** Opcional. Com convite, o e-mail do convite (se houver) vale sobre este. */
  email?: string;
  /** Token de convite de uso único (ADMIN, 72 h): define o perfil da conta nova. */
  inviteToken?: string;
}
