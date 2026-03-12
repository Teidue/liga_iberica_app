-- Script de inicialización para la base de datos de Liga Ibérica Portal

-- Crear usuario si no existe y configurar contraseña
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'liga_user') THEN
        CREATE USER liga_user WITH PASSWORD 'liga_password';
    END IF;
END
$$;

-- Dar permisos
ALTER USER liga_user WITH SUPERUSER;

-- Crear base de datos
SELECT 'CREATE DATABASE liga_iberica'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'liga_iberica')\gexec

-- Conectar a la base de datos y dar permisos
GRANT ALL PRIVILEGES ON DATABASE liga_iberica TO liga_user;

-- Conectar y dar permisos en el schema public
\c liga_iberica

GRANT ALL ON SCHEMA public TO liga_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO liga_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO liga_user;

-- Configurar autenticación trust para desarrollo (esto se maneja en pg_hba.conf)

DO $$
BEGIN
    RAISE NOTICE 'Configuracion de desarrollo completada';
END $$;
