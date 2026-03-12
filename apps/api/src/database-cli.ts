#!/usr/bin/env node

/**
 * CLI para gestión de base de datos - Liga Ibérica Portal
 *
 * Uso:
 * npm run db:setup          - Configura base de datos y ejecuta migraciones iniciales
 * npm run db:seed           - Ejecuta el seeder de datos
 * npm run db:reset          - Limpia y reestructura toda la base de datos
 * npm run migration:generate <name> - Genera nueva migración
 * npm run migration:run     - Ejecuta migraciones pendientes
 * npm run migration:revert  - Revierte última migración
 */

import { AppDataSource } from './data-source';
import { DatabaseSeederService } from './database/database-seeder.service';

const command = process.argv[2];

async function main() {
  console.log('🔧 Liga Ibérica Portal - Database Management CLI');
  console.log('==================================================');

  try {
    switch (command) {
      case 'setup':
        await setupDatabase();
        break;
      case 'seed':
        await seedDatabase();
        break;
      case 'reset':
        await resetDatabase();
        break;
      case 'migrate':
        await runMigrations();
        break;
      default:
        showHelp();
    }
  } catch (error) {
    console.error(
      '❌ Error:',
      error instanceof Error ? error.message : String(error),
    );
    process.exit(1);
  }
}

async function setupDatabase() {
  console.log('🚀 Setting up database...');

  try {
    // Initialize database connection
    await AppDataSource.initialize();
    console.log('✅ Database connection established');

    // Run migrations
    await AppDataSource.runMigrations();
    console.log('✅ Migrations completed');

    // Close connection
    await AppDataSource.destroy();
    console.log('✅ Database setup completed successfully!');
  } catch (error) {
    console.error('❌ Setup failed:', error);
    throw error;
  }
}

async function seedDatabase() {
  console.log('🌱 Seeding database...');

  try {
    // Initialize database connection
    await AppDataSource.initialize();

    // Run seeder
    const seeder = new DatabaseSeederService(AppDataSource);
    await seeder.seed();

    // Close connection
    await AppDataSource.destroy();
    console.log('✅ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

async function resetDatabase() {
  console.log('🔄 Resetting database...');

  try {
    // Initialize database connection
    await AppDataSource.initialize();
    console.log('✅ Database connection established');

    // Drop database
    await AppDataSource.dropDatabase();
    console.log('🗑️  Database dropped');

    // Run migrations
    await AppDataSource.runMigrations();
    console.log('✅ Migrations completed');

    // Seed data
    const seeder = new DatabaseSeederService(AppDataSource);
    await seeder.seed();
    console.log('🌱 Data seeded');

    // Close connection
    await AppDataSource.destroy();
    console.log('✅ Database reset completed successfully!');
  } catch (error) {
    console.error('❌ Reset failed:', error);
    throw error;
  }
}

async function runMigrations() {
  console.log('🔄 Running migrations...');

  try {
    // Initialize database connection
    await AppDataSource.initialize();

    // Run migrations
    await AppDataSource.runMigrations();
    console.log('✅ Migrations completed');

    // Close connection
    await AppDataSource.destroy();
    console.log('✅ Migration process completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

function showHelp() {
  console.log(`
Available commands:

  setup           - Setup database with initial schema
  seed            - Seed database with initial data
  reset           - Drop, recreate and seed database
  migrate         - Run pending migrations

Examples:
  npm run db:setup
  npm run db:seed
  npm run db:reset
  npm run db:migrate

Environment variables required:
  - DATABASE_URL: PostgreSQL connection string
  - NODE_ENV: Environment (development/production)
`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
