import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Team } from '../teams/entities/team.entity';
import { Player } from '../players/entities/player.entity';
import { Club } from '../clubs/entities/club.entity';
import { Tournament } from '../tournaments/entities/tournament.entity';
import { MatchDay } from '../match-days/entities/match-day.entity';
import { GuestPerson } from '../guest-people/entities/guest-person.entity';
import { PlayerMatchDay } from '../player-match-days/entities/player-match-day.entity';
import { TournamentTeam } from '../tournament-teams/entities/tournament-team.entity';
import { Payment } from '../payments/entities/payment.entity';
import { UserRole, PaymentMethod } from '../common/enums';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class DatabaseSeederService {
  private readonly logger = new Logger(DatabaseSeederService.name);

  constructor(private readonly dataSource: DataSource) {}

  async seed(): Promise<void> {
    this.logger.log('🌱 Starting database seeding...');

    try {
      // Limpiar datos existentes (solo en desarrollo)
      if (process.env.NODE_ENV === 'development') {
        await this.cleanDatabase();
      }

      // Crear datos semilla
      await this.createUsers();
      await this.createTeams();
      await this.createClubs();
      await this.createTournaments();
      await this.createPlayers();
      await this.createMatchDays();
      await this.createGuests();
      await this.createPlayerMatchDays();
      await this.createTournamentTeams();
      await this.createPayments();

      this.logger.log('✅ Database seeding completed successfully!');
    } catch (error) {
      this.logger.error('❌ Error during database seeding:', error);
      throw error;
    }
  }

  private async cleanDatabase(): Promise<void> {
    this.logger.log('🧹 Cleaning database...');

    const entities = [
      'player_match_days',
      'payments',
      'tournament_teams',
      'guest_people',
      'match_days',
      'players',
      'clubs',
      'tournaments',
      'teams',
      'users',
    ];

    // Desactivar restricciones de clave externa
    await this.dataSource.query('SET session_replication_role = replica;');

    // Truncar tablas en orden inverso para evitar problemas de FK
    for (const entity of entities.reverse()) {
      await this.dataSource.query(
        `TRUNCATE TABLE ${entity} RESTART IDENTITY CASCADE;`,
      );
    }

    // Reactivar restricciones
    await this.dataSource.query('SET session_replication_role = DEFAULT;');
  }

  private async createUsers(): Promise<void> {
    this.logger.log('👥 Creating users...');

    const userRepository = this.dataSource.getRepository(User);

    const users = [
      {
        nombre: 'Super Admin',
        email: 'admin@ligaiberica.com',
        passwordHash: await bcrypt.hash('admin123', 10),
        rol: UserRole.SUPER_ADMIN,
      },
      {
        nombre: 'Team Admin Test',
        email: 'teamadmin@ligaiberica.com',
        passwordHash: await bcrypt.hash('team123', 10),
        rol: UserRole.TEAM_ADMIN,
      },
    ];

    await userRepository.save(users);
  }

  private async createTeams(): Promise<void> {
    this.logger.log('⚽ Creating teams...');

    const teamRepository = this.dataSource.getRepository(Team);
    const userRepository = this.dataSource.getRepository(User);

    const teamAdmin = await userRepository.findOne({
      where: { email: 'teamadmin@ligaiberica.com' },
    });

    const teams = [
      {
        nombre: 'Campeones del Fútbol Sala',
        adminId: teamAdmin?.id || null,
      },
      {
        nombre: 'Estrellas del Indoor',
        adminId: null,
      },
    ];

    await teamRepository.save(teams);
  }

  private async createClubs(): Promise<void> {
    this.logger.log('🏠 Creating clubs...');

    const clubRepository = this.dataSource.getRepository(Club);

    const clubs = [
      {
        nombre: 'Polideportivo Municipal',
        direccion: 'Calle Deporte 123',
        formatoExcel: {
          sheetName: 'Lista de Jugadores',
          title: 'Lista de Jugadores e Invitados',
          columns: [
            {
              name: 'nombre',
              header: 'Nombre Completo',
              width: 35,
              type: 'string',
            },
            {
              name: 'documento',
              header: 'Documento ID',
              width: 20,
              type: 'string',
            },
            {
              name: 'esInvitado',
              header: 'Invitado',
              width: 10,
              type: 'string',
            },
            {
              name: 'nombreInvitante',
              header: 'Invitado Por',
              width: 30,
              type: 'string',
            },
          ],
        },
      },
      {
        nombre: 'Centro Deportivo Elite',
        direccion: 'Avenida Atleta 456',
        formatoExcel: {
          sheetName: 'Participantes',
          title: 'Control de Acceso Jornada',
          columns: [
            { name: 'nombre', header: 'Nombre', width: 40 },
            { name: 'documento', header: 'DNI', width: 20 },
            { name: 'equipo', header: 'Equipo', width: 30 },
          ],
        },
      },
    ];

    await clubRepository.save(clubs);
  }

  private async createTournaments(): Promise<void> {
    this.logger.log('🏆 Creating tournaments...');

    const tournamentRepository = this.dataSource.getRepository(Tournament);

    const now = new Date();
    const startDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // +7 días
    const endDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // +90 días

    const tournaments = [
      {
        nombre: 'Liga Ibérica de Fútbol Sala 2026',
        fechaInicio: startDate,
        fechaFin: endDate,
      },
    ];

    await tournamentRepository.save(tournaments);
  }

  private async createPlayers(): Promise<void> {
    this.logger.log('👤 Creating players...');

    const playerRepository = this.dataSource.getRepository(Player);
    const teamRepository = this.dataSource.getRepository(Team);

    const teams = await teamRepository.find();

    const players = [
      // Jugadores para el primer equipo
      {
        nombre: 'Carlos Martínez',
        documento: '12345678A',
        teamId: teams[0].id,
      },
      { nombre: 'Juan Pérez', documento: '87654321B', teamId: teams[0].id },
      { nombre: 'Luis Rodríguez', documento: '45678912C', teamId: teams[0].id },
      { nombre: 'Diego López', documento: '98765432D', teamId: teams[0].id },

      // Jugadores para el segundo equipo
      { nombre: 'Antonio García', documento: '56789123E', teamId: teams[1].id },
      { nombre: 'Miguel Sánchez', documento: '23456789F', teamId: teams[1].id },
      {
        nombre: 'Javier Fernández',
        documento: '67891234G',
        teamId: teams[1].id,
      },
      { nombre: 'Pedro Martín', documento: '34567890H', teamId: teams[1].id },
    ];

    await playerRepository.save(players);
  }

  private async createMatchDays(): Promise<void> {
    this.logger.log('📅 Creating match days...');

    const matchDayRepository = this.dataSource.getRepository(MatchDay);
    const tournamentRepository = this.dataSource.getRepository(Tournament);
    const clubRepository = this.dataSource.getRepository(Club);

    const tournament = (await tournamentRepository.find())[0];
    const clubs = await clubRepository.find();

    const now = new Date();
    const matchDays = [
      // Jornada 1
      {
        fecha: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // +14 días
        tournamentId: tournament.id,
        clubId: clubs[0].id,
      },
      // Jornada 2
      {
        fecha: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000), // +21 días
        tournamentId: tournament.id,
        clubId: clubs[1].id,
      },
    ];

    await matchDayRepository.save(matchDays);
  }

  private async createGuests(): Promise<void> {
    this.logger.log('👥 Creating guests...');

    const guestRepository = this.dataSource.getRepository(GuestPerson);

    const guests = [
      {
        nombre: 'María González',
        documento: '11111111M',
        notas: 'Invitada frecuente',
      },
      {
        nombre: 'Ana Martínez',
        documento: '22222222N',
        notas: 'Familiar del jugador',
      },
      {
        nombre: 'Laura Sánchez',
        documento: '33333333P',
        notas: 'Amiga del equipo',
      },
    ];

    await guestRepository.save(guests);
  }

  private async createPlayerMatchDays(): Promise<void> {
    this.logger.log('✅ Creating player match days...');

    const playerMatchDayRepository =
      this.dataSource.getRepository(PlayerMatchDay);
    const playerRepository = this.dataSource.getRepository(Player);
    const matchDayRepository = this.dataSource.getRepository(MatchDay);
    const guestRepository = this.dataSource.getRepository(GuestPerson);

    const players = await playerRepository.find();
    const matchDays = await matchDayRepository.find();
    const guests = await guestRepository.find();

    const playerMatchDays = [
      // Jornada 1 - Primeros 4 jugadores asisten con invitados
      {
        playerId: players[0].id,
        matchDayId: matchDays[0].id,
        va: true,
        guestId: guests[0].id,
      },
      {
        playerId: players[1].id,
        matchDayId: matchDays[0].id,
        va: true,
        guestId: guests[1].id,
      },
      {
        playerId: players[2].id,
        matchDayId: matchDays[0].id,
        va: true,
        guestId: null,
      },
      {
        playerId: players[3].id,
        matchDayId: matchDays[0].id,
        va: false,
        guestId: null,
      },

      // Jornada 2 - Jugadores del segundo equipo
      {
        playerId: players[4].id,
        matchDayId: matchDays[1].id,
        va: true,
        guestId: guests[2].id,
      },
      {
        playerId: players[5].id,
        matchDayId: matchDays[1].id,
        va: true,
        guestId: null,
      },
      {
        playerId: players[6].id,
        matchDayId: matchDays[1].id,
        va: false,
        guestId: null,
      },
      {
        playerId: players[7].id,
        matchDayId: matchDays[1].id,
        va: true,
        guestId: null,
      },
    ];

    await playerMatchDayRepository.save(playerMatchDays);
  }

  private async createTournamentTeams(): Promise<void> {
    this.logger.log('🏆 Creating tournament teams...');

    const tournamentTeamRepository =
      this.dataSource.getRepository(TournamentTeam);
    const tournamentRepository = this.dataSource.getRepository(Tournament);
    const teamRepository = this.dataSource.getRepository(Team);

    const tournament = (await tournamentRepository.find())[0];
    const teams = await teamRepository.find();

    const tournamentTeams = [
      {
        tournamentId: tournament.id,
        teamId: teams[0].id,
        montoInscripcion: 500.0,
      },
      {
        tournamentId: tournament.id,
        teamId: teams[1].id,
        montoInscripcion: 500.0,
      },
    ];

    await tournamentTeamRepository.save(tournamentTeams);
  }

  private async createPayments(): Promise<void> {
    this.logger.log('💳 Creating payments...');

    const paymentRepository = this.dataSource.getRepository(Payment);
    const tournamentTeamRepository =
      this.dataSource.getRepository(TournamentTeam);

    const tournamentTeams = await tournamentTeamRepository.find();

    const payments = [
      // Pagos primer equipo (uno aprobado, uno pendiente)
      {
        tournamentTeamId: tournamentTeams[0].id,
        monto: 250.0,
        fecha: new Date(),
        metodo: PaymentMethod.TRANSFERENCIA,
        referencia: 'TRF001',
        imagen: null,
        aprobado: true,
      },
      {
        tournamentTeamId: tournamentTeams[0].id,
        monto: 250.0,
        fecha: new Date(),
        metodo: PaymentMethod.EFECTIVO,
        referencia: null,
        imagen: null,
        aprobado: false,
      },

      // Pagos segundo equipo (uno aprobado)
      {
        tournamentTeamId: tournamentTeams[1].id,
        monto: 300.0,
        fecha: new Date(),
        metodo: PaymentMethod.BINANCE,
        referencia: 'BNB001',
        imagen: null,
        aprobado: true,
      },
    ];

    await paymentRepository.save(payments);
  }
}
