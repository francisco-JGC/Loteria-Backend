import * as Joi from 'joi';

export interface AppConfig {
  nodeEnv: 'development' | 'test' | 'production';
  port: number;
  database: {
    host: string;
    port: number;
    user: string;
    password: string;
    name: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
    refreshExpiresIn: string;
  };
}

export const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().integer().default(3000),
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().integer().default(5432),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),
  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.string().default('24h'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('30d'),
});

export const envLoader = (): AppConfig => ({
  nodeEnv: process.env.NODE_ENV as AppConfig['nodeEnv'],
  port: Number(process.env.PORT),
  database: {
    host: process.env.DB_HOST!,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    name: process.env.DB_NAME!,
  },
  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: process.env.JWT_EXPIRES_IN ?? '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '30d',
  },
});
