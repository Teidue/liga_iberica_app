import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { Tournament } from '../../tournaments/entities/tournament.entity';
import { Club } from '../../clubs/entities/club.entity';
import { PlayerMatchDay } from '../../player-match-days/entities/player-match-day.entity';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('match_days')
export class MatchDay extends BaseEntity {
  @Column({ type: 'timestamp' })
  fecha!: Date;

  @Column({ type: 'uuid' })
  tournamentId!: string;

  @Column({ type: 'uuid' })
  clubId!: string;

  @Column({ type: 'boolean', default: false })
  cerrado!: boolean;

  // Relaciones según SRS
  @ManyToOne(() => Tournament, (tournament) => tournament.matchDays)
  tournament!: Tournament;

  @ManyToOne(() => Club, (club) => club.matchDays)
  club!: Club;

  @OneToMany(() => PlayerMatchDay, (playerMatchDay) => playerMatchDay.matchDay)
  playerMatchDays!: PlayerMatchDay[];
}
