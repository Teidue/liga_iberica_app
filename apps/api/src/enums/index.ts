export enum UserRole {
  ADMIN = 'admin',
  ORGANIZER = 'organizer',
  REFEREE = 'referee',
  PLAYER = 'player',
}

export enum TournamentStatus {
  DRAFT = 'draft',
  REGISTRATION = 'registration',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum MatchStatus {
  SCHEDULED = 'scheduled',
  LIVE = 'live',
  FINISHED = 'finished',
  CANCELLED = 'cancelled',
}

export enum TeamStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DISQUALIFIED = 'disqualified',
}
