import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Player } from './entities/player.entity';
import { Team } from '../teams/entities/team.entity';
import {
  CreatePlayerDto,
  UpdatePlayerDto,
  PlayerResponseDto,
  PlayerWithStatsDto,
} from './dto/player.dto';

@Injectable()
export class PlayersService {
  constructor(
    @InjectRepository(Player)
    private playersRepository: Repository<Player>,
    @InjectRepository(Team)
    private teamsRepository: Repository<Team>,
  ) {}

  async create(createPlayerDto: CreatePlayerDto): Promise<PlayerResponseDto> {
    // Verificar que el equipo existe
    const team = await this.teamsRepository.findOne({
      where: { id: createPlayerDto.teamId },
    });

    if (!team) {
      throw new NotFoundException('El equipo especificado no existe');
    }

    // Verificar que no exista un jugador con el mismo documento en el mismo equipo
    const existingPlayer = await this.playersRepository.findOne({
      where: {
        documento: createPlayerDto.documento,
        teamId: createPlayerDto.teamId,
      },
    });

    if (existingPlayer) {
      throw new ConflictException(
        'Ya existe un jugador con ese documento en este equipo',
      );
    }

    const player = this.playersRepository.create(createPlayerDto);
    const savedPlayer = await this.playersRepository.save(player);

    return this.findOneResponse(savedPlayer.id);
  }

  async findAll(teamId?: string): Promise<PlayerResponseDto[]> {
    const whereCondition = teamId ? { teamId } : {};

    const players = await this.playersRepository.find({
      where: whereCondition,
      relations: ['team'],
    });

    return players.map((player) => ({
      id: player.id,
      nombre: player.nombre,
      documento: player.documento,
      estado: player.estado,
      teamId: player.teamId,
      team: player.team
        ? {
            id: player.team.id,
            nombre: player.team.nombre,
          }
        : undefined,
    }));
  }

  async findActive(teamId?: string): Promise<PlayerResponseDto[]> {
    const whereCondition: FindOptionsWhere<Player> = { estado: true };
    if (teamId) {
      whereCondition.teamId = teamId;
    }

    const players = await this.playersRepository.find({
      where: whereCondition,
      relations: ['team'],
    });

    return players.map((player) => ({
      id: player.id,
      nombre: player.nombre,
      documento: player.documento,
      estado: player.estado,
      teamId: player.teamId,
      team: player.team
        ? {
            id: player.team.id,
            nombre: player.team.nombre,
          }
        : undefined,
    }));
  }

  async findOne(id: string): Promise<PlayerWithStatsDto> {
    const player = await this.playersRepository.findOne({
      where: { id },
      relations: ['team', 'playerMatchDays'],
    });

    if (!player) {
      throw new NotFoundException('Jugador no encontrado');
    }

    // Calcular estadísticas
    const matchDaysCount = player.playerMatchDays.length;
    const activeMatchDaysCount = player.playerMatchDays.filter(
      (pmd) => pmd.va,
    ).length;

    return {
      id: player.id,
      nombre: player.nombre,
      documento: player.documento,
      estado: player.estado,
      teamId: player.teamId,
      team: player.team
        ? {
            id: player.team.id,
            nombre: player.team.nombre,
          }
        : undefined,
      matchDaysCount,
      activeMatchDaysCount,
    };
  }

  async findOneResponse(id: string): Promise<PlayerResponseDto> {
    const player = await this.playersRepository.findOne({
      where: { id },
      relations: ['team'],
    });

    if (!player) {
      throw new NotFoundException('Jugador no encontrado');
    }

    return {
      id: player.id,
      nombre: player.nombre,
      documento: player.documento,
      estado: player.estado,
      teamId: player.teamId,
      team: player.team
        ? {
            id: player.team.id,
            nombre: player.team.nombre,
          }
        : undefined,
    };
  }

  async update(
    id: string,
    updatePlayerDto: UpdatePlayerDto,
  ): Promise<PlayerResponseDto> {
    const player = await this.playersRepository.findOne({
      where: { id },
    });

    if (!player) {
      throw new NotFoundException('Jugador no encontrado');
    }

    // Si se actualiza el documento, verificar que no exista otro jugador con ese documento en el mismo equipo
    if (
      updatePlayerDto.documento &&
      updatePlayerDto.documento !== player.documento
    ) {
      const existingPlayer = await this.playersRepository.findOne({
        where: {
          documento: updatePlayerDto.documento,
          teamId: player.teamId,
        },
      });

      if (existingPlayer) {
        throw new ConflictException(
          'Ya existe un jugador con ese documento en este equipo',
        );
      }
    }

    Object.assign(player, updatePlayerDto);
    const savedPlayer = await this.playersRepository.save(player);

    return this.findOneResponse(savedPlayer.id);
  }

  async remove(id: string): Promise<void> {
    const player = await this.playersRepository.findOne({
      where: { id },
      relations: ['playerMatchDays'],
    });

    if (!player) {
      throw new NotFoundException('Jugador no encontrado');
    }

    // En lugar de eliminar, marcar como inactivo (soft delete)
    if (player.estado) {
      player.estado = false;
      await this.playersRepository.save(player);
    } else {
      // Si ya está inactivo, se puede eliminar completamente
      await this.playersRepository.remove(player);
    }
  }

  async findByTeam(
    teamId: string,
    activeOnly: boolean = false,
  ): Promise<PlayerResponseDto[]> {
    if (activeOnly) {
      return this.findActive(teamId);
    }
    return this.findAll(teamId);
  }

  async findByDocument(
    documento: string,
    teamId?: string,
  ): Promise<PlayerResponseDto[]> {
    const whereCondition: FindOptionsWhere<Player> = { documento };
    if (teamId) {
      whereCondition.teamId = teamId;
    }

    const players = await this.playersRepository.find({
      where: whereCondition,
      relations: ['team'],
    });

    return players.map((player) => ({
      id: player.id,
      nombre: player.nombre,
      documento: player.documento,
      estado: player.estado,
      teamId: player.teamId,
      team: player.team
        ? {
            id: player.team.id,
            nombre: player.team.nombre,
          }
        : undefined,
    }));
  }
}
