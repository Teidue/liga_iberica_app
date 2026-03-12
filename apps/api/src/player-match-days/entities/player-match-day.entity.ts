import { Column, Entity, ManyToOne, Unique } from 'typeorm';
import { Player } from '../../players/entities/player.entity';
import { MatchDay } from '../../match-days/entities/match-day.entity';
import { GuestPerson } from '../../guest-people/entities/guest-person.entity';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('player_match_days')
@Unique(['playerId', 'matchDayId']) // Asistencia única por jugador y jornada
export class PlayerMatchDay extends BaseEntity {
  @Column({ type: 'uuid' })
  playerId!: string;

  @Column({ type: 'uuid' })
  matchDayId!: string;

  @Column({ type: 'boolean' })
  va!: boolean;

  @Column({ type: 'uuid', nullable: true })
  guestId!: string | null;

  // Relaciones según SRS
  @ManyToOne(() => Player, (player) => player.playerMatchDays)
  player!: Player;

  @ManyToOne(() => MatchDay, (matchDay) => matchDay.playerMatchDays)
  matchDay!: MatchDay;

  @ManyToOne(() => GuestPerson, (guestPerson) => guestPerson.playerMatchDays, {
    nullable: true,
  })
  guest!: GuestPerson;
}
