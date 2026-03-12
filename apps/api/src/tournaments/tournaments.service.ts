import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tournament } from './entities/tournament.entity';
import {
  CreateTournamentDto,
  UpdateTournamentDto,
  TournamentResponseDto,
  TournamentWithStatsDto,
} from './dto/tournament.dto';

@Injectable()
export class TournamentsService {
  constructor(
    @InjectRepository(Tournament)
    private tournamentsRepository: Repository<Tournament>,
  ) {}

  async create(
    createTournamentDto: CreateTournamentDto,
  ): Promise<TournamentResponseDto> {
    this.validateDates(
      createTournamentDto.fechaInicio,
      createTournamentDto.fechaFin,
    );

    const tournament = this.tournamentsRepository.create(createTournamentDto);
    const savedTournament = await this.tournamentsRepository.save(tournament);

    return this.toResponseDto(savedTournament);
  }

  async findAll(): Promise<TournamentResponseDto[]> {
    const tournaments = await this.tournamentsRepository.find({
      order: { fechaInicio: 'DESC' },
    });

    return tournaments.map((tournament) => this.toResponseDto(tournament));
  }

  async findOne(id: string): Promise<TournamentWithStatsDto> {
    const tournament = await this.tournamentsRepository.findOne({
      where: { id },
      relations: ['matchDays', 'tournamentTeams'],
    });

    if (!tournament) {
      throw new NotFoundException('Torneo no encontrado');
    }

    return {
      ...this.toResponseDto(tournament),
      matchDaysCount: tournament.matchDays?.length || 0,
      teamsCount: tournament.tournamentTeams?.length || 0,
    };
  }

  async update(
    id: string,
    updateTournamentDto: UpdateTournamentDto,
  ): Promise<TournamentResponseDto> {
    const tournament = await this.tournamentsRepository.findOne({
      where: { id },
    });

    if (!tournament) {
      throw new NotFoundException('Torneo no encontrado');
    }

    const fechaInicio =
      updateTournamentDto.fechaInicio || tournament.fechaInicio;
    const fechaFin = updateTournamentDto.fechaFin || tournament.fechaFin;
    this.validateDates(fechaInicio, fechaFin);

    Object.assign(tournament, updateTournamentDto);
    const savedTournament = await this.tournamentsRepository.save(tournament);

    return this.toResponseDto(savedTournament);
  }

  async remove(id: string): Promise<void> {
    const tournament = await this.tournamentsRepository.findOne({
      where: { id },
      relations: ['matchDays', 'tournamentTeams'],
    });

    if (!tournament) {
      throw new NotFoundException('Torneo no encontrado');
    }

    if (tournament.matchDays && tournament.matchDays.length > 0) {
      throw new ConflictException(
        'No se puede eliminar un torneo con jornadas asociadas',
      );
    }

    if (tournament.tournamentTeams && tournament.tournamentTeams.length > 0) {
      throw new ConflictException(
        'No se puede eliminar un torneo con equipos inscritos',
      );
    }

    await this.tournamentsRepository.remove(tournament);
  }

  async findActive(): Promise<TournamentResponseDto[]> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const tournaments = await this.tournamentsRepository
      .createQueryBuilder('tournament')
      .where('tournament.fechaInicio <= :today', { today })
      .andWhere('tournament.fechaFin >= :today', { today })
      .orderBy('tournament.fechaInicio', 'ASC')
      .getMany();

    return tournaments.map((tournament) => this.toResponseDto(tournament));
  }

  async findUpcoming(): Promise<TournamentResponseDto[]> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const tournaments = await this.tournamentsRepository
      .createQueryBuilder('tournament')
      .where('tournament.fechaInicio > :today', { today })
      .orderBy('tournament.fechaInicio', 'ASC')
      .getMany();

    return tournaments.map((tournament) => this.toResponseDto(tournament));
  }

  async findPast(): Promise<TournamentResponseDto[]> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const tournaments = await this.tournamentsRepository
      .createQueryBuilder('tournament')
      .where('tournament.fechaFin < :today', { today })
      .orderBy('tournament.fechaFin', 'DESC')
      .getMany();

    return tournaments.map((tournament) => this.toResponseDto(tournament));
  }

  private validateDates(fechaInicio: Date, fechaFin: Date): void {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);

    if (fin < inicio) {
      throw new BadRequestException(
        'La fecha de fin no puede ser anterior a la fecha de inicio',
      );
    }
  }

  private toResponseDto(tournament: Tournament): TournamentResponseDto {
    return {
      id: tournament.id,
      nombre: tournament.nombre,
      montoInscripcion: Number(tournament.montoInscripcion),
      fechaInicio: tournament.fechaInicio,
      fechaFin: tournament.fechaFin,
      created_at: tournament.created_at,
      updated_at: tournament.updated_at,
    };
  }
}
