import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { PlayerMatchDay } from './entities/player-match-day.entity';
import {
  CreatePlayerMatchDayDto,
  UpdatePlayerMatchDayDto,
  PlayerMatchDayResponseDto,
  PlayerMatchDayWithRelationsDto,
} from './dto/player-match-day.dto';
import { Player } from '../players/entities/player.entity';
import { MatchDay } from '../match-days/entities/match-day.entity';
import { GuestPerson } from '../guest-people/entities/guest-person.entity';
import { Team } from '../teams/entities/team.entity';

@Injectable()
export class PlayerMatchDaysService {
  constructor(
    @InjectRepository(PlayerMatchDay)
    private playerMatchDaysRepository: Repository<PlayerMatchDay>,
    @InjectRepository(Player)
    private playersRepository: Repository<Player>,
    @InjectRepository(MatchDay)
    private matchDaysRepository: Repository<MatchDay>,
    @InjectRepository(GuestPerson)
    private guestPeopleRepository: Repository<GuestPerson>,
    @InjectRepository(Team)
    private teamsRepository: Repository<Team>,
  ) {}

  async create(
    createPlayerMatchDayDto: CreatePlayerMatchDayDto,
    teamAdminId?: string,
  ): Promise<PlayerMatchDayResponseDto> {
    await this.validatePlayerAndMatchDay(
      createPlayerMatchDayDto.playerId,
      createPlayerMatchDayDto.matchDayId,
      teamAdminId,
    );

    if (createPlayerMatchDayDto.guestId) {
      await this.validateGuestNotUsedInMatchDay(
        createPlayerMatchDayDto.guestId,
        createPlayerMatchDayDto.matchDayId,
      );
    }

    const playerMatchDay = this.playerMatchDaysRepository.create(
      createPlayerMatchDayDto,
    );
    const saved = await this.playerMatchDaysRepository.save(playerMatchDay);

    return this.toResponseDto(saved);
  }

  async bulkCreate(
    createPlayerMatchDaysDto: CreatePlayerMatchDayDto[],
    teamAdminId?: string,
  ): Promise<PlayerMatchDayResponseDto[]> {
    const results: PlayerMatchDayResponseDto[] = [];

    for (const dto of createPlayerMatchDaysDto) {
      const result = await this.create(dto, teamAdminId);
      results.push(result);
    }

    return results;
  }

  async findAll(): Promise<PlayerMatchDayResponseDto[]> {
    const playerMatchDays = await this.playerMatchDaysRepository.find({
      order: { created_at: 'DESC' },
    });

    return playerMatchDays.map((pmd) => this.toResponseDto(pmd));
  }

  async findAllByMatchDay(
    matchDayId: string,
  ): Promise<PlayerMatchDayWithRelationsDto[]> {
    const playerMatchDays = await this.playerMatchDaysRepository.find({
      where: { matchDayId },
      relations: ['player', 'matchDay', 'guest'],
      order: { created_at: 'ASC' },
    });

    return playerMatchDays.map((pmd) => this.toRelationsDto(pmd));
  }

  async findAllByPlayer(
    playerId: string,
  ): Promise<PlayerMatchDayWithRelationsDto[]> {
    const playerMatchDays = await this.playerMatchDaysRepository.find({
      where: { playerId },
      relations: ['player', 'matchDay', 'guest'],
      order: { created_at: 'DESC' },
    });

    return playerMatchDays.map((pmd) => this.toRelationsDto(pmd));
  }

  async findOne(id: string): Promise<PlayerMatchDayWithRelationsDto> {
    const playerMatchDay = await this.playerMatchDaysRepository.findOne({
      where: { id },
      relations: ['player', 'matchDay', 'guest'],
    });

    if (!playerMatchDay) {
      throw new NotFoundException('Asistencia no encontrada');
    }

    return this.toRelationsDto(playerMatchDay);
  }

  async update(
    id: string,
    updatePlayerMatchDayDto: UpdatePlayerMatchDayDto,
    teamAdminId?: string,
  ): Promise<PlayerMatchDayResponseDto> {
    const playerMatchDay = await this.playerMatchDaysRepository.findOne({
      where: { id },
    });

    if (!playerMatchDay) {
      throw new NotFoundException('Asistencia no encontrada');
    }

    if (
      updatePlayerMatchDayDto.playerId ||
      updatePlayerMatchDayDto.matchDayId
    ) {
      await this.validatePlayerAndMatchDay(
        updatePlayerMatchDayDto.playerId || playerMatchDay.playerId,
        updatePlayerMatchDayDto.matchDayId || playerMatchDay.matchDayId,
        teamAdminId,
      );
    }

    if (updatePlayerMatchDayDto.guestId) {
      if (updatePlayerMatchDayDto.guestId !== playerMatchDay.guestId) {
        const targetMatchDayId =
          updatePlayerMatchDayDto.matchDayId || playerMatchDay.matchDayId;
        await this.validateGuestNotUsedInMatchDay(
          updatePlayerMatchDayDto.guestId,
          targetMatchDayId,
          id,
        );
      }
    }

    Object.assign(playerMatchDay, updatePlayerMatchDayDto);
    const saved = await this.playerMatchDaysRepository.save(playerMatchDay);

    return this.toResponseDto(saved);
  }

