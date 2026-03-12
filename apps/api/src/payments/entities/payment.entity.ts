import { Column, Entity, ManyToOne } from 'typeorm';
import { TournamentTeam } from '../../tournament-teams/entities/tournament-team.entity';
import { PaymentMethod, PaymentStatus } from '../../common/enums';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('payments')
export class Payment extends BaseEntity {
  @Column({ type: 'uuid' })
  tournamentTeamId!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monto!: number;

  @Column({ type: 'timestamp' })
  fecha!: Date;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
  })
  metodo!: PaymentMethod;

  @Column({ type: 'varchar', length: 255, nullable: true })
  referencia!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  imagen!: string | null;

  @Column({ type: 'boolean', default: false })
  aprobado!: boolean;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status!: PaymentStatus;

  // Relaciones según SRS
  @ManyToOne(() => TournamentTeam, (tournamentTeam) => tournamentTeam.payments)
  tournamentTeam!: TournamentTeam;
}
