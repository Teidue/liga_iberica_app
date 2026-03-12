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
import { MatchDaysService } from './match-days.service';
import {
  CreateMatchDayDto,
  UpdateMatchDayDto,
  MatchDayResponseDto,
  MatchDayWithRelationsDto,
} from './dto/match-day.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { UserRole } from '../common/enums';

@ApiTags('match-days')
@ApiBearerAuth()
@Controller('match-days')
@UseGuards(JwtAuthGuard)
export class MatchDaysController {
  constructor(private readonly matchDaysService: MatchDaysService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva jornada' })
  @ApiResponse({
    status: 201,
    description: 'Jornada creada exitosamente',
    type: MatchDayResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 404, description: 'Torneo o sede no encontrados' })
  create(
    @Request() req: { user: { role: UserRole } },
    @Body() createMatchDayDto: CreateMatchDayDto,
  ): Promise<MatchDayResponseDto> {
    if (req.user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('No autorizado');
    }

    return this.matchDaysService.create(createMatchDayDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las jornadas' })
  @ApiQuery({ name: 'tournamentId', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Lista de jornadas',
    type: [MatchDayResponseDto],
  })
  findAll(
    @Request() req: { user: { role: UserRole } },
    @Query('tournamentId') tournamentId?: string,
  ): Promise<MatchDayResponseDto[] | MatchDayWithRelationsDto[]> {
    if (req.user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('No autorizado');
    }

    if (tournamentId) {
      return this.matchDaysService.findAllByTournament(tournamentId);
    }

    return this.matchDaysService.findAll();
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Obtener próximas jornadas' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({
    name: 'tournamentIds',
    required: false,
    type: String,
    description: 'IDs de torneos separados por coma',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de próximas jornadas',
    type: [MatchDayWithRelationsDto],
  })
  findUpcoming(
    @Query('limit') limit?: string,
    @Query('tournamentIds') tournamentIds?: string,
  ): Promise<MatchDayWithRelationsDto[]> {
    const limitNumber = limit ? parseInt(limit, 10) : 20;
    const ids = tournamentIds
      ? tournamentIds.split(',').filter(Boolean)
      : undefined;
    return this.matchDaysService.findUpcoming(limitNumber, ids);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una jornada por ID' })
  @ApiResponse({
    status: 200,
    description: 'Jornada encontrada',
    type: MatchDayWithRelationsDto,
  })
  @ApiResponse({ status: 404, description: 'Jornada no encontrada' })
  findOne(@Param('id') id: string): Promise<MatchDayWithRelationsDto> {
    return this.matchDaysService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una jornada' })
  @ApiResponse({
    status: 200,
    description: 'Jornada actualizada',
    type: MatchDayResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Jornada no encontrada' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  update(
    @Param('id') id: string,
    @Request() req: { user: { role: UserRole } },
    @Body() updateMatchDayDto: UpdateMatchDayDto,
  ): Promise<MatchDayResponseDto> {
    if (req.user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('No autorizado');
    }

    return this.matchDaysService.update(id, updateMatchDayDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una jornada' })
  @ApiResponse({ status: 204, description: 'Jornada eliminada exitosamente' })
  @ApiResponse({ status: 404, description: 'Jornada no encontrada' })
  @ApiResponse({
    status: 409,
    description: 'No se puede eliminar la jornada (tiene asistencia)',
  })
  remove(
    @Param('id') id: string,
    @Request() req: { user: { role: UserRole } },
  ): Promise<void> {
    if (req.user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('No autorizado');
    }

    return this.matchDaysService.remove(id);
  }
}
