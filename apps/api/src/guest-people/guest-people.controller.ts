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
import { GuestPeopleService } from './guest-people.service';
import {
  CreateGuestPersonDto,
  UpdateGuestPersonDto,
  GuestPersonResponseDto,
  GuestPersonWithStatsDto,
} from './dto/guest-person.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { UserRole } from '../common/enums';

@ApiTags('guest-people')
@ApiBearerAuth()
@Controller('guest-people')
@UseGuards(JwtAuthGuard)
export class GuestPeopleController {
  constructor(private readonly guestPeopleService: GuestPeopleService) {}

  @Post()
  @ApiOperation({ summary: 'Crear o buscar invitado por documento' })
  @ApiResponse({
    status: 201,
    description: 'Invitado creado o existente',
    type: GuestPersonResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  create(
    @Request() req: { user: { role: UserRole } },
    @Body() createGuestPersonDto: CreateGuestPersonDto,
  ): Promise<GuestPersonResponseDto> {
    return this.guestPeopleService.create(createGuestPersonDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los invitados' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Lista de invitados',
    type: [GuestPersonResponseDto],
  })
  findAll(
    @Request() req: { user: { role: UserRole } },
    @Query('search') search?: string,
  ): Promise<GuestPersonResponseDto[] | GuestPersonWithStatsDto[]> {
    if (req.user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('No autorizado');
    }

    if (search) {
      return this.guestPeopleService.search(search);
    }

    return this.guestPeopleService.findAll();
  }

  @Get('by-documento/:documento')
  @ApiOperation({ summary: 'Buscar invitado por documento' })
  @ApiResponse({
    status: 200,
    description: 'Invitado encontrado o null',
    type: GuestPersonResponseDto,
  })
  findByDocumento(
    @Param('documento') documento: string,
  ): Promise<GuestPersonResponseDto | null> {
    return this.guestPeopleService.findByDocumento(documento);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un invitado por ID' })
  @ApiResponse({
    status: 200,
    description: 'Invitado encontrado',
    type: GuestPersonWithStatsDto,
  })
  @ApiResponse({ status: 404, description: 'Invitado no encontrado' })
  findOne(@Param('id') id: string): Promise<GuestPersonWithStatsDto> {
    return this.guestPeopleService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un invitado' })
  @ApiResponse({
    status: 200,
    description: 'Invitado actualizado',
    type: GuestPersonResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Invitado no encontrado' })
  @ApiResponse({ status: 409, description: 'Documento duplicado' })
  update(
    @Param('id') id: string,
    @Request() req: { user: { role: UserRole } },
    @Body() updateGuestPersonDto: UpdateGuestPersonDto,
  ): Promise<GuestPersonResponseDto> {
    if (req.user.role !== UserRole.TEAM_ADMIN) {
      throw new ForbiddenException('No autorizado');
    }

    return this.guestPeopleService.update(id, updateGuestPersonDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un invitado' })
  @ApiResponse({ status: 204, description: 'Invitado eliminado' })
  @ApiResponse({ status: 404, description: 'Invitado no encontrado' })
  @ApiResponse({
    status: 409,
    description: 'No se puede eliminar (tiene asistencia)',
  })
  remove(
    @Param('id') id: string,
    @Request() req: { user: { role: UserRole } },
  ): Promise<void> {
    if (req.user.role !== UserRole.TEAM_ADMIN) {
      throw new ForbiddenException('No autorizado');
    }

    return this.guestPeopleService.remove(id);
  }
}
