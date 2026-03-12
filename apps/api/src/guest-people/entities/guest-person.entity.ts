import { Column, Entity, OneToMany } from 'typeorm';
import { PlayerMatchDay } from '../../player-match-days/entities/player-match-day.entity';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('guest_people')
export class GuestPerson extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  nombre!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  documento!: string;

  @Column({ type: 'text', nullable: true })
  notas!: string | null;

  // Relaciones según SRS
  @OneToMany(() => PlayerMatchDay, (playerMatchDay) => playerMatchDay.guest)
  playerMatchDays!: PlayerMatchDay[];
}
