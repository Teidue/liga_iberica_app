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
import { ClubsService } from './clubs.service';
import {
  CreateClubDto,
  UpdateClubDto,
  ClubResponseDto,
  ClubWithStatsDto,
} from './dto/club.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UserRole } from '../common/enums';

@ApiTags('clubs')
@ApiBearerAuth()
@Controller('clubs')
@UseGuards(JwtAuthGuard)
export class ClubsController {
  constructor(private readonly clubsService: ClubsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva sede' })
  @ApiResponse({
    status: 201,
    description: 'Sede creada exitosamente',
    type: ClubResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos o sede ya existe' })
  create(
    @Body() createClubDto: CreateClubDto,
    @Request() req: { user: { role: UserRole } },
  ): Promise<ClubResponseDto> {
    // Solo SUPER_ADMIN puede crear sedes
    if (req.user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('No autorizado');
    }

    return this.clubsService.create(createClubDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las sedes' })
  @ApiResponse({
    status: 200,
    description: 'Lista de sedes',
    type: [ClubResponseDto],
  })
  findAll(
    @Request() req: { user: { role: UserRole } },
  ): Promise<ClubResponseDto[]> {
    // Solo SUPER_ADMIN puede ver todas las sedes
    if (req.user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('No autorizado');
    }

    return this.clubsService.findAll();
  }

  @Get('with-excel-format')
  @ApiOperation({ summary: 'Obtener sedes con formato Excel configurado' })
  @ApiResponse({
    status: 200,
    description: 'Lista de sedes con formato Excel',
    type: [ClubResponseDto],
  })
  async findByExcelFormat(
    @Request() req: { user: { role: UserRole } },
  ): Promise<ClubResponseDto[]> {
    // Solo SUPER_ADMIN puede ver estas configuraciones
    if (req.user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('No autorizado');
    }

    return this.clubsService.findByExcelFormat();
  }

  @Get('default-excel-format')
  @ApiOperation({ summary: 'Obtener formato Excel por defecto' })
  @ApiResponse({ status: 200, description: 'Formato Excel por defecto' })
  getDefaultExcelFormat(): object {
    return this.clubsService.getDefaultExcelFormat();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una sede por ID con estadísticas' })
  @ApiResponse({
    status: 200,
    description: 'Sede encontrada',
    type: ClubWithStatsDto,
  })
  @ApiResponse({ status: 404, description: 'Sede no encontrada' })
  findOne(
    @Param('id') id: string,
    @Request() req: { user: { role: UserRole } },
  ): Promise<ClubWithStatsDto> {
    // Solo SUPER_ADMIN puede ver detalles de sedes
    if (req.user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('No autorizado');
    }

    return this.clubsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una sede' })
  @ApiResponse({
    status: 200,
    description: 'Sede actualizada',
    type: ClubResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Sede no encontrada' })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o nombre duplicado',
  })
  update(
    @Param('id') id: string,
    @Body() updateClubDto: UpdateClubDto,
    @Request() req: { user: { role: UserRole } },
  ): Promise<ClubResponseDto> {
    // Solo SUPER_ADMIN puede actualizar sedes
    if (req.user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('No autorizado');
    }

    return this.clubsService.update(id, updateClubDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una sede' })
  @ApiResponse({ status: 204, description: 'Sede eliminada exitosamente' })
  @ApiResponse({ status: 404, description: 'Sede no encontrada' })
  @ApiResponse({
    status: 409,
    description: 'No se puede eliminar la sede (tiene jornadas asociadas)',
  })
  remove(
    @Param('id') id: string,
    @Request() req: { user: { role: UserRole } },
  ): Promise<void> {
    // Solo SUPER_ADMIN puede eliminar sedes
    if (req.user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('No autorizado');
    }

    return this.clubsService.remove(id);
  }
}
