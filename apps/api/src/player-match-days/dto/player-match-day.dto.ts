import { IsOptional, IsUUID, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePlayerMatchDayDto {
  @ApiProperty({
    example: 'uuid-del-jugador',
    description: 'ID del jugador',
  })
  @IsUUID()
  playerId!: string;

  @ApiProperty({
    example: 'uuid-de-la-jornada',
    description: 'ID de la jornada',
  })
  @IsUUID()
  matchDayId!: string;

  @ApiProperty({
    example: true,
    description: '¿El jugador asistirá? true = sí, false = no',
  })
  @IsBoolean()
  va!: boolean;

  @ApiPropertyOptional({
    example: 'uuid-del-invitado',
    description: 'ID del invitado (si va como invitado)',
  })
  @IsOptional()
  @IsUUID()
  guestId?: string | null;
}

export class UpdatePlayerMatchDayDto {
  @ApiPropertyOptional({
    example: 'uuid-del-jugador',
    description: 'ID del jugador',
  })
  @IsOptional()
  @IsUUID()
  playerId?: string;

  @ApiPropertyOptional({
    example: 'uuid-de-la-jornada',
    description: 'ID de la jornada',
  })
  @IsOptional()
  @IsUUID()
  matchDayId?: string;

  @ApiPropertyOptional({
    example: true,
    description: '¿Asistió?',
  })
  @IsOptional()
  @IsBoolean()
  va?: boolean;

  @ApiPropertyOptional({
    example: 'uuid-del-invitado',
    description: 'ID del invitado',
  })
  @IsOptional()
  @IsUUID()
  guestId?: string | null;
}

export class PlayerMatchDayResponseDto {
  @ApiProperty({
    example: 'uuid-1234-5678',
    description: 'ID único del registro',
  })
  id!: string;

  @ApiProperty({
    example: 'uuid-del-jugador',
    description: 'ID del jugador',
  })
  playerId!: string;

  @ApiProperty({
    example: 'uuid-de-la-jornada',
    description: 'ID de la jornada',
  })
  matchDayId!: string;

  @ApiProperty({
    example: true,
    description: '¿Asistió?',
  })
  va!: boolean;

  @ApiPropertyOptional({
    example: 'uuid-del-invitado',
    description: 'ID del invitado',
  })
  guestId?: string | null;

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

export class PlayerMatchDayWithRelationsDto extends PlayerMatchDayResponseDto {
  @ApiPropertyOptional({
    description: 'Información del jugador',
  })
  player?: {
    id: string;
    nombre: string;
    documento: string;
    teamId: string;
  };

  @ApiPropertyOptional({
    description: 'Información de la jornada',
  })
  matchDay?: {
    id: string;
    fecha: Date;
  };

  @ApiPropertyOptional({
    description: 'Información del invitado',
  })
  guest?: {
    id: string;
    nombre: string;
    documento: string;
  } | null;
}
