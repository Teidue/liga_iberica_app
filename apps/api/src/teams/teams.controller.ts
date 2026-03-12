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
import { TeamsService } from './teams.service';
import {
  CreateTeamDto,
  UpdateTeamDto,
  TeamResponseDto,
  TeamWithPlayersDto,
} from './dto/team.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UserRole } from '../common/enums';

@ApiTags('teams')
@ApiBearerAuth()
@Controller('teams')
@UseGuards(JwtAuthGuard)
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo equipo' })
  @ApiResponse({
    status: 201,
    description: 'Equipo creado exitosamente',
    type: TeamResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o equipo ya existe',
  })
  @ApiResponse({ status: 404, description: 'Administrador no encontrado' })
  create(
    @Body() createTeamDto: CreateTeamDto,
    @Request() req: { user: { role: UserRole; id: string } },
  ): Promise<TeamResponseDto> {
    // Solo SUPER_ADMIN puede crear equipos con adminId específico
    if (createTeamDto.adminId && req.user.role !== UserRole.SUPER_ADMIN) {
      // Si no es SUPER_ADMIN, solo puede asignarse a sí mismo como admin
      createTeamDto.adminId = req.user.id;
    } else if (
      !createTeamDto.adminId &&
      req.user.role === UserRole.TEAM_ADMIN
    ) {
      // Si es TEAM_ADMIN y no especifica adminId, se asigna a sí mismo
      createTeamDto.adminId = req.user.id;
    }

    return this.teamsService.create(createTeamDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los equipos' })
  @ApiResponse({
    status: 200,
    description: 'Lista de equipos',
    type: [TeamResponseDto],
  })
  findAll(
    @Request() req: { user: { role: UserRole; id: string } },
  ): Promise<TeamWithPlayersDto[]> {
    if (req.user.role === UserRole.TEAM_ADMIN) {
      return this.teamsService.findByAdmin(req.user.id);
    }
    return this.teamsService.findAll();
  }

  @Get('my')
  @ApiOperation({
    summary: 'Obtener equipos del usuario actual (solo TEAM_ADMIN)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de equipos del usuario',
    type: [TeamResponseDto],
  })
  findMyTeams(
    @Request() req: { user: { role: UserRole; id: string } },
  ): Promise<TeamResponseDto[]> {
    return this.teamsService.findByAdmin(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un equipo por ID con conteo de jugadores' })
  @ApiResponse({
    status: 200,
    description: 'Equipo encontrado',
    type: TeamWithPlayersDto,
  })
  @ApiResponse({ status: 404, description: 'Equipo no encontrado' })
  findOne(@Param('id') id: string): Promise<TeamWithPlayersDto> {
    // Verificar permisos: TEAM_ADMIN solo puede ver sus propios equipos
    // Esto se verificará en el service si es necesario
    return this.teamsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un equipo' })
  @ApiResponse({
    status: 200,
    description: 'Equipo actualizado',
    type: TeamResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Equipo no encontrado' })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o nombre duplicado',
  })
  update(
    @Param('id') id: string,
    @Body() updateTeamDto: UpdateTeamDto,
    @Request() req: { user: { role: UserRole; id: string } },
  ): Promise<TeamResponseDto> {
    // Solo SUPER_ADMIN puede cambiar el adminId
    if (
      updateTeamDto.adminId !== undefined &&
      req.user.role !== UserRole.SUPER_ADMIN
    ) {
      delete updateTeamDto.adminId;
    }

    return this.teamsService.update(id, updateTeamDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un equipo' })
  @ApiResponse({ status: 204, description: 'Equipo eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Equipo no encontrado' })
  @ApiResponse({
    status: 409,
    description:
      'No se puede eliminar el equipo (tiene jugadores activos o inscripciones)',
  })
  remove(
    @Param('id') id: string,
    @Request() req: { user: { role: UserRole } },
  ): Promise<void> {
    // Solo SUPER_ADMIN puede eliminar equipos
    if (req.user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('No autorizado');
    }

    return this.teamsService.remove(id);
  }
}
