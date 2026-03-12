-- Configurar autenticación trust para todas las conexiones IP
ALTER SYSTEM SET listen_addresses = '*';
ALTER SYSTEM SET password_encryption = 'md5';

-- Reiniciar para aplicar cambios (se hace automáticamente)
-- Pero para desarrollo, vamos a crear un usuario que pueda conectar desde cualquier IP

-- Primero, permitir conexiones desde cualquier IP
-- Esto se maneja en pg_hba.conf, no aquí
