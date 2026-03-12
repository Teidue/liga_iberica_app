// Enums
export type UserRole = 'SUPER_ADMIN' | 'TEAM_ADMIN'
export type PaymentMethod = 'BINANCE' | 'ZINLI' | 'TRANSFERENCIA' | 'EFECTIVO' | 'OTRO'
export type PaymentStatus = 'pending' | 'approved' | 'rejected'

// Base
export interface BaseEntity {
  id: string
  created_at: string
  updated_at: string
}

// Auth
export interface LoginRequest { email: string; password: string }
export interface RegisterRequest { nombre: string; email: string; password: string; rol?: UserRole }
export interface AuthResponse { access_token: string; user: User }

// Entities
export interface User extends BaseEntity {
  nombre: string; email: string; rol: UserRole
}
export interface Team extends BaseEntity {
  nombre: string; adminId: string | null; admin?: User; players?: Player[]
}
export interface Player extends BaseEntity {
  nombre: string; documento: string; teamId: string; estado: boolean; team?: Team
}
export interface Club extends BaseEntity {
  nombre: string; direccion: string | null; formatoExcel: Record<string, unknown> | null
}
export interface Tournament extends BaseEntity {
  nombre: string; montoInscripcion: number; fechaInicio: string; fechaFin: string
}
export interface MatchDay extends BaseEntity {
  fecha: string; tournamentId: string; clubId: string; cerrado: boolean;
  tournament?: { id: string; nombre: string };
  club?: { id: string; nombre: string; direccion?: string | null; formatoExcel?: Record<string, unknown> | null }
}
export interface TournamentTeam extends BaseEntity {
  tournamentId: string; teamId: string; montoInscripcion: number;
  tournament?: Tournament; team?: Team; payments?: Payment[]
}
export interface Payment extends BaseEntity {
  tournamentTeamId: string; monto: number; fecha: string;
  metodo: PaymentMethod; referencia: string | null; imagen: string | null;
  aprobado: boolean;
  status: PaymentStatus;
  tournamentTeam?: TournamentTeam
}
export interface PlayerMatchDay extends BaseEntity {
  playerId: string; matchDayId: string; va: boolean; guestId: string | null;
  player?: Player & { teamId: string }; matchDay?: MatchDay; guest?: GuestPerson
}
export interface GuestPerson extends BaseEntity {
  nombre: string; documento: string; notas: string | null
}
