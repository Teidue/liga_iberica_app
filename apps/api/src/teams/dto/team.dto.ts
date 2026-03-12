import {
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
  IsUUID,
  IsArray,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PlayerInlineDto {
  @ApiProperty({
    example: 'Juan Pérez García',
    description: 'Nombre del jugador',
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
}

export class CreateTeamDto {
  @ApiProperty({
    example: 'Real Madrid Futsal',
    description: 'Nombre del equipo',
  })
  @IsString()
  @MinLength(2)
  nombre!: string;

  @ApiPropertyOptional({
    example: 'uuid-del-admin',
    description: 'ID del usuario administrador del equipo',
  })
  @IsOptional()
  @IsUUID()
  adminId?: string | null;

  @ApiProperty({
    description: 'Lista de jugadores (mínimo 8)',
    type: [PlayerInlineDto],
  })
  @IsArray()
  @ArrayMinSize(8, { message: 'El equipo debe tener al menos 8 jugadores' })
  @ValidateNested({ each: true })
  @Type(() => PlayerInlineDto)
  players!: PlayerInlineDto[];
}

export class UpdateTeamDto {
  @ApiPropertyOptional({
    example: 'Real Madrid Futsal',
    description: 'Nombre del equipo',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  nombre?: string;

  @ApiPropertyOptional({
    example: 'uuid-del-admin',
    description: 'ID del usuario administrador del equipo',
  })
  @IsOptional()
  @IsUUID()
  adminId?: string | null;
}

export class TeamResponseDto {
  @ApiProperty({
    example: 'uuid-1234-5678',
    description: 'ID único del equipo',
  })
  id!: string;

  @ApiProperty({
    example: 'Real Madrid Futsal',
    description: 'Nombre del equipo',
  })
  nombre!: string;

  @ApiPropertyOptional({
    example: 'uuid-del-admin',
    description: 'ID del administrador del equipo',
  })
  adminId?: string | null;

  @ApiPropertyOptional({
    description: 'Información del administrador',
  })
  admin?: {
    id: string;
    nombre: string;
    email: string;
  } | null;
}

export class TeamWithPlayersDto extends TeamResponseDto {
  @ApiProperty({
    example: 12,
    description: 'Cantidad de jugadores activos',
  })
  playersCount!: number;
}
