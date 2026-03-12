import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TournamentTeam } from './entities/tournament-team.entity';
import {
  CreateTournamentTeamDto,
  UpdateTournamentTeamDto,
  TournamentTeamResponseDto,
  TournamentTeamWithRelationsDto,
} from './dto/tournament-team.dto';
import { Tournament } from '../tournaments/entities/tournament.entity';
import { Team } from '../teams/entities/team.entity';
import { Player } from '../players/entities/player.entity';
import { PaymentStatus } from '../common/enums';

@Injectable()
export class TournamentTeamsService {
  constructor(
    @InjectRepository(TournamentTeam)
    private tournamentTeamsRepository: Repository<TournamentTeam>,
    @InjectRepository(Tournament)
    private tournamentsRepository: Repository<Tournament>,
    @InjectRepository(Team)
    private teamsRepository: Repository<Team>,
    @InjectRepository(Player)
    private playersRepository: Repository<Player>,
  ) {}

  async create(
    createTournamentTeamDto: CreateTournamentTeamDto,
  ): Promise<TournamentTeamResponseDto> {
    const tournament = await this.tournamentsRepository.findOne({
      where: { id: createTournamentTeamDto.tournamentId },
    });
    if (!tournament) throw new NotFoundException('Torneo no encontrado');

    const team = await this.teamsRepository.findOne({
      where: { id: createTournamentTeamDto.teamId },
    });
    if (!team) throw new NotFoundException('Equipo no encontrado');

    const existing = await this.tournamentTeamsRepository.findOne({
      where: {
        tournamentId: createTournamentTeamDto.tournamentId,
        teamId: createTournamentTeamDto.teamId,
      },
    });

    if (existing) {
      throw new ConflictException('El equipo ya está inscrito en este torneo');
    }

    // Regla de negocio: el equipo debe tener al menos 8 jugadores activos
    const activePlayers = await this.playersRepository.count({
      where: { teamId: createTournamentTeamDto.teamId, estado: true },
    });

    if (activePlayers < 8) {
      throw new ConflictException(
        `El equipo debe tener al menos 8 jugadores activos para inscribirse (tiene ${activePlayers})`,
      );
    }

    // Regla de negocio: un equipo solo puede estar en un torneo activo/próximo a la vez
    const activeInscription = await this.tournamentTeamsRepository
      .createQueryBuilder('tt')
      .innerJoin('tt.tournament', 'tournament')
      .where('tt.teamId = :teamId', {
        teamId: createTournamentTeamDto.teamId,
      })
      .andWhere('tournament.fechaFin >= :today', { today: new Date() })
      .getOne();

    if (activeInscription) {
      throw new ConflictException(
        'El equipo ya está inscrito en un torneo activo o próximo. Debe finalizar antes de inscribirse en otro.',
      );
    }

    const tournamentTeam = this.tournamentTeamsRepository.create({
      ...createTournamentTeamDto,
      montoInscripcion: Number(tournament.montoInscripcion),
    });
    const saved = await this.tournamentTeamsRepository.save(tournamentTeam);

    return this.toResponseDto(saved);
  }

  async findAll(): Promise<TournamentTeamResponseDto[]> {
    const tournamentTeams = await this.tournamentTeamsRepository.find({
      order: { created_at: 'DESC' },
    });

    return tournamentTeams.map((tt) => this.toResponseDto(tt));
  }

  async findAllByTournament(
    tournamentId: string,
  ): Promise<TournamentTeamWithRelationsDto[]> {
    const tournamentTeams = await this.tournamentTeamsRepository.find({
      where: { tournamentId },
      relations: ['team', 'tournament', 'payments'],
      order: { created_at: 'ASC' },
    });

    return tournamentTeams.map((tt) => this.toRelationsDto(tt));
  }

  async findAllByTeam(
    teamId: string,
  ): Promise<TournamentTeamWithRelationsDto[]> {
    const tournamentTeams = await this.tournamentTeamsRepository.find({
      where: { teamId },
      relations: ['team', 'tournament', 'payments'],
      order: { created_at: 'DESC' },
    });

    return tournamentTeams.map((tt) => this.toRelationsDto(tt));
  }

  async findOne(id: string): Promise<TournamentTeamWithRelationsDto> {
    const tournamentTeam = await this.tournamentTeamsRepository.findOne({
      where: { id },
      relations: ['team', 'tournament', 'payments'],
    });

    if (!tournamentTeam) {
      throw new NotFoundException('Inscripción no encontrada');
    }

    return this.toRelationsDto(tournamentTeam);
  }

