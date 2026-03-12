import { Module } from '@nestjs/common';
import { DatabaseSeederService } from './database-seeder.service';

@Module({
  providers: [DatabaseSeederService],
  exports: [DatabaseSeederService],
})
export class DatabaseModule {
  constructor(private databaseSeeder: DatabaseSeederService) {}

  async onModuleInit() {
    if (
      process.env.NODE_ENV === 'development' &&
      process.env.DB_SEED === 'true'
    ) {
      console.log('🌱 Running database seeders...');
      await this.databaseSeeder.seed();
    }
  }
}
