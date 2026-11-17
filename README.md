# Sistema de Cotizaciones (CostosApp)

Plataforma web full stack que reemplaza un modelo de costeo en Excel por un sistema multiusuario para cotizar proyectos de investigación de mercados en varios países, con tasas de cambio, precios versionados y un motor de cálculo basado en reglas configurables.

## Funcionalidades

- **Motor de cálculo puro y testeable** (`backend/src/engine`): reglas configurables (`CEIL_RATIO`, `PERCENT_OF_DAYS`, `UNIT_COST_DELTA`, `REFERENCE_SALARY`, etc.) aplicadas por fase y concepto.
- **Cotizaciones inmutables:** cada cotización guarda un snapshot de precios, tasas y reglas usadas y puede duplicarse como base de una nueva.
- **Flujo de estados:** Borrador → En revisión → Aprobada / Rechazada / Cancelada.
- **Multi-país y multi-moneda:** tasas de cambio con historial y conversión USD ↔ moneda local.
- **Mantenimientos:** países, monedas, tasas, clientes, fases, categorías, conceptos, precios por país, incentivos y configuración de equipos.
- **Resumen financiero:** totales por fase, costo interno, margen esperado, costo por muestra y por día-persona.
- **Seguridad:** JWT, contraseñas con bcrypt, control de acceso por rol (Administrador / Ejecutivo) y validación con Zod.
- **Pruebas unitarias** del motor de reglas y de los servicios de cálculo con Jest.

## Tecnologías

| Capa | Tecnología |
|------|-----------|
| Backend | Node.js, TypeScript, Express, Sequelize |
| Base de datos | MySQL |
| Validación | Zod |
| Autenticación | JWT + bcrypt |
| Frontend | React 19, TypeScript, Vite |
| Pruebas | Jest + ts-jest |

## Estructura

```text
backend/
  src/
    engine/        Motor de cálculo (reglas puras + orquestador)
    services/      Lógica de negocio
    controllers/   Controladores HTTP
    routes/        Rutas REST
    models/        Modelos Sequelize
    middlewares/   Autenticación, roles, validación y errores
    validations/   Esquemas Zod
    database/      Esquema SQL y migraciones
    __tests__/     Pruebas unitarias
frontend/
  src/             Aplicación React (cotizador, mantenimientos, dashboard)
ARQUITECTURA.md    Documento de arquitectura y modelo de datos
```

## Instalación

### Backend

```bash
cd backend
npm install
cp .env.example .env      # completa credenciales de MySQL y JWT_SECRET
npm run db:init           # crea tablas y datos iniciales
npm run dev               # http://localhost:4000
npm test                  # pruebas del motor de cálculo
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env      # VITE_API_URL=http://localhost:4000/api
npm run dev               # http://localhost:5173
```

Consulta [ARQUITECTURA.md](ARQUITECTURA.md) para el detalle del modelo de datos y del motor de cálculo.

---

## Autor

**Ariel Geovanny Andino Chinchilla** — Desarrollador Full Stack

- GitHub: [@andino1234](https://github.com/andino1234)
- Repositorio: [github.com/andino1234/quote.insightlatam](https://github.com/andino1234/quote.insightlatam)

Proyecto diseñado y desarrollado por Ariel Geovanny Andino Chinchilla para Insight LATAM. Se publica con fines de portafolio; las credenciales, datos de clientes y archivos de usuarios se excluyeron del repositorio.
