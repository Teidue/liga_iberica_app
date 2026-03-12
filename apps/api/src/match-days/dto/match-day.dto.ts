import { IsOptional, IsDate, IsUUID, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMatchDayDto {
  @ApiProperty({
    example: '2026-03-15T18:00:00Z',
    description: 'Fecha y hora de la jornada',
  })
  @IsDate()
  @Type(() => Date)
  fecha!: Date;

  @ApiProperty({
    example: 'uuid-del-torneo',
    description: 'ID del torneo',
  })
  @IsUUID()
  tournamentId!: string;

  @ApiProperty({
    example: 'uuid-del-club',
    description: 'ID del club/sede',
  })
  @IsUUID()
  clubId!: string;
}

export class UpdateMatchDayDto {
  @ApiPropertyOptional({
    example: '2026-03-15T18:00:00Z',
    description: 'Fecha y hora de la jornada',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  fecha?: Date;

  @ApiPropertyOptional({
    example: 'uuid-del-torneo',
    description: 'ID del torneo',
  })
  @IsOptional()
  @IsUUID()
  tournamentId?: string;

  @ApiPropertyOptional({
    example: 'uuid-del-club',
    description: 'ID del club/sede',
  })
  @IsOptional()
  @IsUUID()
  clubId?: string;

  @ApiPropertyOptional({
    example: true,
    description:
      'Si true, bloquea el registro de asistencia por parte de los equipos',
  })
  @IsOptional()
  @IsBoolean()
  cerrado?: boolean;
}

export class MatchDayResponseDto {
  @ApiProperty({
    example: 'uuid-1234-5678',
    description: 'ID único de la jornada',
  })
  id!: string;

  @ApiProperty({
    example: '2026-03-15T18:00:00Z',
    description: 'Fecha de la jornada',
  })
  fecha!: Date;

  @ApiProperty({ example: 'uuid-del-torneo', description: 'ID del torneo' })
  tournamentId!: string;

  @ApiProperty({ example: 'uuid-del-club', description: 'ID del club' })
  clubId!: string;

  @ApiProperty({
    example: false,
    description: 'Si true, la asistencia está cerrada',
  })
  cerrado!: boolean;

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

export class MatchDayWithRelationsDto extends MatchDayResponseDto {
  @ApiPropertyOptional({ description: 'Información del torneo' })
  tournament?: {
    id: string;
    nombre: string;
  };

  @ApiPropertyOptional({ description: 'Información del club/sede' })
  club?: {
    id: string;
    nombre: string;
    direccion?: string | null;
    formatoExcel?: Record<string, unknown> | null;
  };

  @ApiProperty({
    example: 20,
    description: 'Cantidad de registros de asistencia',
  })
  playerMatchDaysCount!: number;
}
