import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { PlayersService } from './players.service';
import {
  CreatePlayerDto,
  UpdatePlayerDto,
  PlayerResponseDto,
  PlayerWithStatsDto,
} from './dto/player.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { UserRole } from '../common/enums';
import { TeamsService } from '../teams/teams.service';

@ApiTags('players')
@ApiBearerAuth()
@Controller('players')
@UseGuards(JwtAuthGuard)
export class PlayersController {
  constructor(
    private readonly playersService: PlayersService,
    private readonly teamsService: TeamsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo jugador' })
  @ApiResponse({
    status: 201,
    description: 'Jugador creado exitosamente',
    type: PlayerResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o documento duplicado',
  })
  @ApiResponse({ status: 404, description: 'Equipo no encontrado' })
  async create(
    @Body() createPlayerDto: CreatePlayerDto,
    @Request() req: { user: { role: UserRole; id: string } },
  ): Promise<PlayerResponseDto> {
    // TEAM_ADMIN solo puede crear jugadores en sus equipos
    if (req.user.role === UserRole.TEAM_ADMIN) {
      const userTeams = await this.teamsService.findByAdmin(req.user.id);
      const teamIds = userTeams.map((team) => team.id);

      if (!teamIds.includes(createPlayerDto.teamId)) {
        throw new ForbiddenException(
          'No autorizado: No puedes crear jugadores en este equipo',
        );
      }
    }

    return this.playersService.create(createPlayerDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los jugadores (con filtros)' })
  @ApiQuery({
    name: 'teamId',
    required: false,
    description: 'Filtrar por equipo',
  })
  @ApiQuery({
    name: 'active',
    required: false,
    description: 'Solo jugadores activos',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de jugadores',
    type: [PlayerResponseDto],
  })
  async findAll(
    @Query('teamId') teamId?: string,
    @Query('active') active?: string,
  ): Promise<PlayerResponseDto[]> {
    const activeOnly = active === 'true';

    if (activeOnly) {
      return this.playersService.findActive(teamId);
    }

    return this.playersService.findAll(teamId);
  }

  @Get('team/:teamId')
  @ApiOperation({ summary: 'Obtener jugadores de un equipo específico' })
  @ApiQuery({
    name: 'active',
    required: false,
    description: 'Solo jugadores activos',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de jugadores del equipo',
    type: [PlayerResponseDto],
  })
  async findByTeam(
    @Param('teamId') teamId: string,
    @Query('active') active: string,
    @Request() req: { user: { role: UserRole; id: string } },
  ): Promise<PlayerResponseDto[]> {
    // TEAM_ADMIN solo puede ver jugadores de sus equipos
    if (req.user.role === UserRole.TEAM_ADMIN) {
      const userTeams = await this.teamsService.findByAdmin(req.user.id);
      const teamIds = userTeams.map((team) => team.id);

      if (!teamIds.includes(teamId)) {
        throw new ForbiddenException(
          'No autorizado: No puedes ver jugadores de este equipo',
        );
      }
    }

    const isActive = active === 'true';
    return this.playersService.findByTeam(teamId, isActive);
  }

  @Get('search')
  @ApiOperation({ summary: 'Buscar jugadores por documento' })
  @ApiQuery({
    name: 'documento',
    required: true,
    description: 'Documento del jugador',
  })
  @ApiQuery({
    name: 'teamId',
    required: false,
    description: 'Filtrar por equipo',
  })
  @ApiResponse({
    status: 200,
    description: 'Resultados de búsqueda',
    type: [PlayerResponseDto],
  })
  async findByDocument(
    @Query('documento') documento: string,
    @Query('teamId') teamId: string,
    @Request() req: { user: { role: UserRole; id: string } },
  ): Promise<PlayerResponseDto[]> {
    // TEAM_ADMIN solo puede buscar en sus equipos
    if (req.user.role === UserRole.TEAM_ADMIN && teamId) {
      const userTeams = await this.teamsService.findByAdmin(req.user.id);
      const teamIds = userTeams.map((team) => team.id);

      if (!teamIds.includes(teamId)) {
        throw new ForbiddenException(
          'No autorizado: No puedes buscar jugadores en este equipo',
        );
      }
    }

    return this.playersService.findByDocument(documento, teamId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un jugador por ID con estadísticas' })
  @ApiResponse({
    status: 200,
    description: 'Jugador encontrado',
    type: PlayerWithStatsDto,
  })
  @ApiResponse({ status: 404, description: 'Jugador no encontrado' })
  async findOne(
    @Param('id') id: string,
    @Request() req: { user: { role: UserRole; id: string } },
  ): Promise<PlayerWithStatsDto> {
    const player = await this.playersService.findOne(id);

    // TEAM_ADMIN solo puede ver jugadores de sus equipos
    if (req.user.role === UserRole.TEAM_ADMIN) {
      const userTeams = await this.teamsService.findByAdmin(req.user.id);
      const teamIds = userTeams.map((team) => team.id);

      if (!teamIds.includes(player.teamId)) {
        throw new ForbiddenException(
          'No autorizado: No puedes ver jugadores de este equipo',
        );
      }
    }

    return player;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un jugador' })
  @ApiResponse({
    status: 200,
    description: 'Jugador actualizado',
    type: PlayerResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Jugador no encontrado' })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o documento duplicado',
  })
  async update(
    @Param('id') id: string,
    @Body() updatePlayerDto: UpdatePlayerDto,
    @Request() req: { user: { role: UserRole; id: string } },
  ): Promise<PlayerResponseDto> {
    // Verificar permisos: TEAM_ADMIN solo puede actualizar jugadores de sus equipos
    if (req.user.role === UserRole.TEAM_ADMIN) {
      const player = await this.playersService.findOneResponse(id);
      const userTeams = await this.teamsService.findByAdmin(req.user.id);
      const teamIds = userTeams.map((team) => team.id);

      if (!teamIds.includes(player.teamId)) {
        throw new ForbiddenException(
          'No autorizado: No puedes actualizar jugadores de este equipo',
        );
      }
    }

    return this.playersService.update(id, updatePlayerDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Inactivar o eliminar un jugador' })
  @ApiResponse({
    status: 204,
    description: 'Jugador inactivado/eliminado exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Jugador no encontrado' })
  async remove(
    @Param('id') id: string,
    @Request() req: { user: { role: UserRole; id: string } },
  ): Promise<void> {
    // Verificar permisos: TEAM_ADMIN solo puede eliminar jugadores de sus equipos
    if (req.user.role === UserRole.TEAM_ADMIN) {
      const player = await this.playersService.findOneResponse(id);
      const userTeams = await this.teamsService.findByAdmin(req.user.id);
      const teamIds = userTeams.map((team) => team.id);

      if (!teamIds.includes(player.teamId)) {
        throw new ForbiddenException(
          'No autorizado: No puedes eliminar jugadores de este equipo',
        );
      }
    }

    return this.playersService.remove(id);
  }
}
