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
  ForbiddenException,
} from '@nestjs/common';
import { TournamentsService } from './tournaments.service';
import {
  CreateTournamentDto,
  UpdateTournamentDto,
  TournamentResponseDto,
  TournamentWithStatsDto,
} from './dto/tournament.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UserRole } from '../common/enums';

@ApiTags('tournaments')
@ApiBearerAuth()
@Controller('tournaments')
@UseGuards(JwtAuthGuard)
export class TournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo torneo' })
  @ApiResponse({
    status: 201,
    description: 'Torneo creado exitosamente',
    type: TournamentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 409, description: 'Conflicto de datos' })
  create(
    @Body() createTournamentDto: CreateTournamentDto,
    @Request() req: { user: { role: UserRole } },
  ): Promise<TournamentResponseDto> {
    if (req.user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('No autorizado');
    }

    return this.tournamentsService.create(createTournamentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los torneos' })
  @ApiResponse({
    status: 200,
    description: 'Lista de torneos',
    type: [TournamentResponseDto],
  })
  findAll(
    @Request() req: { user: { role: UserRole } },
  ): Promise<TournamentResponseDto[]> {
    if (req.user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('No autorizado');
    }

    return this.tournamentsService.findAll();
  }

  @Get('active')
  @ApiOperation({ summary: 'Obtener torneos activos (en curso)' })
  @ApiResponse({
    status: 200,
    description: 'Lista de torneos activos',
    type: [TournamentResponseDto],
  })
  findActive(): Promise<TournamentResponseDto[]> {
    return this.tournamentsService.findActive();
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Obtener torneos upcoming (por venir)' })
  @ApiResponse({
    status: 200,
    description: 'Lista de torneos por venir',
    type: [TournamentResponseDto],
  })
  findUpcoming(): Promise<TournamentResponseDto[]> {
    return this.tournamentsService.findUpcoming();
  }

  @Get('past')
  @ApiOperation({ summary: 'Obtener torneos pasados' })
  @ApiResponse({
    status: 200,
    description: 'Lista de torneos finalizados',
    type: [TournamentResponseDto],
  })
  findPast(
    @Request() req: { user: { role: UserRole } },
  ): Promise<TournamentResponseDto[]> {
    if (req.user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('No autorizado');
    }

    return this.tournamentsService.findPast();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un torneo por ID con estadísticas' })
  @ApiResponse({
    status: 200,
    description: 'Torneo encontrado',
    type: TournamentWithStatsDto,
  })
  @ApiResponse({ status: 404, description: 'Torneo no encontrado' })
  findOne(@Param('id') id: string): Promise<TournamentWithStatsDto> {
    return this.tournamentsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un torneo' })
  @ApiResponse({
    status: 200,
    description: 'Torneo actualizado',
    type: TournamentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Torneo no encontrado' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  update(
    @Param('id') id: string,
    @Body() updateTournamentDto: UpdateTournamentDto,
    @Request() req: { user: { role: UserRole } },
  ): Promise<TournamentResponseDto> {
    if (req.user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('No autorizado');
    }

    return this.tournamentsService.update(id, updateTournamentDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un torneo' })
  @ApiResponse({ status: 204, description: 'Torneo eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Torneo no encontrado' })
  @ApiResponse({
    status: 409,
    description:
      'No se puede eliminar el torneo (tiene jornadas o equipos asociados)',
  })
  remove(
    @Param('id') id: string,
    @Request() req: { user: { role: UserRole } },
  ): Promise<void> {
    if (req.user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('No autorizado');
    }

    return this.tournamentsService.remove(id);
  }
}
