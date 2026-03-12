import { Column, Entity, OneToMany } from 'typeorm';
import { UserRole } from '../../common/enums';
import { Team } from '../../teams/entities/team.entity';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  nombre!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({
    type: 'enum',
    enum: UserRole,
  })
  rol!: UserRole;

  // Relaciones según SRS
  @OneToMany(() => Team, (team) => team.admin)
  teams!: Team[];
}
