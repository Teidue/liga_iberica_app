import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GuestPerson } from './entities/guest-person.entity';
import { GuestPeopleService } from './guest-people.service';
import { GuestPeopleController } from './guest-people.controller';

@Module({
  imports: [TypeOrmModule.forFeature([GuestPerson])],
  controllers: [GuestPeopleController],
  providers: [GuestPeopleService],
  exports: [GuestPeopleService],
})
export class GuestPeopleModule {}
