import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as path from 'path';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TeamsModule } from './teams/teams.module';
import { PlayersModule } from './players/players.module';
import { ClubsModule } from './clubs/clubs.module';
import { TournamentsModule } from './tournaments/tournaments.module';
import { MatchDaysModule } from './match-days/match-days.module';
import { GuestPeopleModule } from './guest-people/guest-people.module';
import { PlayerMatchDaysModule } from './player-match-days/player-match-days.module';
import { TournamentTeamsModule } from './tournament-teams/tournament-teams.module';
import { PaymentsModule } from './payments/payments.module';
import { DatabaseModule } from './database/database.module';
import { SeedModule } from './seed/seed.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'production'
          ? '.env'
          : path.resolve(__dirname, '../../.env'),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isProduction =
          configService.get<string>('NODE_ENV') === 'production';

        return {
          type: 'postgres',
          host: configService.get<string>('DB_HOST') || 'localhost',
          port: parseInt(configService.get<string>('DB_PORT') || '5432', 10),
          username: configService.get<string>('DB_USER') || 'postgres',
          password: configService.get<string>('DB_PASSWORD') || 'postgres',
          database: configService.get<string>('DB_NAME') || 'liga_iberica',
          autoLoadEntities: true,
          synchronize: true,
          logging: !isProduction,
          ssl: isProduction ? { rejectUnauthorized: false } : false,
          extra: isProduction
            ? {
                max: 20,
                min: 5,
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 2000,
                statement_timeout: 30000,
                query_timeout: 30000,
                application_name: 'liga-iberica-api',
              }
            : {
                max: 10,
                min: 2,
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 5000,
              },
        };
      },
    }),
    AuthModule,
    UsersModule,
    TeamsModule,
    PlayersModule,
    ClubsModule,
    TournamentsModule,
    MatchDaysModule,
    GuestPeopleModule,
    PlayerMatchDaysModule,
    TournamentTeamsModule,
    PaymentsModule,
    DatabaseModule,
    SeedModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
