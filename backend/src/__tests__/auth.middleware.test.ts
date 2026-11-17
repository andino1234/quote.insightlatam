/** @jest-environment node */
import { requireModuleAccess } from '../middlewares/auth';

describe('requireModuleAccess', () => {
  test('permite acceso cuando el usuario tiene el módulo requerido', () => {
    const next = jest.fn();
    const req: any = {
      user: {
        userId: 1,
        role: 'EJECUTIVO',
        permissions: [{ module: 'Cotizaciones', view: true }],
      },
    };
    const res: any = {};

    requireModuleAccess('Cotizaciones')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  test('rechaza acceso cuando el usuario no tiene el módulo requerido', () => {
    const next = jest.fn();
    const req: any = {
      user: {
        userId: 1,
        role: 'EJECUTIVO',
        permissions: [{ module: 'Reportes', view: true }],
      },
    };
    const res: any = {};

    expect(() => requireModuleAccess('Cotizaciones')(req, res, next)).toThrow();
    expect(next).not.toHaveBeenCalled();
  });
});
