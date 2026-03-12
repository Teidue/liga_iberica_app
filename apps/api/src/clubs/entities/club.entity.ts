import { Column, Entity, OneToMany } from 'typeorm';
import { MatchDay } from '../../match-days/entities/match-day.entity';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('clubs')
export class Club extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  nombre!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  direccion!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  formatoExcel!: object | null;

  // Relaciones según SRS
  @OneToMany(() => MatchDay, (matchDay) => matchDay.club)
  matchDays!: MatchDay[];
}
