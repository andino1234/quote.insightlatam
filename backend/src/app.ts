/**
 * Sistema de Cotizaciones — configuración de Express.
 *
 * @author Ariel Geovanny Andino Chinchilla
 * @see    https://github.com/andino1234
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import routes from './routes';
import { errorHandler } from './middlewares/errorHandler';

export const app = express();

const allowedOrigins = env.corsOrigin;

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin not allowed by CORS: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'CostosApp API funcionando correctamente.',
    endpoints: {
      health: '/health',
      api: '/api',
    },
  });
});

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api', routes);

app.use(errorHandler);
