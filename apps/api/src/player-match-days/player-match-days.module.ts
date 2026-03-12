import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlayerMatchDay } from './entities/player-match-day.entity';
import { Player } from '../players/entities/player.entity';
import { MatchDay } from '../match-days/entities/match-day.entity';
import { GuestPerson } from '../guest-people/entities/guest-person.entity';
import { Team } from '../teams/entities/team.entity';
import { PlayerMatchDaysService } from './player-match-days.service';
import { PlayerMatchDaysController } from './player-match-days.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PlayerMatchDay,
      Player,
      MatchDay,
      GuestPerson,
      Team,
    ]),
  ],
  controllers: [PlayerMatchDaysController],
  providers: [PlayerMatchDaysService],
  exports: [PlayerMatchDaysService],
})
export class PlayerMatchDaysModule {}
