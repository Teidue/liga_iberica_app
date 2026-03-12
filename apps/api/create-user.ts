import { createConnection } from 'typeorm';

async function createUser() {
  const conn = await createConnection({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'tadeo123',
    database: 'postgres',
  });

  await conn.query(`CREATE USER liga_user WITH PASSWORD 'liga123';`);
  await conn.query(
    `GRANT ALL PRIVILEGES ON DATABASE liga_iberica TO liga_user;`,
  );
  await conn.query(`ALTER DATABASE liga_iberica OWNER TO liga_user;`);

  console.log('Usuario creado correctamente!');
  await conn.destroy();
}

createUser().catch(console.error);
