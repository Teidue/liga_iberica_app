import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from './entities/team.entity';
import { User } from '../users/entities/user.entity';
import { Player } from '../players/entities/player.entity';
import { UserRole } from '../common/enums';
import {
  CreateTeamDto,
  UpdateTeamDto,
  TeamResponseDto,
  TeamWithPlayersDto,
} from './dto/team.dto';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team)
    private teamsRepository: Repository<Team>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Player)
    private playersRepository: Repository<Player>,
  ) {}

  async create(createTeamDto: CreateTeamDto): Promise<TeamResponseDto> {
    // Verificar si ya existe un equipo con el mismo nombre
    const existingTeam = await this.teamsRepository.findOne({
      where: { nombre: createTeamDto.nombre },
    });

    if (existingTeam) {
      throw new ConflictException('Ya existe un equipo con ese nombre');
    }

    // Si se proporciona adminId, verificar que el usuario existe
    if (createTeamDto.adminId) {
      const admin = await this.usersRepository.findOne({
        where: { id: createTeamDto.adminId },
      });

      if (!admin) {
        throw new NotFoundException('El administrador especificado no existe');
      }

      // Verificar que el usuario tiene rol TEAM_ADMIN
      if (admin.rol !== UserRole.TEAM_ADMIN) {
        throw new ConflictException(
          'El usuario especificado no es un TEAM_ADMIN',
        );
      }
    }

    const team = this.teamsRepository.create({
      nombre: createTeamDto.nombre,
      adminId: createTeamDto.adminId,
    });
    const savedTeam = await this.teamsRepository.save(team);

    const players = createTeamDto.players.map((p) =>
      this.playersRepository.create({
        nombre: p.nombre,
        documento: p.documento,
        teamId: savedTeam.id,
        estado: true,
      }),
    );
    await this.playersRepository.save(players);

    return this.findOneResponse(savedTeam.id);
  }

  async findAll(): Promise<TeamWithPlayersDto[]> {
    const teams = await this.teamsRepository.find({
      relations: ['admin', 'players'],
    });

    return teams.map((team) => ({
      id: team.id,
      nombre: team.nombre,
      adminId: team.adminId,
      admin: team.admin
        ? {
            id: team.admin.id,
            nombre: team.admin.nombre,
            email: team.admin.email,
          }
        : null,
      playersCount: team.players.filter((p) => p.estado).length,
    }));
  }

  async findOne(id: string): Promise<TeamWithPlayersDto> {
    const team = await this.teamsRepository.findOne({
      where: { id },
      relations: ['admin', 'players'],
    });

    if (!team) {
      throw new NotFoundException('Equipo no encontrado');
    }

    return {
      id: team.id,
      nombre: team.nombre,
      adminId: team.adminId,
      admin: team.admin
        ? {
            id: team.admin.id,
            nombre: team.admin.nombre,
            email: team.admin.email,
          }
        : null,
      playersCount: team.players.filter((p) => p.estado).length,
    };
  }

  async findOneResponse(id: string): Promise<TeamResponseDto> {
    const team = await this.teamsRepository.findOne({
      where: { id },
      relations: ['admin'],
    });

    if (!team) {
      throw new NotFoundException('Equipo no encontrado');
    }

    return {
      id: team.id,
      nombre: team.nombre,
      adminId: team.adminId,
      admin: team.admin
        ? {
            id: team.admin.id,
            nombre: team.admin.nombre,
            email: team.admin.email,
          }
        : null,
    };
  }

  async update(
    id: string,
    updateTeamDto: UpdateTeamDto,
  ): Promise<TeamResponseDto> {
    const team = await this.teamsRepository.findOne({
      where: { id },
    });

    if (!team) {
      throw new NotFoundException('Equipo no encontrado');
    }

    // Si se actualiza el nombre, verificar que no exista otro equipo con ese nombre
    if (updateTeamDto.nombre && updateTeamDto.nombre !== team.nombre) {
      const existingTeam = await this.teamsRepository.findOne({
        where: { nombre: updateTeamDto.nombre },
      });

      if (existingTeam) {
        throw new ConflictException('Ya existe un equipo con ese nombre');
      }
    }

    // Si se proporciona adminId, verificar que el usuario existe y es TEAM_ADMIN
    if (updateTeamDto.adminId !== undefined) {
      if (updateTeamDto.adminId) {
        const admin = await this.usersRepository.findOne({
          where: { id: updateTeamDto.adminId },
        });

        if (!admin) {
          throw new NotFoundException(
            'El administrador especificado no existe',
          );
        }

        if (admin.rol !== UserRole.TEAM_ADMIN) {
          throw new ConflictException(
            'El usuario especificado no es un TEAM_ADMIN',
          );
        }
      }
    }

    Object.assign(team, updateTeamDto);
    const savedTeam = await this.teamsRepository.save(team);

    return this.findOneResponse(savedTeam.id);
  }

  async remove(id: string): Promise<void> {
    const team = await this.teamsRepository.findOne({
      where: { id },
      relations: ['players', 'tournamentTeams'],
    });

    if (!team) {
      throw new NotFoundException('Equipo no encontrado');
    }

    // Verificar si el equipo tiene jugadores activos o inscripciones a torneos
    const activePlayers = team.players.filter((p) => p.estado);
    if (activePlayers.length > 0) {
      throw new ConflictException(
        'No se puede eliminar un equipo con jugadores activos',
      );
    }

    if (team.tournamentTeams.length > 0) {
      throw new ConflictException(
        'No se puede eliminar un equipo inscrito en torneos',
      );
    }

    await this.teamsRepository.remove(team);
  }

  async findByAdmin(adminId: string): Promise<TeamWithPlayersDto[]> {
    const teams = await this.teamsRepository.find({
      where: { adminId },
      relations: ['admin', 'players'],
    });

    return teams.map((team) => ({
      id: team.id,
      nombre: team.nombre,
      adminId: team.adminId,
      admin: team.admin
        ? {
            id: team.admin.id,
            nombre: team.admin.nombre,
            email: team.admin.email,
          }
        : null,
      playersCount: team.players.filter((p) => p.estado).length,
    }));
  }
}
