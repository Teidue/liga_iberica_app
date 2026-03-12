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
import { TournamentTeamsService } from './tournament-teams.service';
import {
  CreateTournamentTeamDto,
  UpdateTournamentTeamDto,
  TournamentTeamResponseDto,
  TournamentTeamWithRelationsDto,
} from './dto/tournament-team.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { UserRole } from '../common/enums';

@ApiTags('tournament-teams')
@ApiBearerAuth()
@Controller('tournament-teams')
@UseGuards(JwtAuthGuard)
export class TournamentTeamsController {
  constructor(
    private readonly tournamentTeamsService: TournamentTeamsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Inscribir equipo en torneo' })
  @ApiResponse({
    status: 201,
    description: 'Equipo inscrito',
    type: TournamentTeamResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 404, description: 'Torneo o equipo no encontrados' })
  @ApiResponse({ status: 409, description: 'Equipo ya inscrito' })
  create(
    @Body() createTournamentTeamDto: CreateTournamentTeamDto,
  ): Promise<TournamentTeamResponseDto> {
    return this.tournamentTeamsService.create(createTournamentTeamDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las inscripciones' })
  @ApiQuery({ name: 'tournamentId', required: false, type: String })
  @ApiQuery({ name: 'teamId', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Lista de inscripciones',
    type: [TournamentTeamResponseDto],
  })
  findAll(
    @Request() req: { user: { role: UserRole } },
    @Query('tournamentId') tournamentId?: string,
    @Query('teamId') teamId?: string,
  ): Promise<TournamentTeamResponseDto[] | TournamentTeamWithRelationsDto[]> {
    if (req.user.role !== UserRole.SUPER_ADMIN && !teamId) {
      throw new ForbiddenException('No autorizado');
    }

    if (tournamentId) {
      return this.tournamentTeamsService.findAllByTournament(tournamentId);
    }

    if (teamId) {
      return this.tournamentTeamsService.findAllByTeam(teamId);
    }

    return this.tournamentTeamsService.findAll();
  }

  @Get('balance/:id')
  @ApiOperation({ summary: 'Obtener saldo de inscripción' })
  @ApiResponse({
    status: 200,
    description: 'Saldo del equipo en el torneo',
    type: Object,
  })
  getBalance(
    @Param('id') id: string,
    @Request() req: { user: { role: UserRole } },
  ) {
    if (req.user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('No autorizado');
    }

    return this.tournamentTeamsService.getBalance(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una inscripción por ID' })
  @ApiResponse({
    status: 200,
    description: 'Inscripción encontrada',
    type: TournamentTeamWithRelationsDto,
  })
  @ApiResponse({ status: 404, description: 'Inscripción no encontrada' })
  findOne(@Param('id') id: string): Promise<TournamentTeamWithRelationsDto> {
    return this.tournamentTeamsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar inscripción' })
  @ApiResponse({
    status: 200,
    description: 'Inscripción actualizada',
    type: TournamentTeamResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Inscripción no encontrada' })
  update(
    @Param('id') id: string,
    @Request() req: { user: { role: UserRole } },
    @Body() updateTournamentTeamDto: UpdateTournamentTeamDto,
  ): Promise<TournamentTeamResponseDto> {
    if (req.user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('No autorizado');
    }

    return this.tournamentTeamsService.update(id, updateTournamentTeamDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar inscripción' })
  @ApiResponse({ status: 204, description: 'Inscripción eliminada' })
  @ApiResponse({ status: 404, description: 'Inscripción no encontrada' })
  @ApiResponse({
    status: 409,
    description: 'No se puede eliminar (tiene pagos)',
  })
  remove(
    @Param('id') id: string,
    @Request() req: { user: { role: UserRole } },
  ): Promise<void> {
    if (req.user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('No autorizado');
    }

    return this.tournamentTeamsService.remove(id);
  }
}
