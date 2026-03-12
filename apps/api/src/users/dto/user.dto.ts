import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../common/enums';

export class CreateUserDto {
  @ApiProperty({
    example: 'Juan Pérez',
    description: 'Nombre completo del usuario',
  })
  @IsString()
  @MinLength(2)
  nombre!: string;

  @ApiProperty({
    example: 'juan@ejemplo.com',
    description: 'Correo electrónico',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'password123',
    description: 'Contraseña del usuario',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({
    example: 'TEAM_ADMIN',
    enum: UserRole,
    description: 'Rol del usuario',
  })
  @IsEnum(UserRole)
  rol!: UserRole;
}

export class UpdateUserDto {
  @ApiPropertyOptional({
    example: 'Juan Pérez',
    description: 'Nombre completo',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  nombre?: string;

  @ApiPropertyOptional({
    example: 'juan@ejemplo.com',
    description: 'Correo electrónico',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    example: 'nuevapassword123',
    description: 'Nueva contraseña',
  })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional({
    example: 'SUPER_ADMIN',
    enum: UserRole,
    description: 'Rol del usuario',
  })
  @IsOptional()
  @IsEnum(UserRole)
  rol?: UserRole;
}

export class LoginDto {
  @ApiProperty({
    example: 'juan@ejemplo.com',
    description: 'Correo electrónico',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'password123',
    description: 'Contraseña',
  })
  @IsString()
  password!: string;
}

export class UserResponseDto {
  @ApiProperty({
    example: 'uuid-1234-5678',
    description: 'ID único del usuario',
  })
  id!: string;

  @ApiProperty({
    example: 'Juan Pérez',
    description: 'Nombre del usuario',
  })
  nombre!: string;

  @ApiProperty({
    example: 'juan@ejemplo.com',
    description: 'Correo electrónico',
  })
  email!: string;

  @ApiProperty({
    example: 'TEAM_ADMIN',
    enum: UserRole,
    description: 'Rol del usuario',
  })
  rol!: UserRole;
}

export class AuthResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Token JWT de autenticación',
  })
  access_token!: string;

  @ApiProperty({
    description: 'Información del usuario',
  })
  user!: UserResponseDto;
}
