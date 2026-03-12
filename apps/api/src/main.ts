import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder, OpenAPIObject } from '@nestjs/swagger';
import { AppModule } from './app.module';

function createSwaggerConfig(): Omit<OpenAPIObject, 'paths'> {
  return new DocumentBuilder()
    .setTitle('Liga Ibérica Portal API')
    .setDescription(
      `
## Plataforma de Gestión Integral de Torneos de Fútbol Sala

Esta API permite gestionar:
- Torneos y jornadas
- Equipos, jugadores e invitados
- Control de asistencia por jornada
- Gestión de inscripciones y pagos
- Generación de archivos Excel por sede

### Roles
- **SUPER_ADMIN**: Administrador global del sistema
- **TEAM_ADMIN**: Administrador de un equipo

### Autenticación
Todos los endpoints (excepto login) requieren JWT Bearer Token.
    `,
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Ingrese el token JWT',
        in: 'header',
      },
      'bearer',
    )
    .addSecurityRequirements('bearer')
    .addTag('auth', 'Autenticación')
    .addTag('users', 'Gestión de usuarios')
    .addTag('teams', 'Gestión de equipos')
    .addTag('players', 'Gestión de jugadores')
    .addTag('clubs', 'Gestión de sedes/clubs')
    .addTag('tournaments', 'Gestión de torneos')
    .addTag('match-days', 'Gestión de jornadas')
    .addTag('player-match-days', 'Control de asistencia')
    .addTag('tournament-teams', 'Inscripciones de equipos')
    .addTag('payments', 'Gestión de pagos')
    .addTag('guest-people', 'Gestión de invitados')
    .build();
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  app.use(
    (
      req: { headers: { authorization?: string } },
      _res: unknown,
      next: () => void,
    ) => {
      const auth = req.headers.authorization;
      if (auth && !auth.startsWith('Bearer ')) {
        req.headers.authorization = 'Bearer ' + auth;
      }
      next();
    },
  );

  const document = SwaggerModule.createDocument(app, createSwaggerConfig());
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      security: [{ bearer: [] }],
    },
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { font-size: 2.5em; }
      .swagger-ui .info .description { font-size: 1.1em; line-height: 1.6; }
    `,
    customSiteTitle: 'Liga Ibérica Portal API Docs',
  });

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`🚀 Aplicación corriendo en: http://localhost:${port}`);
  console.log(`📚 Documentación Swagger: http://localhost:${port}/api/docs`);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
