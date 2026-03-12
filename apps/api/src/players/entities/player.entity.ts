import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { Team } from '../../teams/entities/team.entity';
import { PlayerMatchDay } from '../../player-match-days/entities/player-match-day.entity';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('players')
export class Player extends BaseEntity {
  @Column({ type: 'uuid' })
  teamId!: string;

  @Column({ type: 'varchar', length: 255 })
  nombre!: string;

  @Column({ type: 'varchar', length: 255 })
  documento!: string;

  @Column({ type: 'boolean', default: true })
  estado!: boolean;

  // Relaciones según SRS
  @ManyToOne(() => Team, (team) => team.players)
  team!: Team;

  @OneToMany(() => PlayerMatchDay, (playerMatchDay) => playerMatchDay.player)
  playerMatchDays!: PlayerMatchDay[];
}
