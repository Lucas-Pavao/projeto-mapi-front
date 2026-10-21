export interface User {
  username: string;
  role?: string;
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
