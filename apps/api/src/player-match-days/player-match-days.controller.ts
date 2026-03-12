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
import { PlayerMatchDaysService } from './player-match-days.service';
import {
  CreatePlayerMatchDayDto,
  UpdatePlayerMatchDayDto,
  PlayerMatchDayResponseDto,
  PlayerMatchDayWithRelationsDto,
} from './dto/player-match-day.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { UserRole } from '../common/enums';

@ApiTags('player-match-days')
@ApiBearerAuth()
@Controller('player-match-days')
@UseGuards(JwtAuthGuard)
export class PlayerMatchDaysController {
  constructor(
    private readonly playerMatchDaysService: PlayerMatchDaysService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Registrar asistencia de jugador' })
  @ApiResponse({
    status: 201,
    description: 'Asistencia registrada',
    type: PlayerMatchDayResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 404, description: 'Jugador o jornada no encontrados' })
  @ApiResponse({
    status: 409,
    description: 'Invitado duplicado o asistencia ya existe',
  })
  create(
    @Body() createPlayerMatchDayDto: CreatePlayerMatchDayDto,
    @Request() req: { user: { role: UserRole; id: string } },
  ): Promise<PlayerMatchDayResponseDto> {
    const teamAdminId =
      req.user.role === UserRole.TEAM_ADMIN ? req.user.id : undefined;
    return this.playerMatchDaysService.create(
      createPlayerMatchDayDto,
      teamAdminId,
    );
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Registrar múltiples asistencias' })
  @ApiResponse({
    status: 201,
    description: 'Asistencias registradas',
    type: [PlayerMatchDayResponseDto],
  })
  bulkCreate(
    @Body() createPlayerMatchDaysDto: CreatePlayerMatchDayDto[],
    @Request() req: { user: { role: UserRole; id: string } },
  ): Promise<PlayerMatchDayResponseDto[]> {
    const teamAdminId =
      req.user.role === UserRole.TEAM_ADMIN ? req.user.id : undefined;
    return this.playerMatchDaysService.bulkCreate(
      createPlayerMatchDaysDto,
      teamAdminId,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las asistencias' })
  @ApiQuery({ name: 'matchDayId', required: false, type: String })
  @ApiQuery({ name: 'playerId', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Lista de asistencias',
    type: [PlayerMatchDayResponseDto],
  })
  findAll(
    @Request() req: { user: { role: UserRole } },
    @Query('matchDayId') matchDayId?: string,
    @Query('playerId') playerId?: string,
  ): Promise<PlayerMatchDayResponseDto[] | PlayerMatchDayWithRelationsDto[]> {
    if (req.user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('No autorizado');
    }

    if (matchDayId) {
      return this.playerMatchDaysService.findAllByMatchDay(matchDayId);
    }

    if (playerId) {
      return this.playerMatchDaysService.findAllByPlayer(playerId);
    }

    return this.playerMatchDaysService.findAll();
  }

  @Get('team/:matchDayId')
  @ApiOperation({ summary: 'Obtener asistencias de un equipo en una jornada' })
  @ApiResponse({
    status: 200,
    description: 'Lista de asistencias del equipo',
    type: [PlayerMatchDayWithRelationsDto],
  })
  findByTeamAndMatchDay(
    @Request() req: { user: { role: UserRole; id: string } },
    @Param('matchDayId') matchDayId: string,
  ): Promise<PlayerMatchDayWithRelationsDto[]> {
    if (req.user.role !== UserRole.TEAM_ADMIN) {
      throw new ForbiddenException('No autorizado');
    }

    return this.playerMatchDaysService.findByTeamAndMatchDay(
      req.user.id,
      matchDayId,
    );
  }

  @Get('stats/:matchDayId')
  @ApiOperation({ summary: 'Obtener estadísticas de asistencia' })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas de asistencia',
    type: Object,
  })
  getAttendanceStats(
    @Param('matchDayId') matchDayId: string,
    @Request() req: { user: { role: UserRole } },
  ) {
    if (req.user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('No autorizado');
    }

    return this.playerMatchDaysService.getAttendanceStats(matchDayId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una asistencia por ID' })
  @ApiResponse({
    status: 200,
    description: 'Asistencia encontrada',
    type: PlayerMatchDayWithRelationsDto,
  })
  @ApiResponse({ status: 404, description: 'Asistencia no encontrada' })
  findOne(@Param('id') id: string): Promise<PlayerMatchDayWithRelationsDto> {
    return this.playerMatchDaysService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar asistencia' })
  @ApiResponse({
    status: 200,
    description: 'Asistencia actualizada',
    type: PlayerMatchDayResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Asistencia no encontrada' })
  @ApiResponse({ status: 409, description: 'Invitado duplicado' })
  update(
    @Param('id') id: string,
    @Body() updatePlayerMatchDayDto: UpdatePlayerMatchDayDto,
    @Request() req: { user: { role: UserRole; id: string } },
  ): Promise<PlayerMatchDayResponseDto> {
    const teamAdminId =
      req.user.role === UserRole.TEAM_ADMIN ? req.user.id : undefined;
    return this.playerMatchDaysService.update(
      id,
      updatePlayerMatchDayDto,
      teamAdminId,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar asistencia' })
  @ApiResponse({ status: 204, description: 'Asistencia eliminada' })
  @ApiResponse({ status: 404, description: 'Asistencia no encontrada' })
  remove(@Param('id') id: string): Promise<void> {
    return this.playerMatchDaysService.remove(id);
  }
}
