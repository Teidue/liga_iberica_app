import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GuestPerson } from './entities/guest-person.entity';
import {
  CreateGuestPersonDto,
  UpdateGuestPersonDto,
  GuestPersonResponseDto,
  GuestPersonWithStatsDto,
} from './dto/guest-person.dto';

@Injectable()
export class GuestPeopleService {
  constructor(
    @InjectRepository(GuestPerson)
    private guestPeopleRepository: Repository<GuestPerson>,
  ) {}

  async create(
    createGuestPersonDto: CreateGuestPersonDto,
  ): Promise<GuestPersonResponseDto> {
    const existing = await this.guestPeopleRepository.findOne({
      where: { documento: createGuestPersonDto.documento },
    });

    if (existing) {
      return this.toResponseDto(existing);
    }

    const guestPerson = this.guestPeopleRepository.create(createGuestPersonDto);
    const saved = await this.guestPeopleRepository.save(guestPerson);

    return this.toResponseDto(saved);
  }

  async findAll(): Promise<GuestPersonResponseDto[]> {
    const guestPeople = await this.guestPeopleRepository.find({
      order: { nombre: 'ASC' },
    });

    return guestPeople.map((g) => this.toResponseDto(g));
  }

  async findByDocumento(
    documento: string,
  ): Promise<GuestPersonResponseDto | null> {
    const guestPerson = await this.guestPeopleRepository.findOne({
      where: { documento },
    });

    if (!guestPerson) {
      return null;
    }

    return this.toResponseDto(guestPerson);
  }

  async findOne(id: string): Promise<GuestPersonWithStatsDto> {
    const guestPerson = await this.guestPeopleRepository.findOne({
      where: { id },
      relations: ['playerMatchDays'],
    });

    if (!guestPerson) {
      throw new NotFoundException('Invitado no encontrado');
    }

    return {
      ...this.toResponseDto(guestPerson),
      playerMatchDaysCount: guestPerson.playerMatchDays?.length || 0,
    };
  }

  async update(
    id: string,
    updateGuestPersonDto: UpdateGuestPersonDto,
  ): Promise<GuestPersonResponseDto> {
    const guestPerson = await this.guestPeopleRepository.findOne({
      where: { id },
    });

    if (!guestPerson) {
      throw new NotFoundException('Invitado no encontrado');
    }

    if (
      updateGuestPersonDto.documento &&
      updateGuestPersonDto.documento !== guestPerson.documento
    ) {
      const existing = await this.guestPeopleRepository.findOne({
        where: { documento: updateGuestPersonDto.documento },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException('Ya existe un invitado con ese documento');
      }
    }

    Object.assign(guestPerson, updateGuestPersonDto);
    const saved = await this.guestPeopleRepository.save(guestPerson);

    return this.toResponseDto(saved);
  }

  async remove(id: string): Promise<void> {
    const guestPerson = await this.guestPeopleRepository.findOne({
      where: { id },
      relations: ['playerMatchDays'],
    });

    if (!guestPerson) {
      throw new NotFoundException('Invitado no encontrado');
    }

    if (guestPerson.playerMatchDays && guestPerson.playerMatchDays.length > 0) {
      throw new ConflictException(
        'No se puede eliminar un invitado con asistencia registrada',
      );
    }

    await this.guestPeopleRepository.remove(guestPerson);
  }

  async search(query: string): Promise<GuestPersonResponseDto[]> {
    const guestPeople = await this.guestPeopleRepository
      .createQueryBuilder('guest')
      .where('guest.nombre ILIKE :query', { query: `%${query}%` })
      .orWhere('guest.documento ILIKE :query', { query: `%${query}%` })
      .orderBy('guest.nombre', 'ASC')
      .take(20)
      .getMany();

    return guestPeople.map((g) => this.toResponseDto(g));
  }

  private toResponseDto(g: GuestPerson): GuestPersonResponseDto {
    return {
      id: g.id,
      nombre: g.nombre,
      documento: g.documento,
      notas: g.notas,
      created_at: g.created_at,
      updated_at: g.updated_at,
    };
  }
}
