import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { User } from '../users/entities/user.entity';
import { Team } from '../teams/entities/team.entity';
import { Player } from '../players/entities/player.entity';
import { Club } from '../clubs/entities/club.entity';
import { Tournament } from '../tournaments/entities/tournament.entity';
import { MatchDay } from '../match-days/entities/match-day.entity';
import { TournamentTeam } from '../tournament-teams/entities/tournament-team.entity';
import { Payment } from '../payments/entities/payment.entity';
import { GuestPerson } from '../guest-people/entities/guest-person.entity';
import { PlayerMatchDay } from '../player-match-days/entities/player-match-day.entity';
import { UserRole, PaymentMethod, PaymentStatus } from '../common/enums';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(Team) private teamsRepo: Repository<Team>,
    @InjectRepository(Player) private playersRepo: Repository<Player>,
    @InjectRepository(Club) private clubsRepo: Repository<Club>,
    @InjectRepository(Tournament) private tournamentsRepo: Repository<Tournament>,
    @InjectRepository(MatchDay) private matchDaysRepo: Repository<MatchDay>,
    @InjectRepository(TournamentTeam) private tournamentTeamsRepo: Repository<TournamentTeam>,
    @InjectRepository(Payment) private paymentsRepo: Repository<Payment>,
    @InjectRepository(GuestPerson) private guestsRepo: Repository<GuestPerson>,
    @InjectRepository(PlayerMatchDay) private pmdRepo: Repository<PlayerMatchDay>,
  ) {}

  async onApplicationBootstrap() {
    if (process.env.NODE_ENV === 'production') return;

    const existingUsers = await this.usersRepo.count();
    if (existingUsers > 0) return;

    this.logger.log('🌱 Base de datos vacía — iniciando seed...');
    await this.seed();
    this.logger.log('✅ Seed completado correctamente');
  }

  private daysFromNow(n: number): Date {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d;
  }

  private async seed() {
    const hash = await bcrypt.hash('admin123', 10);

    // ── Usuarios ─────────────────────────────────────────────────────────────
    // admin@liga.com  — Super Admin
    // carlos@liga.com — TEAM_ADMIN, gestiona Los Tigres
    // ana@liga.com    — TEAM_ADMIN, gestiona Los Leones
    // pedro@liga.com  — TEAM_ADMIN, gestiona Los Halcones
    // laura@liga.com  — TEAM_ADMIN, sin equipo asignado (para probar creación)
    const [, savedCarlos, savedAna, savedPedro] = await this.usersRepo.save([
      this.usersRepo.create({ nombre: 'Super Admin',    email: 'admin@liga.com',  passwordHash: hash, rol: UserRole.SUPER_ADMIN }),
      this.usersRepo.create({ nombre: 'Carlos Mendoza', email: 'carlos@liga.com', passwordHash: hash, rol: UserRole.TEAM_ADMIN  }),
      this.usersRepo.create({ nombre: 'Ana Jiménez',    email: 'ana@liga.com',    passwordHash: hash, rol: UserRole.TEAM_ADMIN  }),
      this.usersRepo.create({ nombre: 'Pedro Ramírez',  email: 'pedro@liga.com',  passwordHash: hash, rol: UserRole.TEAM_ADMIN  }),
      this.usersRepo.create({ nombre: 'Laura Vázquez',  email: 'laura@liga.com',  passwordHash: hash, rol: UserRole.TEAM_ADMIN  }),
    ]);

    // ── Clubes ───────────────────────────────────────────────────────────────
    const [savedClub1, savedClub2] = await this.clubsRepo.save([
      this.clubsRepo.create({
        nombre: 'Pabellón Municipal Centro',
        direccion: 'Calle Mayor 12, Madrid',
        formatoExcel: {
          sheetName: 'Control Jornada',
          title: 'Lista de Asistencia — Liga Ibérica',
          columns: [
            { name: 'nombre',          header: 'Nombre Completo', width: 35, type: 'string' },
            { name: 'documento',       header: 'DNI / NIE',       width: 20, type: 'string' },
            { name: 'esInvitado',      header: 'Tipo',            width: 15, type: 'string' },
            { name: 'nombreInvitante', header: 'Invitado por',    width: 30, type: 'string' },
          ],
        },
      }),
      this.clubsRepo.create({
        nombre: 'Polideportivo Norte',
        direccion: 'Av. de la Paz 45, Madrid',
        formatoExcel: {
          sheetName: 'Asistencia',
          title: 'Relación de Jugadores',
          columns: [
            { name: 'nombre',     header: 'Nombre',      width: 40, type: 'string' },
            { name: 'documento',  header: 'Documento',   width: 25, type: 'string' },
            { name: 'esInvitado', header: '¿Invitado?',  width: 12, type: 'string' },
          ],
        },
      }),
    ]);

    // ── Torneos ──────────────────────────────────────────────────────────────
    // Clausura 2024  — pasado (lista de torneos históricos del admin)
    // Apertura 2025  — activo (en curso)
    // Clausura 2025  — próximo (inscripciones abiertas)
    const [, savedT2, savedT3] = await this.tournamentsRepo.save([
      this.tournamentsRepo.create({
        nombre: 'Torneo Clausura 2024',
        montoInscripcion: 150,
        fechaInicio: this.daysFromNow(-120),
        fechaFin:    this.daysFromNow(-60),
      }),
      this.tournamentsRepo.create({
        nombre: 'Torneo Apertura 2025',
        montoInscripcion: 200,
        fechaInicio: this.daysFromNow(-30),
        fechaFin:    this.daysFromNow(30),
      }),
      this.tournamentsRepo.create({
        nombre: 'Torneo Clausura 2025',
        montoInscripcion: 250,
        fechaInicio: this.daysFromNow(60),
        fechaFin:    this.daysFromNow(90),
      }),
    ]);

    // ── Equipos ──────────────────────────────────────────────────────────────
    const [savedTeam1, savedTeam2, savedTeam3] = await this.teamsRepo.save([
      this.teamsRepo.create({ nombre: 'Los Tigres',   adminId: savedCarlos.id }),
      this.teamsRepo.create({ nombre: 'Los Leones',   adminId: savedAna.id    }),
      this.teamsRepo.create({ nombre: 'Los Halcones', adminId: savedPedro.id  }),
    ]);

    // ── Jugadores ────────────────────────────────────────────────────────────
    // Los Tigres — 10 jugadores activos
    const savedTigres = await this.playersRepo.save([
      { nombre: 'Miguel Torres Pérez',    documento: 'V1234567', estado: true  },
      { nombre: 'David García López',     documento: 'V2345678', estado: true  },
      { nombre: 'Sergio López Martín',    documento: 'V3456789', estado: true  },
      { nombre: 'Rubén Martín Díaz',      documento: 'V4567890', estado: true  },
      { nombre: 'Iván Sánchez Ruiz',      documento: 'V5678901', estado: true  },
      { nombre: 'Pablo Fernández Gil',    documento: 'V6789012', estado: true  },
      { nombre: 'Alejandro Ruiz Mora',    documento: 'V7890123', estado: true  },
      { nombre: 'Marcos Díaz Castro',     documento: 'V8901234', estado: true  },
      { nombre: 'Nicolás Pereira Santos', documento: 'V9012345', estado: true  },
      { nombre: 'Kevin Blanco Torres',    documento: 'V0123456', estado: true  },
    ].map(p => this.playersRepo.create({ ...p, teamId: savedTeam1.id })));

    // Los Leones — 9 activos + 1 inactivo (para probar filtrado por estado)
    const savedLeones = await this.playersRepo.save([
      { nombre: 'Antonio Moreno Vega',   documento: 'V9012346', estado: true  },
      { nombre: 'Fernando Álvarez Cruz', documento: 'V1234569', estado: true  },
      { nombre: 'Javier Romero León',    documento: 'V2345670', estado: true  },
      { nombre: 'Luis Herrero Blanco',   documento: 'V3456781', estado: true  },
      { nombre: 'Oscar Jiménez Ríos',    documento: 'V4567892', estado: true  },
      { nombre: 'Raúl Muñoz Peña',       documento: 'V5678903', estado: true  },
      { nombre: 'Diego Navarro Sosa',    documento: 'V6789014', estado: true  },
      { nombre: 'Adrián Ramos Flores',   documento: 'V7890125', estado: true  },
      { nombre: 'Manuel Castro Reyes',   documento: 'V8901236', estado: false }, // baja temporal
      { nombre: 'Tomás Vargas Heredia',  documento: 'V9012347', estado: true  },
    ].map(p => this.playersRepo.create({ ...p, teamId: savedTeam2.id })));

    // Los Halcones — 8 jugadores activos (mínimo reglamentario)
    await this.playersRepo.save([
      { nombre: 'Cristian Silva Mora',    documento: 'V1122334', estado: true },
      { nombre: 'Emilio Guzmán Peña',     documento: 'V2233445', estado: true },
      { nombre: 'Héctor Flores Vega',     documento: 'V3344556', estado: true },
      { nombre: 'Rodrigo Mendoza Cruz',   documento: 'V4455667', estado: true },
      { nombre: 'Andrés Castillo Ruiz',   documento: 'V5566778', estado: true },
      { nombre: 'Leonardo Herrera Lagos', documento: 'V6677889', estado: true },
      { nombre: 'Sebastián Ortiz Paz',    documento: 'V7788990', estado: true },
      { nombre: 'Mateo Guerrero Villa',   documento: 'V8899001', estado: true },
    ].map(p => this.playersRepo.create({ ...p, teamId: savedTeam3.id })));

    // ── Jornadas ─────────────────────────────────────────────────────────────
    // Apertura 2025: 2 pasadas+cerradas, 3 próximas
    // Clausura 2025: 2 jornadas futuras
    const savedMatchDays = await this.matchDaysRepo.save([
      this.matchDaysRepo.create({ fecha: this.daysFromNow(-21), tournamentId: savedT2.id, clubId: savedClub1.id, cerrado: true  }),
      this.matchDaysRepo.create({ fecha: this.daysFromNow(-7),  tournamentId: savedT2.id, clubId: savedClub2.id, cerrado: true  }),
      this.matchDaysRepo.create({ fecha: this.daysFromNow(7),   tournamentId: savedT2.id, clubId: savedClub1.id, cerrado: false }),
      this.matchDaysRepo.create({ fecha: this.daysFromNow(21),  tournamentId: savedT2.id, clubId: savedClub2.id, cerrado: false }),
      this.matchDaysRepo.create({ fecha: this.daysFromNow(35),  tournamentId: savedT2.id, clubId: savedClub1.id, cerrado: false }),
      this.matchDaysRepo.create({ fecha: this.daysFromNow(65),  tournamentId: savedT3.id, clubId: savedClub1.id, cerrado: false }),
      this.matchDaysRepo.create({ fecha: this.daysFromNow(80),  tournamentId: savedT3.id, clubId: savedClub2.id, cerrado: false }),
    ]);
    const [savedMD1, savedMD2] = savedMatchDays;

    // ── Inscripciones ────────────────────────────────────────────────────────
    const [savedIns1, savedIns2, savedIns3] = await this.tournamentTeamsRepo.save([
      this.tournamentTeamsRepo.create({ tournamentId: savedT2.id, teamId: savedTeam1.id, montoInscripcion: 200 }), // Tigres → Apertura
      this.tournamentTeamsRepo.create({ tournamentId: savedT2.id, teamId: savedTeam2.id, montoInscripcion: 200 }), // Leones → Apertura
      this.tournamentTeamsRepo.create({ tournamentId: savedT3.id, teamId: savedTeam3.id, montoInscripcion: 250 }), // Halcones → Clausura
    ]);

    // ── Pagos ────────────────────────────────────────────────────────────────
    // Los Tigres / Apertura:  80 aprobado + 80 aprobado + 40 pendiente
    // Los Leones / Apertura:  70 aprobado + 80 rechazado + 50 pendiente
    // Los Halcones / Clausura: 125 pendiente
    // Cubre los 3 estados (approved/rejected/pending) y los 5 métodos de pago
    await this.paymentsRepo.save([
      this.paymentsRepo.create({ tournamentTeamId: savedIns1.id, monto: 80,  fecha: this.daysFromNow(-25), metodo: PaymentMethod.TRANSFERENCIA, referencia: 'TRF-001-2025', imagen: null, aprobado: true,  status: PaymentStatus.APPROVED }),
      this.paymentsRepo.create({ tournamentTeamId: savedIns1.id, monto: 80,  fecha: this.daysFromNow(-18), metodo: PaymentMethod.BINANCE,       referencia: 'BIN-002-2025', imagen: null, aprobado: true,  status: PaymentStatus.APPROVED }),
      this.paymentsRepo.create({ tournamentTeamId: savedIns1.id, monto: 40,  fecha: this.daysFromNow(-3),  metodo: PaymentMethod.ZINLI,         referencia: 'ZIN-003-2025', imagen: null, aprobado: false, status: PaymentStatus.PENDING  }),
      this.paymentsRepo.create({ tournamentTeamId: savedIns2.id, monto: 70,  fecha: this.daysFromNow(-28), metodo: PaymentMethod.EFECTIVO,      referencia: null,            imagen: null, aprobado: true,  status: PaymentStatus.APPROVED }),
      this.paymentsRepo.create({ tournamentTeamId: savedIns2.id, monto: 80,  fecha: this.daysFromNow(-20), metodo: PaymentMethod.BINANCE,       referencia: 'BIN-005-2025', imagen: null, aprobado: false, status: PaymentStatus.REJECTED }),
      this.paymentsRepo.create({ tournamentTeamId: savedIns2.id, monto: 50,  fecha: this.daysFromNow(-5),  metodo: PaymentMethod.TRANSFERENCIA, referencia: 'TRF-006-2025', imagen: null, aprobado: false, status: PaymentStatus.PENDING  }),
      this.paymentsRepo.create({ tournamentTeamId: savedIns3.id, monto: 125, fecha: this.daysFromNow(-2),  metodo: PaymentMethod.OTRO,          referencia: null,            imagen: null, aprobado: false, status: PaymentStatus.PENDING  }),
    ]);

    // ── Invitados ────────────────────────────────────────────────────────────
    const [savedRoberto, savedFelipe, savedNicolasG, savedCarmen] =
      await this.guestsRepo.save([
        this.guestsRepo.create({ nombre: 'Roberto Jiménez Soto', documento: 'V9988776', notas: null }),
        this.guestsRepo.create({ nombre: 'Felipe Castillo Vera', documento: 'V8877665', notas: null }),
        this.guestsRepo.create({ nombre: 'Nicolás Blanco Pinto', documento: 'V7766554', notas: null }),
        this.guestsRepo.create({ nombre: 'Carmen Delgado Ruiz',  documento: 'E5544332', notas: 'Hermana de Adrián Ramos' }),
      ]);

    // ── Asistencia (solo jornadas cerradas) ──────────────────────────────────
    const [t0, t1, t2, t3, t4, t5, t6, t7, t8, t9] = savedTigres;
    const [l0, l1, l2, l3, l4, l5, l6, l7, , l9]   = savedLeones; // l8 inactivo — no se registra

    // Jornada 1 (−21 días) — Los Tigres: 8 asisten, 2 faltan; Roberto y Nicolás invitados
    await this.pmdRepo.save([
      this.pmdRepo.create({ playerId: t0.id, matchDayId: savedMD1.id, va: true,  guestId: null             }),
      this.pmdRepo.create({ playerId: t1.id, matchDayId: savedMD1.id, va: true,  guestId: null             }),
      this.pmdRepo.create({ playerId: t2.id, matchDayId: savedMD1.id, va: true,  guestId: null             }),
      this.pmdRepo.create({ playerId: t3.id, matchDayId: savedMD1.id, va: true,  guestId: null             }),
      this.pmdRepo.create({ playerId: t4.id, matchDayId: savedMD1.id, va: true,  guestId: null             }),
      this.pmdRepo.create({ playerId: t5.id, matchDayId: savedMD1.id, va: true,  guestId: null             }),
      this.pmdRepo.create({ playerId: t6.id, matchDayId: savedMD1.id, va: true,  guestId: null             }),
      this.pmdRepo.create({ playerId: t7.id, matchDayId: savedMD1.id, va: false, guestId: null             }),
      this.pmdRepo.create({ playerId: t8.id, matchDayId: savedMD1.id, va: true,  guestId: savedRoberto.id  }),
      this.pmdRepo.create({ playerId: t9.id, matchDayId: savedMD1.id, va: false, guestId: null             }),
    ]);

    // Jornada 1 (−21 días) — Los Leones: 7 asisten, 2 faltan; Carmen invitada
    await this.pmdRepo.save([
      this.pmdRepo.create({ playerId: l0.id, matchDayId: savedMD1.id, va: true,  guestId: null            }),
      this.pmdRepo.create({ playerId: l1.id, matchDayId: savedMD1.id, va: true,  guestId: null            }),
      this.pmdRepo.create({ playerId: l2.id, matchDayId: savedMD1.id, va: false, guestId: null            }),
      this.pmdRepo.create({ playerId: l3.id, matchDayId: savedMD1.id, va: true,  guestId: null            }),
      this.pmdRepo.create({ playerId: l4.id, matchDayId: savedMD1.id, va: true,  guestId: null            }),
      this.pmdRepo.create({ playerId: l5.id, matchDayId: savedMD1.id, va: true,  guestId: null            }),
      this.pmdRepo.create({ playerId: l6.id, matchDayId: savedMD1.id, va: false, guestId: null            }),
      this.pmdRepo.create({ playerId: l7.id, matchDayId: savedMD1.id, va: true,  guestId: savedCarmen.id  }),
      this.pmdRepo.create({ playerId: l9.id, matchDayId: savedMD1.id, va: true,  guestId: null            }),
    ]);

    // Jornada 2 (−7 días) — Los Tigres: 9 asisten, 1 falta; Felipe y Nicolás (invitado) traídos
    await this.pmdRepo.save([
      this.pmdRepo.create({ playerId: t0.id, matchDayId: savedMD2.id, va: true,  guestId: null             }),
      this.pmdRepo.create({ playerId: t1.id, matchDayId: savedMD2.id, va: true,  guestId: null             }),
      this.pmdRepo.create({ playerId: t2.id, matchDayId: savedMD2.id, va: true,  guestId: savedFelipe.id   }),
      this.pmdRepo.create({ playerId: t3.id, matchDayId: savedMD2.id, va: true,  guestId: null             }),
      this.pmdRepo.create({ playerId: t4.id, matchDayId: savedMD2.id, va: false, guestId: null             }),
      this.pmdRepo.create({ playerId: t5.id, matchDayId: savedMD2.id, va: true,  guestId: null             }),
      this.pmdRepo.create({ playerId: t6.id, matchDayId: savedMD2.id, va: true,  guestId: null             }),
      this.pmdRepo.create({ playerId: t7.id, matchDayId: savedMD2.id, va: true,  guestId: null             }),
      this.pmdRepo.create({ playerId: t8.id, matchDayId: savedMD2.id, va: true,  guestId: null             }),
      this.pmdRepo.create({ playerId: t9.id, matchDayId: savedMD2.id, va: true,  guestId: savedNicolasG.id }),
    ]);

    // Jornada 2 (−7 días) — Los Leones: 8 asisten, 1 falta
    await this.pmdRepo.save([
      this.pmdRepo.create({ playerId: l0.id, matchDayId: savedMD2.id, va: true,  guestId: null }),
      this.pmdRepo.create({ playerId: l1.id, matchDayId: savedMD2.id, va: false, guestId: null }),
      this.pmdRepo.create({ playerId: l2.id, matchDayId: savedMD2.id, va: true,  guestId: null }),
      this.pmdRepo.create({ playerId: l3.id, matchDayId: savedMD2.id, va: true,  guestId: null }),
      this.pmdRepo.create({ playerId: l4.id, matchDayId: savedMD2.id, va: true,  guestId: null }),
      this.pmdRepo.create({ playerId: l5.id, matchDayId: savedMD2.id, va: true,  guestId: null }),
      this.pmdRepo.create({ playerId: l6.id, matchDayId: savedMD2.id, va: true,  guestId: null }),
      this.pmdRepo.create({ playerId: l7.id, matchDayId: savedMD2.id, va: true,  guestId: null }),
      this.pmdRepo.create({ playerId: l9.id, matchDayId: savedMD2.id, va: false, guestId: null }),
    ]);
  }
}
