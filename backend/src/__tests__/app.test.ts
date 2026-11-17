import { AddressInfo } from 'net';
import { app } from '../app';

describe('API root', () => {
  test('GET / responde con información de la API', async () => {
    const server = app.listen(0);
    const { port } = server.address() as AddressInfo;

    try {
      const response = await fetch(`http://127.0.0.1:${port}/`);
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toMatchObject({
        status: 'ok',
        message: expect.stringContaining('CostosApp'),
      });
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    }
  });
});
