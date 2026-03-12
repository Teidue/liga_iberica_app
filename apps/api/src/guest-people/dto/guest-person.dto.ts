import { IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateGuestPersonDto {
  @ApiProperty({
    example: 'Carlos García',
    description: 'Nombre completo del invitado',
  })
  @IsString()
  @MinLength(2)
  nombre!: string;

  @ApiProperty({
    example: 'E12345678',
    description: 'Número de documento de identidad',
  })
  @IsString()
  @MinLength(5)
  documento!: string;
}

export class UpdateGuestPersonDto {
  @ApiPropertyOptional({
    example: 'Carlos García',
    description: 'Nombre completo del invitado',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  nombre?: string;

  @ApiPropertyOptional({
    example: 'E12345678',
    description: 'Número de documento',
  })
  @IsOptional()
  @IsString()
  @MinLength(5)
  documento?: string;

  @ApiPropertyOptional({
    example: 'Invitado por el equipo local',
    description: 'Notas adicionales sobre el invitado',
  })
  @IsOptional()
  @IsString()
  notas?: string;
}

export class GuestPersonResponseDto {
  @ApiProperty({
    example: 'uuid-1234-5678',
    description: 'ID único del invitado',
  })
  id!: string;

  @ApiProperty({
    example: 'Carlos García',
    description: 'Nombre del invitado',
  })
  nombre!: string;

  @ApiProperty({
    example: 'E12345678',
    description: 'Documento de identidad',
  })
  documento!: string;

  @ApiPropertyOptional({
    example: 'Invitado por el equipo local',
    description: 'Notas adicionales',
  })
  notas?: string | null;

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

export class GuestPersonWithStatsDto extends GuestPersonResponseDto {
  @ApiProperty({
    example: 5,
    description: 'Cantidad de jornadas que ha asistido',
  })
  playerMatchDaysCount!: number;
}
