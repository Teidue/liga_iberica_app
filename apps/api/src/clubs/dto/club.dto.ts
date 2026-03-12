import {
  IsString,
  MinLength,
  IsOptional,
  IsObject,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ExcelColumn {
  @ApiProperty({ example: 'nombre', description: 'Nombre del campo' })
  name!: string;

  @ApiProperty({ example: 'Nombre', description: 'Encabezado de la columna' })
  header!: string;

  @ApiPropertyOptional({ example: 20, description: 'Ancho de la columna' })
  width?: number;

  @ApiPropertyOptional({
    example: 'string',
    enum: ['string', 'number', 'date'],
    description: 'Tipo de dato',
  })
  type?: 'string' | 'number' | 'date';
}

export class ExcelFormat {
  @ApiProperty({
    description: 'Definición de columnas para Excel',
    example: [
      { name: 'nombre', header: 'Nombre', width: 20, type: 'string' },
      { name: 'documento', header: 'Documento', width: 15, type: 'string' },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExcelColumn)
  columns!: ExcelColumn[];

  @ApiPropertyOptional({
    example: 'Jugadores',
    description: 'Nombre de la hoja',
  })
  @IsOptional()
  @IsString()
  sheetName?: string;

  @ApiPropertyOptional({
    example: 'Lista de Jugadores',
    description: 'Título del documento',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    example: ['Nombre', 'Documento', 'Estado'],
    description: 'Encabezados adicionales',
  })
  @IsOptional()
  @IsArray()
  headers?: string[];
}

export class CreateClubDto {
  @ApiProperty({
    example: 'Pabellón Municipal',
    description: 'Nombre del club/sede',
  })
  @IsString()
  @MinLength(2)
  nombre!: string;

  @ApiPropertyOptional({
    example: 'Av. Principal 123',
    description: 'Dirección del club',
  })
  @IsOptional()
  @IsString()
  @MinLength(5)
  direccion?: string;

  @ApiPropertyOptional({
    description: 'Formato personalizado para exportación Excel',
    example: {
      columns: [
        { name: 'nombre', header: 'Nombre', width: 20 },
        { name: 'documento', header: 'Documento', width: 15 },
      ],
      sheetName: 'Jugadores',
    },
  })
  @IsOptional()
  @IsObject()
  formatoExcel?: object | null;
}

export class UpdateClubDto {
  @ApiPropertyOptional({
    example: 'Pabellón Municipal',
    description: 'Nombre del club/sede',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  nombre?: string;

  @ApiPropertyOptional({
    example: 'Av. Principal 123',
    description: 'Dirección del club',
  })
  @IsOptional()
  @IsString()
  @MinLength(5)
  direccion?: string;

  @ApiPropertyOptional({
    description: 'Formato personalizado para exportación Excel',
  })
  @IsOptional()
  @IsObject()
  formatoExcel?: object | null;
}

export class ClubResponseDto {
  @ApiProperty({
    example: 'uuid-1234-5678',
    description: 'ID único del club',
  })
  id!: string;

  @ApiProperty({
    example: 'Pabellón Municipal',
    description: 'Nombre del club',
  })
  nombre!: string;

  @ApiPropertyOptional({
    example: 'Av. Principal 123',
    description: 'Dirección del club',
  })
  direccion?: string | null;

  @ApiPropertyOptional({
    description: 'Formato Excel personalizado',
  })
  formatoExcel?: object | null;
}

export class ClubWithStatsDto extends ClubResponseDto {
  @ApiProperty({
    example: 15,
    description: 'Cantidad total de jornadas',
  })
  matchDaysCount!: number;

  @ApiProperty({
    example: 3,
    description: 'Cantidad de jornadas próximas',
  })
  upcomingMatchDaysCount!: number;
}
