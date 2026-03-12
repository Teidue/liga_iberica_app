import 'dotenv/config';
import { DataSource } from 'typeorm';
import { User } from './users/entities/user.entity';
import { Team } from './teams/entities/team.entity';
import { Player } from './players/entities/player.entity';
import { Club } from './clubs/entities/club.entity';
import { Tournament } from './tournaments/entities/tournament.entity';
import { MatchDay } from './match-days/entities/match-day.entity';
import { GuestPerson } from './guest-people/entities/guest-person.entity';
import { PlayerMatchDay } from './player-match-days/entities/player-match-day.entity';
import { TournamentTeam } from './tournament-teams/entities/tournament-team.entity';
import { Payment } from './payments/entities/payment.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'liga_iberica',
  entities: [
    User,
    Team,
    Player,
    Club,
    Tournament,
    MatchDay,
    GuestPerson,
    PlayerMatchDay,
    TournamentTeam,
    Payment,
  ],
  migrations: ['src/migrations/*.ts'],
  migrationsTableName: 'migrations',
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
});
