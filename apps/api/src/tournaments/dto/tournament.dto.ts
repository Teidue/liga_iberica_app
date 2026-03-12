import {
  IsString,
  MinLength,
  IsOptional,
  IsDate,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTournamentDto {
  @ApiProperty({
    example: 'Copa Iberia 2026',
    description: 'Nombre del torneo',
  })
  @IsString()
  @MinLength(2)
  nombre!: string;

  @ApiProperty({
    example: 150.0,
    description: 'Monto de inscripción por equipo ($)',
  })
  @IsNumber()
  @Type(() => Number)
  montoInscripcion!: number;

  @ApiProperty({
    example: '2026-03-01',
    description: 'Fecha de inicio del torneo',
  })
  @IsDate()
  @Type(() => Date)
  fechaInicio!: Date;

  @ApiProperty({
    example: '2026-06-01',
    description: 'Fecha de fin del torneo',
  })
  @IsDate()
  @Type(() => Date)
  fechaFin!: Date;
}

export class UpdateTournamentDto {
  @ApiPropertyOptional({
    example: 'Copa Iberia 2026',
    description: 'Nombre del torneo',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  nombre?: string;

  @ApiPropertyOptional({
    example: 150.0,
    description: 'Monto de inscripción por equipo ($)',
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  montoInscripcion?: number;

  @ApiPropertyOptional({
    example: '2026-03-01',
    description: 'Fecha de inicio',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  fechaInicio?: Date;

  @ApiPropertyOptional({ example: '2026-06-01', description: 'Fecha de fin' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  fechaFin?: Date;
}

export class TournamentResponseDto {
  @ApiProperty({
    example: 'uuid-1234-5678',
    description: 'ID único del torneo',
  })
  id!: string;

  @ApiProperty({
    example: 'Copa Iberia 2026',
    description: 'Nombre del torneo',
  })
  nombre!: string;

  @ApiProperty({
    example: 150.0,
    description: 'Monto de inscripción por equipo ($)',
  })
  montoInscripcion!: number;

  @ApiProperty({ example: '2026-03-01', description: 'Fecha de inicio' })
  fechaInicio!: Date;

  @ApiProperty({ example: '2026-06-01', description: 'Fecha de fin' })
  fechaFin!: Date;

  @ApiProperty({
    example: '2026-01-31T10:00:00Z',
    description: 'Fecha de creación',
  })
  created_at!: Date;

  @ApiProperty({
    example: '2026-01-31T10:00:00Z',
    description: 'Fecha de actualización',
  })
  updated_at!: Date;
}

export class TournamentWithStatsDto extends TournamentResponseDto {
  @ApiProperty({ example: 10, description: 'Cantidad de jornadas' })
  matchDaysCount!: number;

  @ApiProperty({ example: 8, description: 'Cantidad de equipos inscritos' })
  teamsCount!: number;
}
