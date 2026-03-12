import {
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  IsEnum,
  IsBoolean,
  IsDateString,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod, PaymentStatus } from '../../common/enums';

export class CreatePaymentDto {
  @ApiProperty({
    example: 'uuid-del-equipo-inscrito',
    description: 'ID del equipo inscripito al torneo',
  })
  @IsUUID()
  tournamentTeamId!: string;

  @ApiProperty({
    example: 150.0,
    description: 'Monto del pago',
  })
  @IsNumber()
  @Type(() => Number)
  monto!: number;

  @ApiPropertyOptional({
    example: '2026-03-09',
    description:
      'Fecha en que se realizó el pago (ISO 8601). Si no se envía se usa la fecha actual.',
  })
  @IsOptional()
  @IsDateString()
  fecha?: string;

  @ApiProperty({
    example: 'TRANSFERENCIA',
    enum: PaymentMethod,
    description: 'Método de pago',
  })
  @IsEnum(PaymentMethod)
  metodo!: PaymentMethod;

  @ApiPropertyOptional({
    example: ' Transferencia #12345',
    description: 'Número de referencia del pago',
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  referencia?: string | null;

  @ApiPropertyOptional({
    example: 'https://storage.com/pago.jpg',
    description: 'URL de la imagen del comprobante',
  })
  @IsOptional()
  @IsString()
  imagen?: string | null;

  @ApiPropertyOptional({
    example: false,
    description: 'Estado de aprobación del pago',
  })
  @IsOptional()
  @IsBoolean()
  aprobado?: boolean;
}

export class UpdatePaymentDto {
  @ApiPropertyOptional({
    example: 'uuid-del-equipo-inscrito',
    description: 'ID del equipo inscripito al torneo',
  })
  @IsOptional()
  @IsUUID()
  tournamentTeamId?: string;

  @ApiPropertyOptional({
    example: 150.0,
    description: 'Monto del pago',
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  monto?: number;

  @ApiPropertyOptional({
    example: 'TRANSFERENCIA',
    enum: PaymentMethod,
    description: 'Método de pago',
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  metodo?: PaymentMethod;

  @ApiPropertyOptional({
    example: ' Transferencia #12345',
    description: 'Número de referencia',
  })
  @IsOptional()
  @IsString()
  referencia?: string | null;

  @ApiPropertyOptional({
    example: 'https://storage.com/pago.jpg',
    description: 'URL de la imagen',
  })
  @IsOptional()
  @IsString()
  imagen?: string | null;

  @ApiPropertyOptional({
    example: true,
    description: 'Estado de aprobación',
  })
  @IsOptional()
  @IsBoolean()
  aprobado?: boolean;
}

export class PaymentResponseDto {
  @ApiProperty({
    example: 'uuid-1234-5678',
    description: 'ID único del pago',
  })
  id!: string;

  @ApiProperty({
    example: 'uuid-del-equipo-inscrito',
    description: 'ID del equipo inscripito',
  })
  tournamentTeamId!: string;

  @ApiProperty({
    example: 150.0,
    description: 'Monto del pago',
  })
  monto!: number;

  @ApiProperty({
    example: '2026-03-15T18:00:00Z',
    description: 'Fecha del pago',
  })
  fecha!: Date;

  @ApiProperty({
    example: 'TRANSFERENCIA',
    enum: PaymentMethod,
    description: 'Método de pago',
  })
  metodo!: PaymentMethod;

  @ApiPropertyOptional({
    example: ' Transferencia #12345',
    description: 'Referencia del pago',
  })
  referencia?: string | null;

  @ApiPropertyOptional({
    example: 'https://storage.com/pago.jpg',
    description: 'Imagen del comprobante',
  })
  imagen?: string | null;

  @ApiProperty({
    example: false,
    description: '¿El pago está aprobado?',
  })
  aprobado!: boolean;

  @ApiProperty({
    example: 'pending',
    enum: PaymentStatus,
    description: 'Estado del pago',
  })
  status!: PaymentStatus;

  @ApiProperty({
    example: '2026-01-15T10:00:00Z',
    description: 'Fecha de creación',
  })
  created_at!: Date;

  @ApiProperty({
    example: '2026-01-15T10:00:00Z',
    description: 'Fecha de actualización',
  })
  updated_at!: Date;
}

export class PaymentWithRelationsDto extends PaymentResponseDto {
  @ApiPropertyOptional({
    description: 'Información del equipo inscrito',
  })
  tournamentTeam?: {
    id: string;
    montoInscripcion: number;
    tournament: {
      id: string;
      nombre: string;
    };
    team: {
      id: string;
      nombre: string;
    };
  };
}
