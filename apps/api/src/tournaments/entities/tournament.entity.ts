import { Column, Entity, OneToMany } from 'typeorm';
import { MatchDay } from '../../match-days/entities/match-day.entity';
import { TournamentTeam } from '../../tournament-teams/entities/tournament-team.entity';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('tournaments')
export class Tournament extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  nombre!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  montoInscripcion!: number;

  @Column({ type: 'date' })
  fechaInicio!: Date;

  @Column({ type: 'date' })
  fechaFin!: Date;

  // Relaciones según SRS
  @OneToMany(() => MatchDay, (matchDay) => matchDay.tournament)
  matchDays!: MatchDay[];

  @OneToMany(
    () => TournamentTeam,
    (tournamentTeam) => tournamentTeam.tournament,
  )
  tournamentTeams!: TournamentTeam[];
}
