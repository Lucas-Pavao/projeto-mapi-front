import axios from 'axios';

// Sem baseURL absoluta: front e API são "same-origin" (nginx/vite proxeiam /api pro backend
// real — ver nginx.conf e vite.config.ts), então caminhos relativos como '/api/pontos' já
// resolvem certo sozinhos.
const api = axios.create({
  // Necessário pro navegador enviar/receber o cookie httpOnly de sessão em cada requisição.
  withCredentials: true,
});

// Response Interceptor: em 401 (sessão ausente/inválida/expirada — o cookie httpOnly não pode
// ser inspecionado pelo JS, então só descobrimos isso pela resposta da API), a sessão local não
// serve mais pra nada — desloga e manda pro login. Um 403 é diferente (usuário autenticado mas
// sem permissão pra aquele recurso específico) e não deve derrubar uma sessão válida.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401 && window.location.pathname !== '/login') {
      console.warn('Sessão expirada ou inválida. Encerrando sessão local...');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
