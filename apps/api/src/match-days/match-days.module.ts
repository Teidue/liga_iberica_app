import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MatchDay } from './entities/match-day.entity';
import { Tournament } from '../tournaments/entities/tournament.entity';
import { Club } from '../clubs/entities/club.entity';
import { MatchDaysService } from './match-days.service';
import { MatchDaysController } from './match-days.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MatchDay, Tournament, Club])],
  controllers: [MatchDaysController],
  providers: [MatchDaysService],
  exports: [MatchDaysService],
})
export class MatchDaysModule {}
