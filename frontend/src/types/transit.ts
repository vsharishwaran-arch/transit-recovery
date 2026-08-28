// TypeScript interfaces for all Transit Recovery Agent domain models

export type FailureReason =
  | 'network_handoff'
  | 'peak_load'
  | 'insufficient_funds'
  | 'timeout'
  | 'user_cancelled'
  | 'webhook_dropout'
  | 'unknown';

export type RecoveryStatus =
  | 'pending'
  | 'sent'
  | 'recovered'
  | 'failed'
  | 'escalated'
  | 'skipped';

export type MessageLanguage = 'english' | 'hinglish' | 'tamil';
export type NetworkStrength = 'strong' | 'weak' | 'none';
export type PassengerLoad = 'low' | 'medium' | 'high' | 'overcrowded';
export type UpiStatus = 'pending' | 'paid' | 'failed' | 'expired' | 'cancelled' | 'payment_success_ticket_failed';
export type SuggestedAction = 'retry_upi' | 'pay_cash' | 'retry_at_stop' | 'generate_ticket';

export interface VehicleContext {
  speed: number;
  networkStrength: NetworkStrength;
  passengerLoad: PassengerLoad;
}

export interface Route {
  _id: string;
  routeNumber: string;
  from: string;
  to: string;
  distanceKm: number;
  fare: number;
  avgDailyPassengers: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  _id: string;
  name: string;
  employeeId: string;
  role: 'conductor' | 'admin';
  assignedRoute?: Route | string;
  assignedBus?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TicketSession {
  _id: string;
  sessionId: string;
  routeId: Route | string;
  conductorId: User | string;
  busNumber: string;
  passengerCount: number;
  amount: number;
  paymentMethod: 'upi' | 'cash';
  upiStatus: UpiStatus;
  vehicleSpeed: number;
  networkStrength: NetworkStrength;
  passengerLoad: PassengerLoad;
  providerStatus: string | null;
  createdAt: string;
  updatedAt: string;
  // Enriched field from API
  latestLog?: RecoveryLog | null;
}

export interface RecoveryLog {
  _id: string;
  sessionId: string;
  routeId?: Route | string;
  busNumber?: string;
  amount: number;
  failureReason: FailureReason;
  vehicleContext?: VehicleContext;
  aiMessage: string;
  messageLanguage: MessageLanguage;
  suggestedAction: SuggestedAction;
  status: RecoveryStatus;
  skipReason?: string | null;
  attemptNumber: number;
  batchRunId?: string;
  attemptedAt: string;
  recoveredAt?: string | null;
  escalatedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BatchRun {
  _id: string;
  batchRunId: string;
  triggeredBy: 'manual' | 'scheduled';
  language: MessageLanguage;
  routeFilter: string;
  status: 'running' | 'completed' | 'failed';
  sessionsScanned: number;
  sessionsAttempted: number;
  sessionsSkipped: number;
  sessionsEscalated: number;
  sessionsRecovered: number;
  amountAtRisk: number;
  amountRecovered: number;
  skipReasons: Record<string, number>;
  startedAt: string;
  completedAt: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RecoveryStats {
  amountAtRisk: number;
  failedSessionCount: number;
  recoveryAttempted: number;
  recoveredCount: number;
  amountRecovered: number;
  recoveryRate: number;
  failureBreakdown: Array<{ _id: string; count: number }>;
  reasonBreakdown: Array<{ _id: FailureReason; count: number; amount: number }>;
}

export interface BatchDetail {
  batch: BatchRun;
  logs: RecoveryLog[];
}

export interface PaginatedSessions {
  sessions: TicketSession[];
  total: number;
  page: number;
  limit: number;
}
