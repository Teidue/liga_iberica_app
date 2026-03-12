import {
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
  IsUUID,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePlayerDto {
  @ApiProperty({
    example: 'Juan Pérez García',
    description: 'Nombre completo del jugador',
  })
  @IsString()
  @MinLength(7, { message: 'El nombre debe tener al menos 7 caracteres' })
  @MaxLength(30, { message: 'El nombre no puede superar 30 caracteres' })
  nombre!: string;

  @ApiProperty({
    example: 'V12345678',
    description: 'Documento de identidad (letra + 7 u 8 dígitos)',
  })
  @IsString()
  @Matches(/^[A-Za-z]\d{7,8}$/, {
    message:
      'Formato inválido: debe ser una letra seguida de 7 u 8 dígitos (ej: V1234567)',
  })
  documento!: string;

  @ApiProperty({
    example: 'uuid-del-equipo',
    description: 'ID del equipo al que pertenece',
  })
  @IsUUID()
  teamId!: string;
}

export class UpdatePlayerDto {
  @ApiPropertyOptional({
    example: 'Juan Pérez García',
    description: 'Nombre completo del jugador',
  })
  @IsOptional()
  @IsString()
  @MinLength(7, { message: 'El nombre debe tener al menos 7 caracteres' })
  @MaxLength(30, { message: 'El nombre no puede superar 30 caracteres' })
  nombre?: string;

  @ApiPropertyOptional({
    example: 'V12345678',
    description: 'Documento de identidad (letra + 7 u 8 dígitos)',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z]\d{7,8}$/, {
    message:
      'Formato inválido: debe ser una letra seguida de 7 u 8 dígitos (ej: V1234567)',
  })
  documento?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Estado del jugador (activo/inactivo)',
  })
  @IsOptional()
  @IsBoolean()
  estado?: boolean;
}

export class PlayerResponseDto {
  @ApiProperty({
    example: 'uuid-1234-5678',
    description: 'ID único del jugador',
  })
  id!: string;

  @ApiProperty({
    example: 'Juan Pérez',
    description: 'Nombre completo del jugador',
  })
  nombre!: string;

  @ApiProperty({
    example: 'V12345678',
    description: 'Número de documento de identidad',
  })
  documento!: string;

  @ApiProperty({
    example: true,
    description: 'Estado del jugador',
  })
  estado!: boolean;

  @ApiProperty({
    example: 'uuid-del-equipo',
    description: 'ID del equipo',
  })
  teamId!: string;

  @ApiProperty({
    description: 'Información del equipo',
    required: false,
  })
  team?: {
    id: string;
    nombre: string;
  };
}

export class PlayerWithStatsDto extends PlayerResponseDto {
  @ApiProperty({
    example: 10,
    description: 'Cantidad total de jornadas',
  })
  matchDaysCount!: number;

  @ApiProperty({
    example: 8,
    description: 'Cantidad de jornadas activas',
  })
  activeMatchDaysCount!: number;
}
