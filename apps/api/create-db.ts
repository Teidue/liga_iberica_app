import { createConnection } from 'typeorm';

async function createDatabase() {
  const conn = await createConnection({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'tadeo123',
    database: 'postgres',
  });

  await conn.query('CREATE DATABASE liga_iberica');
  console.log('Base de datos creada!');
  await conn.destroy();
}

createDatabase().catch(console.error);
