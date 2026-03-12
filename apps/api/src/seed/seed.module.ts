import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SeedService } from './seed.service';
import { User } from '../users/entities/user.entity';
import { Team } from '../teams/entities/team.entity';
import { Player } from '../players/entities/player.entity';
import { Club } from '../clubs/entities/club.entity';
import { Tournament } from '../tournaments/entities/tournament.entity';
import { MatchDay } from '../match-days/entities/match-day.entity';
import { TournamentTeam } from '../tournament-teams/entities/tournament-team.entity';
import { Payment } from '../payments/entities/payment.entity';
import { GuestPerson } from '../guest-people/entities/guest-person.entity';
import { PlayerMatchDay } from '../player-match-days/entities/player-match-day.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Team,
      Player,
      Club,
      Tournament,
      MatchDay,
      TournamentTeam,
      Payment,
      GuestPerson,
      PlayerMatchDay,
    ]),
  ],
  providers: [SeedService],
})
export class SeedModule {}