  async remove(id: string): Promise<void> {
    const playerMatchDay = await this.playerMatchDaysRepository.findOne({
      where: { id },
    });

    if (!playerMatchDay) {
      throw new NotFoundException('Asistencia no encontrada');
    }

    await this.playerMatchDaysRepository.remove(playerMatchDay);
  }

  async findByTeamAndMatchDay(
    adminId: string,
    matchDayId: string,
  ): Promise<PlayerMatchDayWithRelationsDto[]> {
    // The controller passes req.user.id (adminId), not a teamId.
    // Resolve teams that belong to this admin first.
    const teams = await this.teamsRepository.find({
      where: { adminId },
      select: ['id'],
    });

    const teamIds = teams.map((t) => t.id);
    if (teamIds.length === 0) return [];

    const players = await this.playersRepository.find({
      where: { teamId: In(teamIds), estado: true },
    });

    const playerIds = players.map((p) => p.id);
    if (playerIds.length === 0) return [];

    const playerMatchDays = await this.playerMatchDaysRepository.find({
      where: { matchDayId },
      relations: ['player', 'matchDay', 'guest'],
    });

    return playerMatchDays
      .filter((pmd) => playerIds.includes(pmd.playerId))
      .map((pmd) => this.toRelationsDto(pmd));
  }

  async getAttendanceStats(matchDayId: string): Promise<{
    total: number;
    attending: number;
    notAttending: number;
    withGuests: number;
  }> {
    const playerMatchDays = await this.playerMatchDaysRepository.find({
      where: { matchDayId },
    });

    const total = playerMatchDays.length;
    const attending = playerMatchDays.filter((pmd) => pmd.va).length;
    const notAttending = playerMatchDays.filter((pmd) => !pmd.va).length;
    const withGuests = playerMatchDays.filter(
      (pmd) => pmd.guestId !== null && pmd.guestId !== undefined,
    ).length;

    return { total, attending, notAttending, withGuests };
  }

  private async validatePlayerAndMatchDay(
    playerId: string,
    matchDayId: string,
    teamAdminId?: string,
  ): Promise<void> {
    const player = await this.playersRepository.findOne({
      where: { id: playerId },
      relations: ['team'],
    });

    if (!player) {
      throw new NotFoundException('Jugador no encontrado');
    }

    if (!player.estado) {
      throw new ConflictException('El jugador está inactivo');
    }

    const matchDay = await this.matchDaysRepository.findOne({
      where: { id: matchDayId },
    });

    if (!matchDay) {
      throw new NotFoundException('Jornada no encontrada');
    }

    if (matchDay.cerrado) {
      throw new ForbiddenException(
        'La asistencia de esta jornada ha sido cerrada por el administrador',
      );
    }

    if (teamAdminId && player.team?.adminId !== teamAdminId) {
      throw new ConflictException(
        'No puedes gestionar jugadores de otro equipo',
      );
    }
  }

  private async validateGuestNotUsedInMatchDay(
    guestId: string,
    matchDayId: string,
    excludeId?: string,
  ): Promise<void> {
    const guest = await this.guestPeopleRepository.findOne({
      where: { id: guestId },
    });

    if (!guest) {
      throw new NotFoundException('Invitado no encontrado');
    }

    const existingWithGuest = await this.playerMatchDaysRepository.find({
      where: { matchDayId, guestId },
    });

    if (excludeId) {
      const filtered = existingWithGuest.filter((pmd) => pmd.id !== excludeId);
      if (filtered.length > 0) {
        throw new ConflictException(
          'El invitado ya está asignado a otro jugador en esta jornada',
        );
      }
    } else if (existingWithGuest.length > 0) {
      throw new ConflictException(
        'El invitado ya está asignado a otro jugador en esta jornada',
      );
    }
  }

  private toResponseDto(pmd: PlayerMatchDay): PlayerMatchDayResponseDto {
    return {
      id: pmd.id,
      playerId: pmd.playerId,
      matchDayId: pmd.matchDayId,
      va: pmd.va,
      guestId: pmd.guestId,
      created_at: pmd.created_at,
      updated_at: pmd.updated_at,
    };
  }

  private toRelationsDto(pmd: PlayerMatchDay): PlayerMatchDayWithRelationsDto {
    return {
      ...this.toResponseDto(pmd),
      player: pmd.player
        ? {
            id: pmd.player.id,
            nombre: pmd.player.nombre,
            documento: pmd.player.documento,
            teamId: pmd.player.teamId,
          }
        : undefined,
      matchDay: pmd.matchDay
        ? {
            id: pmd.matchDay.id,
            fecha: pmd.matchDay.fecha,
          }
        : undefined,
      guest: pmd.guest
        ? {
            id: pmd.guest.id,
            nombre: pmd.guest.nombre,
            documento: pmd.guest.documento,
          }
        : null,
    };
  }
}
