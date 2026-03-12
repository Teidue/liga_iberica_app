import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import {
  CreatePaymentDto,
  UpdatePaymentDto,
  PaymentResponseDto,
  PaymentWithRelationsDto,
} from './dto/payment.dto';
import { TournamentTeam } from '../tournament-teams/entities/tournament-team.entity';
import { PaymentStatus } from '../common/enums';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
    @InjectRepository(TournamentTeam)
    private tournamentTeamsRepository: Repository<TournamentTeam>,
  ) {}

  async create(
    createPaymentDto: CreatePaymentDto,
  ): Promise<PaymentResponseDto> {
    await this.validateTournamentTeam(createPaymentDto.tournamentTeamId);

    const payment = this.paymentsRepository.create({
      ...createPaymentDto,
      fecha: createPaymentDto.fecha
        ? new Date(createPaymentDto.fecha)
        : new Date(),
      aprobado: false,
      status: PaymentStatus.PENDING,
    });
    const saved = await this.paymentsRepository.save(payment);

    return this.toResponseDto(saved);
  }

  async findAll(): Promise<PaymentResponseDto[]> {
    const payments = await this.paymentsRepository.find({
      order: { fecha: 'DESC' },
    });

    return payments.map((p) => this.toResponseDto(p));
  }

  async findAllByTournamentTeam(
    tournamentTeamId: string,
  ): Promise<PaymentWithRelationsDto[]> {
    const payments = await this.paymentsRepository.find({
      where: { tournamentTeamId },
      relations: [
        'tournamentTeam',
        'tournamentTeam.tournament',
        'tournamentTeam.team',
      ],
      order: { fecha: 'DESC' },
    });

    return payments.map((p) => this.toRelationsDto(p));
  }

  async findPending(): Promise<PaymentWithRelationsDto[]> {
    const payments = await this.paymentsRepository.find({
      where: { status: PaymentStatus.PENDING },
      relations: [
        'tournamentTeam',
        'tournamentTeam.tournament',
        'tournamentTeam.team',
      ],
      order: { fecha: 'DESC' },
    });

    return payments.map((p) => this.toRelationsDto(p));
  }

  async findRejected(): Promise<PaymentWithRelationsDto[]> {
    const payments = await this.paymentsRepository.find({
      where: { status: PaymentStatus.REJECTED },
      relations: [
        'tournamentTeam',
        'tournamentTeam.tournament',
        'tournamentTeam.team',
      ],
      order: { fecha: 'DESC' },
    });

    return payments.map((p) => this.toRelationsDto(p));
  }

  async findApproved(): Promise<PaymentWithRelationsDto[]> {
    const payments = await this.paymentsRepository.find({
      where: { status: PaymentStatus.APPROVED },
      relations: [
        'tournamentTeam',
        'tournamentTeam.tournament',
        'tournamentTeam.team',
      ],
      order: { fecha: 'DESC' },
    });

    return payments.map((p) => this.toRelationsDto(p));
  }

  async findOne(id: string): Promise<PaymentWithRelationsDto> {
    const payment = await this.paymentsRepository.findOne({
      where: { id },
      relations: [
        'tournamentTeam',
        'tournamentTeam.tournament',
        'tournamentTeam.team',
      ],
    });

    if (!payment) {
      throw new NotFoundException('Pago no encontrado');
    }

    return this.toRelationsDto(payment);
  }

  async approve(id: string): Promise<PaymentResponseDto> {
    const payment = await this.paymentsRepository.findOne({
      where: { id },
    });

    if (!payment) {
      throw new NotFoundException('Pago no encontrado');
    }

    if (payment.aprobado) {
      throw new ConflictException('El pago ya está aprobado');
    }

    payment.aprobado = true;
    payment.status = PaymentStatus.APPROVED;
    const saved = await this.paymentsRepository.save(payment);

    return this.toResponseDto(saved);
  }

  async reject(id: string): Promise<PaymentResponseDto> {
    const payment = await this.paymentsRepository.findOne({
      where: { id },
    });

    if (!payment) {
      throw new NotFoundException('Pago no encontrado');
    }

    payment.aprobado = false;
    payment.status = PaymentStatus.REJECTED;
    const saved = await this.paymentsRepository.save(payment);

    return this.toResponseDto(saved);
  }

  async update(
    id: string,
    updatePaymentDto: UpdatePaymentDto,
  ): Promise<PaymentResponseDto> {
    const payment = await this.paymentsRepository.findOne({
      where: { id },
    });

    if (!payment) {
      throw new NotFoundException('Pago no encontrado');
    }

    if (updatePaymentDto.tournamentTeamId) {
      await this.validateTournamentTeam(updatePaymentDto.tournamentTeamId);
    }

    Object.assign(payment, updatePaymentDto);
    const saved = await this.paymentsRepository.save(payment);

    return this.toResponseDto(saved);
  }

  async remove(id: string): Promise<void> {
    const payment = await this.paymentsRepository.findOne({
      where: { id },
    });

    if (!payment) {
      throw new NotFoundException('Pago no encontrado');
    }

    if (payment.aprobado) {
      throw new ConflictException('No se puede eliminar un pago aprobado');
    }

    await this.paymentsRepository.remove(payment);
  }

  private async validateTournamentTeam(
    tournamentTeamId: string,
  ): Promise<void> {
    const tournamentTeam = await this.tournamentTeamsRepository.findOne({
      where: { id: tournamentTeamId },
    });

    if (!tournamentTeam) {
      throw new NotFoundException('Inscripción no encontrada');
    }
  }

  private toResponseDto(p: Payment): PaymentResponseDto {
    return {
      id: p.id,
      tournamentTeamId: p.tournamentTeamId,
      monto: Number(p.monto),
      fecha: p.fecha,
      metodo: p.metodo,
      referencia: p.referencia,
      imagen: p.imagen,
      aprobado: p.aprobado,
      status: p.status,
      created_at: p.created_at,
      updated_at: p.updated_at,
    };
  }

  private toRelationsDto(p: Payment): PaymentWithRelationsDto {
    const tt = p.tournamentTeam;
    return {
      ...this.toResponseDto(p),
      tournamentTeam: tt
        ? {
            id: tt.id,
            montoInscripcion: Number(tt.montoInscripcion),
            tournament: tt.tournament
              ? {
                  id: tt.tournament.id,
                  nombre: tt.tournament.nombre,
                }
              : { id: '', nombre: '' },
            team: tt.team
              ? {
                  id: tt.team.id,
                  nombre: tt.team.nombre,
                }
              : { id: '', nombre: '' },
          }
        : undefined,
    };
  }
}
