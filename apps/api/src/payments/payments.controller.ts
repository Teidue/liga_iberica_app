import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import {
  CreatePaymentDto,
  UpdatePaymentDto,
  PaymentResponseDto,
  PaymentWithRelationsDto,
} from './dto/payment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { UserRole } from '../common/enums';

@ApiTags('payments')
@ApiBearerAuth()
@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar un nuevo pago' })
  @ApiResponse({
    status: 201,
    description: 'Pago registrado',
    type: PaymentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 404, description: 'Inscripción no encontrada' })
  create(
    @Request() req: { user: { role: UserRole } },
    @Body() createPaymentDto: CreatePaymentDto,
  ): Promise<PaymentResponseDto> {
    if (req.user.role !== UserRole.TEAM_ADMIN) {
      throw new ForbiddenException('No autorizado');
    }

    return this.paymentsService.create(createPaymentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los pagos' })
  @ApiQuery({ name: 'tournamentTeamId', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Lista de pagos',
    type: [PaymentResponseDto],
  })
  findAll(
    @Request() req: { user: { role: UserRole } },
    @Query('tournamentTeamId') tournamentTeamId?: string,
  ): Promise<PaymentResponseDto[] | PaymentWithRelationsDto[]> {
    if (req.user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('No autorizado');
    }

    if (tournamentTeamId) {
      return this.paymentsService.findAllByTournamentTeam(tournamentTeamId);
    }

    return this.paymentsService.findAll();
  }

  @Get('pending')
  @ApiOperation({ summary: 'Obtener pagos pendientes' })
  @ApiResponse({
    status: 200,
    description: 'Lista de pagos pendientes',
    type: [PaymentWithRelationsDto],
  })
  findPending(
    @Request() req: { user: { role: UserRole } },
  ): Promise<PaymentWithRelationsDto[]> {
    if (req.user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('No autorizado');
    }

    return this.paymentsService.findPending();
  }

  @Get('rejected')
  @ApiOperation({ summary: 'Obtener pagos rechazados' })
  @ApiResponse({
    status: 200,
    description: 'Lista de pagos rechazados',
    type: [PaymentWithRelationsDto],
  })
  findRejected(
    @Request() req: { user: { role: UserRole } },
  ): Promise<PaymentWithRelationsDto[]> {
    if (req.user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('No autorizado');
    }

    return this.paymentsService.findRejected();
  }

  @Get('approved')
  @ApiOperation({ summary: 'Obtener pagos aprobados' })
  @ApiResponse({
    status: 200,
    description: 'Lista de pagos aprobados',
    type: [PaymentWithRelationsDto],
  })
  findApproved(
    @Request() req: { user: { role: UserRole } },
  ): Promise<PaymentWithRelationsDto[]> {
    if (req.user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('No autorizado');
    }

    return this.paymentsService.findApproved();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un pago por ID' })
  @ApiResponse({
    status: 200,
    description: 'Pago encontrado',
    type: PaymentWithRelationsDto,
  })
  @ApiResponse({ status: 404, description: 'Pago no encontrado' })
  findOne(@Param('id') id: string): Promise<PaymentWithRelationsDto> {
    return this.paymentsService.findOne(id);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Aprobar un pago' })
  @ApiResponse({
    status: 200,
    description: 'Pago aprobado',
    type: PaymentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Pago no encontrado' })
  @ApiResponse({ status: 409, description: 'Pago ya aprobado' })
  approve(
    @Param('id') id: string,
    @Request() req: { user: { role: UserRole } },
  ): Promise<PaymentResponseDto> {
    if (req.user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('No autorizado');
    }

    return this.paymentsService.approve(id);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Rechazar un pago' })
  @ApiResponse({
    status: 200,
    description: 'Pago rechazado',
    type: PaymentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Pago no encontrado' })
  reject(
    @Param('id') id: string,
    @Request() req: { user: { role: UserRole } },
  ): Promise<PaymentResponseDto> {
    if (req.user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('No autorizado');
    }

    return this.paymentsService.reject(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un pago' })
  @ApiResponse({
    status: 200,
    description: 'Pago actualizado',
    type: PaymentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Pago no encontrado' })
  update(
    @Param('id') id: string,
    @Request() req: { user: { role: UserRole } },
    @Body() updatePaymentDto: UpdatePaymentDto,
  ): Promise<PaymentResponseDto> {
    if (req.user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('No autorizado');
    }

    return this.paymentsService.update(id, updatePaymentDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un pago' })
  @ApiResponse({ status: 204, description: 'Pago eliminado' })
  @ApiResponse({ status: 404, description: 'Pago no encontrado' })
  @ApiResponse({
    status: 409,
    description: 'No se puede eliminar pago aprobado',
  })
  remove(
    @Param('id') id: string,
    @Request() req: { user: { role: UserRole } },
  ): Promise<void> {
    if (req.user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('No autorizado');
    }

    return this.paymentsService.remove(id);
  }
}