  async update(
    id: string,
    updateTournamentTeamDto: UpdateTournamentTeamDto,
  ): Promise<TournamentTeamResponseDto> {
    const tournamentTeam = await this.tournamentTeamsRepository.findOne({
      where: { id },
    });

    if (!tournamentTeam) {
      throw new NotFoundException('Inscripción no encontrada');
    }

    if (
      updateTournamentTeamDto.tournamentId ||
      updateTournamentTeamDto.teamId
    ) {
      await this.validateTournamentAndTeam(
        updateTournamentTeamDto.tournamentId || tournamentTeam.tournamentId,
        updateTournamentTeamDto.teamId || tournamentTeam.teamId,
      );
    }

    Object.assign(tournamentTeam, updateTournamentTeamDto);
    const saved = await this.tournamentTeamsRepository.save(tournamentTeam);

    return this.toResponseDto(saved);
  }

  async remove(id: string): Promise<void> {
    const tournamentTeam = await this.tournamentTeamsRepository.findOne({
      where: { id },
      relations: ['payments'],
    });

    if (!tournamentTeam) {
      throw new NotFoundException('Inscripción no encontrada');
    }

    if (tournamentTeam.payments && tournamentTeam.payments.length > 0) {
      throw new ConflictException(
        'No se puede eliminar una inscripción con pagos asociados',
      );
    }

    await this.tournamentTeamsRepository.remove(tournamentTeam);
  }

  async getBalance(tournamentTeamId: string): Promise<{
    montoInscripcion: number;
    totalPaid: number;
    balance: number;
  }> {
    const tournamentTeam = await this.tournamentTeamsRepository.findOne({
      where: { id: tournamentTeamId },
      relations: ['payments'],
    });

    if (!tournamentTeam) {
      throw new NotFoundException('Inscripción no encontrada');
    }

    const totalPaid =
      tournamentTeam.payments
        ?.filter((p) => p.aprobado)
        .reduce((sum, p) => sum + Number(p.monto), 0) || 0;

    const balance = Number(tournamentTeam.montoInscripcion) - totalPaid;

    return {
      montoInscripcion: Number(tournamentTeam.montoInscripcion),
      totalPaid,
      balance,
    };
  }

  private async validateTournamentAndTeam(
    tournamentId: string,
    teamId: string,
  ): Promise<void> {
    const tournament = await this.tournamentsRepository.findOne({
      where: { id: tournamentId },
    });

    if (!tournament) {
      throw new NotFoundException('Torneo no encontrado');
    }

    const team = await this.teamsRepository.findOne({
      where: { id: teamId },
    });

    if (!team) {
      throw new NotFoundException('Equipo no encontrado');
    }
  }

  private toResponseDto(tt: TournamentTeam): TournamentTeamResponseDto {
    return {
      id: tt.id,
      tournamentId: tt.tournamentId,
      teamId: tt.teamId,
      montoInscripcion: Number(tt.montoInscripcion),
      created_at: tt.created_at,
      updated_at: tt.updated_at,
    };
  }

  private toRelationsDto(tt: TournamentTeam): TournamentTeamWithRelationsDto {
    const totalPaid =
      tt.payments
        ?.filter((p) => p.aprobado)
        .reduce((sum, p) => sum + Number(p.monto), 0) || 0;

    const totalPending =
      tt.payments
        ?.filter((p) => !p.aprobado && p.status === PaymentStatus.PENDING)
        .reduce((sum, p) => sum + Number(p.monto), 0) || 0;

    return {
      ...this.toResponseDto(tt),
      tournament: tt.tournament
        ? {
            id: tt.tournament.id,
            nombre: tt.tournament.nombre,
          }
        : undefined,
      team: tt.team
        ? {
            id: tt.team.id,
            nombre: tt.team.nombre,
          }
        : undefined,
      paymentsCount: tt.payments?.length || 0,
      totalPaid,
      totalPending,
      balance: Number(tt.montoInscripcion) - totalPaid,
      payments: tt.payments?.map((p) => ({
        id: p.id,
        monto: Number(p.monto),
        fecha: p.fecha,
        metodo: p.metodo,
        referencia: p.referencia,
        imagen: p.imagen,
        aprobado: p.aprobado,
        status: p.status,
        created_at: p.created_at,
        updated_at: p.updated_at,
      })),
    };
  }
}
