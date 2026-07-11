import 'dotenv/config';
import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: ['src/modules/**/*.orm-entity.ts'],
  migrations: ['src/shared/infrastructure/persistence/migrations/*.ts'],
  synchronize: false,
  logging: ['error', 'warn'],
});
