import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MatchDay } from './entities/match-day.entity';
import {
  CreateMatchDayDto,
  UpdateMatchDayDto,
  MatchDayResponseDto,
  MatchDayWithRelationsDto,
} from './dto/match-day.dto';
import { Tournament } from '../tournaments/entities/tournament.entity';
import { Club } from '../clubs/entities/club.entity';

@Injectable()
export class MatchDaysService {
  constructor(
    @InjectRepository(MatchDay)
    private matchDaysRepository: Repository<MatchDay>,
    @InjectRepository(Tournament)
    private tournamentsRepository: Repository<Tournament>,
    @InjectRepository(Club)
    private clubsRepository: Repository<Club>,
  ) {}

  async create(
    createMatchDayDto: CreateMatchDayDto,
  ): Promise<MatchDayResponseDto> {
    await this.validateTournamentAndClub(
      createMatchDayDto.tournamentId,
      createMatchDayDto.clubId,
    );

    const matchDay = this.matchDaysRepository.create(createMatchDayDto);
    const savedMatchDay = await this.matchDaysRepository.save(matchDay);

    return this.toResponseDto(savedMatchDay);
  }

  async findAll(): Promise<MatchDayWithRelationsDto[]> {
    const matchDays = await this.matchDaysRepository.find({
      order: { fecha: 'DESC' },
      relations: ['tournament', 'club'],
    });

    return matchDays.map((md) => ({
      ...this.toResponseDto(md),
      tournament: md.tournament
        ? { id: md.tournament.id, nombre: md.tournament.nombre }
        : undefined,
      club: md.club ? { id: md.club.id, nombre: md.club.nombre } : undefined,
      playerMatchDaysCount: 0,
    }));
  }

  async findAllByTournament(
    tournamentId: string,
  ): Promise<MatchDayResponseDto[]> {
    const matchDays = await this.matchDaysRepository.find({
      where: { tournamentId },
      order: { fecha: 'ASC' },
      relations: ['tournament', 'club'],
    });

    return matchDays.map((md) => this.toResponseDto(md));
  }

  async findOne(id: string): Promise<MatchDayWithRelationsDto> {
    const matchDay = await this.matchDaysRepository.findOne({
      where: { id },
      relations: ['tournament', 'club', 'playerMatchDays'],
    });

    if (!matchDay) {
      throw new NotFoundException('Jornada no encontrada');
    }

    return {
      ...this.toResponseDto(matchDay),
      tournament: matchDay.tournament
        ? {
            id: matchDay.tournament.id,
            nombre: matchDay.tournament.nombre,
          }
        : undefined,
      club: matchDay.club
        ? {
            id: matchDay.club.id,
            nombre: matchDay.club.nombre,
            direccion: matchDay.club.direccion ?? null,
            formatoExcel:
              (matchDay.club.formatoExcel as Record<string, unknown> | null) ??
              null,
          }
        : undefined,
      playerMatchDaysCount: matchDay.playerMatchDays?.length || 0,
    };
  }

  async update(
    id: string,
    updateMatchDayDto: UpdateMatchDayDto,
  ): Promise<MatchDayResponseDto> {
    const matchDay = await this.matchDaysRepository.findOne({
      where: { id },
    });

    if (!matchDay) {
      throw new NotFoundException('Jornada no encontrada');
    }

    if (updateMatchDayDto.tournamentId || updateMatchDayDto.clubId) {
      await this.validateTournamentAndClub(
        updateMatchDayDto.tournamentId || matchDay.tournamentId,
        updateMatchDayDto.clubId || matchDay.clubId,
      );
    }

    Object.assign(matchDay, updateMatchDayDto);
    const savedMatchDay = await this.matchDaysRepository.save(matchDay);

    return this.toResponseDto(savedMatchDay);
  }

  async remove(id: string): Promise<void> {
    const matchDay = await this.matchDaysRepository.findOne({
      where: { id },
      relations: ['playerMatchDays'],
    });

    if (!matchDay) {
      throw new NotFoundException('Jornada no encontrada');
    }

    if (matchDay.playerMatchDays && matchDay.playerMatchDays.length > 0) {
      throw new ConflictException(
        'No se puede eliminar una jornada con asistencias registradas',
      );
    }

    await this.matchDaysRepository.remove(matchDay);
  }

  async findUpcoming(
    limit: number = 20,
    tournamentIds?: string[],
  ): Promise<MatchDayWithRelationsDto[]> {
    // Only show upcoming match days — attendance must be submitted before the match.
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const query = this.matchDaysRepository
      .createQueryBuilder('matchDay')
      .where('matchDay.fecha >= :startOfToday', { startOfToday })
      .leftJoinAndSelect('matchDay.tournament', 'tournament')
      .leftJoinAndSelect('matchDay.club', 'club')
      .orderBy('matchDay.fecha', 'ASC')
      .take(limit);

    if (tournamentIds && tournamentIds.length > 0) {
      query.andWhere('matchDay.tournamentId IN (:...tournamentIds)', {
        tournamentIds,
      });
    }

    const matchDays = await query.getMany();

    return matchDays.map((md) => ({
      ...this.toResponseDto(md),
      tournament: md.tournament
        ? { id: md.tournament.id, nombre: md.tournament.nombre }
        : undefined,
      club: md.club ? { id: md.club.id, nombre: md.club.nombre } : undefined,
      playerMatchDaysCount: 0,
    }));
  }

  private async validateTournamentAndClub(
    tournamentId: string,
    clubId: string,
  ): Promise<void> {
    const tournament = await this.tournamentsRepository.findOne({
      where: { id: tournamentId },
    });

    if (!tournament) {
      throw new NotFoundException('Torneo no encontrado');
    }

    const club = await this.clubsRepository.findOne({
      where: { id: clubId },
    });

    if (!club) {
      throw new NotFoundException('Sede no encontrada');
    }
  }

  private toResponseDto(matchDay: MatchDay): MatchDayResponseDto {
    return {
      id: matchDay.id,
      fecha: matchDay.fecha,
      tournamentId: matchDay.tournamentId,
      clubId: matchDay.clubId,
      cerrado: matchDay.cerrado ?? false,
      created_at: matchDay.created_at,
      updated_at: matchDay.updated_at,
    };
  }
}
