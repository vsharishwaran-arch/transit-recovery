import axios from 'axios';
import type {
  User,
  TicketSession,
  RecoveryStats,
  RecoveryLog,
  BatchRun,
  BatchDetail,
  PaginatedSessions,
} from '../types/transit';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

// ─── Auth API ────────────────────────────────────────────────────────────────
export const authApi = {
  login: (employeeId: string, password: string) =>
    api.post<{ success: boolean; user: User }>('/auth/login', { employeeId, password }),

  logout: () => api.post('/auth/logout'),

  getMe: () => api.get<{ success: boolean; user: User }>('/auth/me'),
};

// ─── Conductor API ────────────────────────────────────────────────────────────
export const conductorApi = {
  createTicket: (
    routeId: string,
    busNumber: string,
    passengerCount: number,
    paymentMethod: 'upi' | 'cash',
    extras?: { vehicleSpeed?: number; networkStrength?: string; passengerLoad?: string }
  ) =>
    api.post<{ success: boolean; session: TicketSession; paymentLink?: string; qrCode?: string }>(
      '/conductor/ticket',
      { routeId, busNumber, passengerCount, paymentMethod, ...extras }
    ),

  getStatus: (sessionId: string) =>
    api.get<{ success: boolean; status: string; session: TicketSession }>(
      `/conductor/ticket/${sessionId}/status`
    ),

  getMyTickets: () =>
    api.get<{ success: boolean; tickets: TicketSession[] }>('/conductor/tickets'),
};

// ─── Recovery API ─────────────────────────────────────────────────────────────
export const recoveryApi = {
  getFailedSessions: (params?: { page?: number; limit?: number }) =>
    api.get<PaginatedSessions>('/recovery/sessions', { params }),

  getStats: () => api.get<{ success: boolean; stats: RecoveryStats }>('/recovery/stats'),

  getEscalated: () =>
    api.get<{ success: boolean; escalated: RecoveryLog[] }>('/recovery/escalated'),

  getBatchHistory: () =>
    api.get<{ success: boolean; batches: BatchRun[] }>('/recovery/batches'),

  getBatchDetail: (batchRunId: string) =>
    api.get<{ success: boolean } & BatchDetail>(`/recovery/batches/${batchRunId}`),

  markAsRecovered: (recoveryLogId: string) =>
    api.patch<{ success: boolean; log: RecoveryLog }>('/recovery/mark-recovered', {
      recoveryLogId,
    }),
};

// ─── Agent API ────────────────────────────────────────────────────────────────
export const agentApi = {
  runAgent: (batchSize: number, language: string, routeFilter: string) =>
    api.post<{ success: boolean; batchRun: BatchRun }>('/agent/run', {
      batchSize,
      language,
      routeFilter,
    }),
};

export default api;
