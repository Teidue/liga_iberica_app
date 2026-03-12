import { Column, Entity, ManyToOne, OneToMany, Unique } from 'typeorm';
import { Tournament } from '../../tournaments/entities/tournament.entity';
import { Team } from '../../teams/entities/team.entity';
import { Payment } from '../../payments/entities/payment.entity';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('tournament_teams')
@Unique(['tournamentId', 'teamId']) // Inscripción única de un equipo en un torneo
export class TournamentTeam extends BaseEntity {
  @Column({ type: 'uuid' })
  tournamentId!: string;

  @Column({ type: 'uuid' })
  teamId!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  montoInscripcion!: number;

  // Relaciones según SRS
  @ManyToOne(() => Tournament, (tournament) => tournament.tournamentTeams)
  tournament!: Tournament;

  @ManyToOne(() => Team, (team) => team.tournamentTeams)
  team!: Team;

  @OneToMany(() => Payment, (payment) => payment.tournamentTeam)
  payments!: Payment[];
}
