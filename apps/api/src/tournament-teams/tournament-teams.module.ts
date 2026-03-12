import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TournamentTeam } from './entities/tournament-team.entity';
import { Tournament } from '../tournaments/entities/tournament.entity';
import { Team } from '../teams/entities/team.entity';
import { Player } from '../players/entities/player.entity';
import { TournamentTeamsService } from './tournament-teams.service';
import { TournamentTeamsController } from './tournament-teams.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([TournamentTeam, Tournament, Team, Player]),
  ],
  controllers: [TournamentTeamsController],
  providers: [TournamentTeamsService],
  exports: [TournamentTeamsService],
})
export class TournamentTeamsModule {}
