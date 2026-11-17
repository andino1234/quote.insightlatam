/**
 * Sistema de Cotizaciones — arranque del servidor API.
 *
 * @author Ariel Geovanny Andino Chinchilla
 * @see    https://github.com/andino1234
 */
import { app } from './app';
import { env } from './config/env';
import { sequelize } from './config/database';
import './models';

async function start() {
  try {
    await sequelize.authenticate();
    // eslint-disable-next-line no-console
    console.log('Conexión a MySQL establecida correctamente.');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('No fue posible conectar a MySQL:', error);
    process.exit(1);
  }

  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`API de cotizaciones escuchando en el puerto ${env.port}`);
  });
}

start();
