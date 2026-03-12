import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInitialSchema1234567890123 implements MigrationInterface {
  name = 'CreateInitialSchema1234567890123';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "nombre" character varying(255) NOT NULL,
        "email" character varying(255) NOT NULL,
        "passwordHash" character varying(255) NOT NULL,
        "rol" character varying NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

    // Create clubs table
    await queryRunner.query(`
      CREATE TABLE "clubs" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "nombre" character varying(255) NOT NULL,
        "direccion" character varying(255),
        "formatoExcel" jsonb,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_clubs" PRIMARY KEY ("id")
      )
    `);

    // Create tournaments table
    await queryRunner.query(`
      CREATE TABLE "tournaments" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "nombre" character varying(255) NOT NULL,
        "fechaInicio" date NOT NULL,
        "fechaFin" date NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tournaments" PRIMARY KEY ("id")
      )
    `);

    // Create teams table
    await queryRunner.query(`
      CREATE TABLE "teams" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "nombre" character varying(255) NOT NULL,
        "adminId" character varying(36),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_teams" PRIMARY KEY ("id")
      )
    `);

    // Create players table
    await queryRunner.query(`
      CREATE TABLE "players" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "teamId" character varying(36) NOT NULL,
        "nombre" character varying(255) NOT NULL,
        "documento" character varying(255) NOT NULL,
        "estado" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_players" PRIMARY KEY ("id")
      )
    `);

    // Create guest_people table
    await queryRunner.query(`
      CREATE TABLE "guest_people" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "nombre" character varying(255) NOT NULL,
        "documento" character varying(255) NOT NULL,
        "notas" text,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_guest_people_documento" UNIQUE ("documento"),
        CONSTRAINT "PK_guest_people" PRIMARY KEY ("id")
      )
    `);

    // Create tournament_teams table
    await queryRunner.query(`
      CREATE TABLE "tournament_teams" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tournamentId" character varying(36) NOT NULL,
        "teamId" character varying(36) NOT NULL,
        "montoInscripcion" numeric(10,2) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_tournament_teams_tournamentId_teamId" UNIQUE ("tournamentId", "teamId"),
        CONSTRAINT "PK_tournament_teams" PRIMARY KEY ("id")
      )
    `);

    // Create match_days table
    await queryRunner.query(`
      CREATE TABLE "match_days" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "fecha" TIMESTAMP NOT NULL,
        "tournamentId" character varying(36) NOT NULL,
        "clubId" character varying(36) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_match_days" PRIMARY KEY ("id")
      )
    `);

    // Create player_match_days table
    await queryRunner.query(`
      CREATE TABLE "player_match_days" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "playerId" character varying(36) NOT NULL,
        "matchDayId" character varying(36) NOT NULL,
        "va" boolean NOT NULL,
        "guestId" character varying(36),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_player_match_days_playerId_matchDayId" UNIQUE ("playerId", "matchDayId"),
        CONSTRAINT "PK_player_match_days" PRIMARY KEY ("id")
      )
    `);

    // Create payments table
    await queryRunner.query(`
      CREATE TABLE "payments" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tournamentTeamId" character varying(36) NOT NULL,
        "monto" numeric(10,2) NOT NULL,
        "fecha" TIMESTAMP NOT NULL,
        "metodo" character varying NOT NULL,
        "referencia" character varying(255),
        "imagen" character varying(255),
        "aprobado" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_payments" PRIMARY KEY ("id")
      )
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "teams" ADD CONSTRAINT "FK_teams_adminId" 
      FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "players" ADD CONSTRAINT "FK_players_teamId" 
      FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "tournament_teams" ADD CONSTRAINT "FK_tournament_teams_tournamentId" 
      FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "tournament_teams" ADD CONSTRAINT "FK_tournament_teams_teamId" 
      FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "match_days" ADD CONSTRAINT "FK_match_days_tournamentId" 
      FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "match_days" ADD CONSTRAINT "FK_match_days_clubId" 
      FOREIGN KEY ("clubId") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "player_match_days" ADD CONSTRAINT "FK_player_match_days_playerId" 
      FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "player_match_days" ADD CONSTRAINT "FK_player_match_days_matchDayId" 
      FOREIGN KEY ("matchDayId") REFERENCES "match_days"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "player_match_days" ADD CONSTRAINT "FK_player_match_days_guestId" 
      FOREIGN KEY ("guestId") REFERENCES "guest_people"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "payments" ADD CONSTRAINT "FK_payments_tournamentTeamId" 
      FOREIGN KEY ("tournamentTeamId") REFERENCES "tournament_teams"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // Create indexes for better performance
    await queryRunner.query(
      `CREATE INDEX "IDX_players_teamId" ON "players" ("teamId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_tournament_teams_tournamentId" ON "tournament_teams" ("tournamentId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_tournament_teams_teamId" ON "tournament_teams" ("teamId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_match_days_tournamentId" ON "match_days" ("tournamentId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_match_days_clubId" ON "match_days" ("clubId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_player_match_days_playerId" ON "player_match_days" ("playerId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_player_match_days_matchDayId" ON "player_match_days" ("matchDayId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_payments_tournamentTeamId" ON "payments" ("tournamentTeamId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order due to foreign key constraints
    await queryRunner.query(`DROP TABLE "payments"`);
    await queryRunner.query(`DROP TABLE "player_match_days"`);
    await queryRunner.query(`DROP TABLE "match_days"`);
    await queryRunner.query(`DROP TABLE "tournament_teams"`);
    await queryRunner.query(`DROP TABLE "guest_people"`);
    await queryRunner.query(`DROP TABLE "players"`);
    await queryRunner.query(`DROP TABLE "teams"`);
    await queryRunner.query(`DROP TABLE "tournaments"`);
    await queryRunner.query(`DROP TABLE "clubs"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
