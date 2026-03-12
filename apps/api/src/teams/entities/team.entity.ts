import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Player } from '../../players/entities/player.entity';
import { TournamentTeam } from '../../tournament-teams/entities/tournament-team.entity';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('teams')
export class Team extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  nombre!: string;

  @Column({ type: 'uuid', nullable: true })
  adminId!: string | null;

  // Relaciones según SRS
  @ManyToOne(() => User, (user) => user.teams, { nullable: true })
  admin!: User;

  @OneToMany(() => Player, (player) => player.team)
  players!: Player[];

  @OneToMany(() => TournamentTeam, (tournamentTeam) => tournamentTeam.team)
  tournamentTeams!: TournamentTeam[];
}
