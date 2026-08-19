import api from '@/lib/api';
import type { AuthResponse, RegisterRequest, User } from '../types';

export const authService = {
  async login(username: string, password: string): Promise<AuthResponse> {
    // O backend seta accessToken/refreshToken como cookies httpOnly na resposta — o JS não
    // precisa (e não deve) manipular o token diretamente.
    await api.post('/api/auth/login', { username, password });
    return { user: { username } };
  },

  async register(data: RegisterRequest): Promise<void> {
    await api.post('/api/auth/register', data);
  },

  /** Renova a sessão usando o refresh token do cookie httpOnly (enviado automaticamente). */
  async refresh(): Promise<void> {
    await api.post('/api/auth/refresh');
  },

  /**
   * Verifica se existe uma sessão válida (cookie httpOnly) e quem é o usuário. Como o JS não
   * consegue ler um cookie httpOnly, essa é a única forma de saber "estou logado?" ao carregar
   * a aplicação — por isso é chamada uma vez no mount do AuthProvider.
   */
  async me(): Promise<User> {
    const response = await api.get<User>('/api/auth/me');
    return response.data;
  },

  async logout(): Promise<void> {
    // O backend limpa os cookies httpOnly (o JS não consegue apagá-los sozinho) e revoga o
    // refresh token no banco.
    await api.post('/api/auth/logout');
  },
};
