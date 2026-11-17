import dotenv from 'dotenv';

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Falta la variable de entorno requerida: ${name}`);
  }
  return value;
}

const defaultCorsOrigins = ['http://localhost:5173', 'http://quote.insightlatam.com', 'https://quote.insightlatam.com'];
const corsOriginValue = process.env.CORS_ORIGIN ?? defaultCorsOrigins.join(',');

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  db: {
    host: required('DB_HOST', 'localhost'),
    port: Number(process.env.DB_PORT ?? 3306),
    name: required('DB_NAME', 'costosapp'),
    user: required('DB_USER', 'root'),
    password: process.env.DB_PASSWORD ?? '',
  },
  jwt: {
    secret: required('JWT_SECRET', 'dev-secret-change-me'),
    expiresIn: process.env.JWT_EXPIRES_IN ?? '8h',
  },
  corsOrigin: corsOriginValue
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
};
