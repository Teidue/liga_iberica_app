import { IsOptional, IsUUID, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTournamentTeamDto {
  @ApiProperty({
    example: 'uuid-del-torneo',
    description: 'ID del torneo',
  })
  @IsUUID()
  tournamentId!: string;

  @ApiProperty({
    example: 'uuid-del-equipo',
    description: 'ID del equipo',
  })
  @IsUUID()
  teamId!: string;
}

export class UpdateTournamentTeamDto {
  @ApiPropertyOptional({
    example: 'uuid-del-torneo',
    description: 'ID del torneo',
  })
  @IsOptional()
  @IsUUID()
  tournamentId?: string;

  @ApiPropertyOptional({
    example: 'uuid-del-equipo',
    description: 'ID del equipo',
  })
  @IsOptional()
  @IsUUID()
  teamId?: string;

  @ApiPropertyOptional({
    example: 500.0,
    description: 'Monto de inscripción',
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  montoInscripcion?: number;
}

export class TournamentTeamResponseDto {
  @ApiProperty({
    example: 'uuid-1234-5678',
    description: 'ID único de la inscripción',
  })
  id!: string;

  @ApiProperty({
    example: 'uuid-del-torneo',
    description: 'ID del torneo',
  })
  tournamentId!: string;

  @ApiProperty({
    example: 'uuid-del-equipo',
    description: 'ID del equipo',
  })
  teamId!: string;

  @ApiProperty({
    example: 500.0,
    description: 'Monto de inscripción',
  })
  montoInscripcion!: number;

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

export class TournamentTeamWithRelationsDto extends TournamentTeamResponseDto {
  @ApiPropertyOptional({
    description: 'Información del torneo',
  })
  tournament?: {
    id: string;
    nombre: string;
  };

  @ApiPropertyOptional({
    description: 'Información del equipo',
  })
  team?: {
    id: string;
    nombre: string;
  };

  @ApiProperty({
    example: 3,
    description: 'Cantidad de pagos realizados',
  })
  paymentsCount!: number;

  @ApiProperty({
    example: 300.0,
    description: 'Total aprobado',
  })
  totalPaid!: number;

  @ApiProperty({
    example: 50.0,
    description: 'Total en pagos pendientes de aprobación',
  })
  totalPending!: number;

  @ApiProperty({
    example: 200.0,
    description: 'Saldo pendiente',
  })
  balance!: number;

  @ApiPropertyOptional({ description: 'Lista de pagos de la inscripción' })
  payments?: {
    id: string;
    monto: number;
    fecha: Date;
    metodo: string;
    referencia: string | null;
    imagen: string | null;
    aprobado: boolean;
    status: string;
    created_at: Date;
    updated_at: Date;
  }[];
}
