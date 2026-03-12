import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, IsNull, Repository } from 'typeorm';
import { Club } from './entities/club.entity';
import {
  CreateClubDto,
  UpdateClubDto,
  ClubResponseDto,
  ClubWithStatsDto,
} from './dto/club.dto';

@Injectable()
export class ClubsService {
  constructor(
    @InjectRepository(Club)
    private clubsRepository: Repository<Club>,
  ) {}

  async create(createClubDto: CreateClubDto): Promise<ClubResponseDto> {
    // Verificar si ya existe un club con el mismo nombre
    const existingClub = await this.clubsRepository.findOne({
      where: { nombre: createClubDto.nombre },
    });

    if (existingClub) {
      throw new ConflictException('Ya existe una sede con ese nombre');
    }

    const club = this.clubsRepository.create(createClubDto);
    const savedClub = await this.clubsRepository.save(club);

    return this.findOneResponse(savedClub.id);
  }

  async findAll(): Promise<ClubResponseDto[]> {
    const clubs = await this.clubsRepository.find({
      order: { nombre: 'ASC' },
    });

    return clubs.map((club) => ({
      id: club.id,
      nombre: club.nombre,
      direccion: club.direccion,
      formatoExcel: club.formatoExcel,
    }));
  }

  async findOne(id: string): Promise<ClubWithStatsDto> {
    const club = await this.clubsRepository.findOne({
      where: { id },
      relations: ['matchDays'],
    });

    if (!club) {
      throw new NotFoundException('Sede no encontrada');
    }

    // Calcular estadísticas
    const matchDaysCount = club.matchDays.length;
    const now = new Date();
    const upcomingMatchDaysCount = club.matchDays.filter(
      (md) => md.fecha > now,
    ).length;

    return {
      id: club.id,
      nombre: club.nombre,
      direccion: club.direccion,
      formatoExcel: club.formatoExcel,
      matchDaysCount,
      upcomingMatchDaysCount,
    };
  }

  async findOneResponse(id: string): Promise<ClubResponseDto> {
    const club = await this.clubsRepository.findOne({
      where: { id },
    });

    if (!club) {
      throw new NotFoundException('Sede no encontrada');
    }

    return {
      id: club.id,
      nombre: club.nombre,
      direccion: club.direccion,
      formatoExcel: club.formatoExcel,
    };
  }

  async update(
    id: string,
    updateClubDto: UpdateClubDto,
  ): Promise<ClubResponseDto> {
    const club = await this.clubsRepository.findOne({
      where: { id },
    });

    if (!club) {
      throw new NotFoundException('Sede no encontrada');
    }

    // Si se actualiza el nombre, verificar que no exista otro club con ese nombre
    if (updateClubDto.nombre && updateClubDto.nombre !== club.nombre) {
      const existingClub = await this.clubsRepository.findOne({
        where: { nombre: updateClubDto.nombre },
      });

      if (existingClub) {
        throw new ConflictException('Ya existe una sede con ese nombre');
      }
    }

    // Validar que el formato Excel sea un JSON válido si se proporciona
    if (updateClubDto.formatoExcel !== undefined) {
      // Se podría agregar validación más específica aquí según los requerimientos
      if (updateClubDto.formatoExcel !== null) {
        // Validar estructura básica del JSON
        this.validateExcelFormat(updateClubDto.formatoExcel);
      }
    }

    Object.assign(club, updateClubDto);
    const savedClub = await this.clubsRepository.save(club);

    return this.findOneResponse(savedClub.id);
  }

  async remove(id: string): Promise<void> {
    const club = await this.clubsRepository.findOne({
      where: { id },
      relations: ['matchDays'],
    });

    if (!club) {
      throw new NotFoundException('Sede no encontrada');
    }

    // Verificar si el club tiene jornadas asociadas
    if (club.matchDays.length > 0) {
      throw new ConflictException(
        'No se puede eliminar una sede con jornadas asociadas',
      );
    }

    await this.clubsRepository.remove(club);
  }

  async findByExcelFormat(): Promise<ClubResponseDto[]> {
    // Retornar sedes que tienen configurado el formato Excel
    const clubs = await this.clubsRepository.find({
      where: { formatoExcel: Not(IsNull()) },
      order: { nombre: 'ASC' },
    });

    return clubs.map((club) => ({
      id: club.id,
      nombre: club.nombre,
      direccion: club.direccion,
      formatoExcel: club.formatoExcel,
    }));
  }

  validateExcelFormat(format: unknown): boolean {
    if (typeof format !== 'object' || format === null) {
      throw new ConflictException('El formato Excel debe ser un objeto válido');
    }
    const record = format as Record<string, unknown>;
    const columns = record['columns'];

    if (!Array.isArray(columns)) {
      throw new ConflictException(
        'El formato Excel debe incluir un array de columnas',
      );
    }

    if (columns.length === 0) {
      throw new ConflictException(
        'El formato Excel debe incluir al menos una columna',
      );
    }

    // Validar cada columna
    for (const column of columns) {
      if (
        typeof column !== 'object' ||
        column === null ||
        !('name' in column) ||
        !('header' in column)
      ) {
        throw new ConflictException('Cada columna debe tener name y header');
      }
    }

    return true;
  }

  // Método para obtener el formato por defecto si un club no tiene uno configurado
  getDefaultExcelFormat(): object {
    return {
      sheetName: 'Lista de Jugadores',
      title: 'Lista de Jugadores e Invitados',
      columns: [
        { name: 'nombre', header: 'Nombre', width: 30, type: 'string' },
        { name: 'documento', header: 'Documento', width: 20, type: 'string' },
        {
          name: 'esInvitado',
          header: 'Es Invitado',
          width: 15,
          type: 'string',
        },
        {
          name: 'nombreInvitante',
          header: 'Jugador Invitante',
          width: 30,
          type: 'string',
        },
      ],
      headers: ['Nombre', 'Documento', 'Es Invitado', 'Jugador Invitante'],
    };
  }
}
