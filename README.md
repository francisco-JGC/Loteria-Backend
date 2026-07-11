# Loteria Backend

API del sistema de lotería. **NestJS + TypeORM + PostgreSQL** con arquitectura **hexagonal + DDD**.

## Requisitos

- Node.js 20+ (probado en 26)
- Docker + Docker Compose (para PostgreSQL)

## Puesta en marcha

```bash
# 1. Instalar deps
npm install

# 2. Copiar variables de entorno
cp .env.example .env

# 3. Levantar PostgreSQL
docker compose up -d postgres

# 4. Correr la app en modo dev (watch)
npm run start:dev
```

La API queda expuesta en `http://localhost:3000/api`.

## Arquitectura

Sigo **hexagonal + DDD**. Tres capas por *bounded context*:

- **`domain/`** — reglas puras. Entities, Value Objects, agregados, interfaces de repositorio (ports), eventos de dominio, errors del dominio. **No importa nada de Nest/TypeORM/HTTP**.
- **`application/`** — orquesta el dominio. Use cases (uno por acción de negocio), DTOs de entrada/salida, ports para servicios externos. Depende **solo de `domain/`**.
- **`infrastructure/`** — implementa los ports. Adaptadores concretos: TypeORM entities + repositorios, controllers HTTP, mappers, gateways externos.

Regla de dependencia:

```
infrastructure ──▶ application ──▶ domain
```

Nada apunta hacia `infrastructure`. El dominio es puro.

## Estructura de carpetas

```
src/
├── main.ts                                 # bootstrap, ValidationPipe global, prefix /api
├── app.module.ts                           # raíz — carga ConfigModule + DatabaseModule
│
├── shared/                                 # código común a todos los bounded contexts
│   ├── domain/
│   │   ├── entity.ts                       # base para entidades con identidad
│   │   ├── aggregate-root.ts               # entity + domain events
│   │   ├── value-object.ts                 # objetos por valor inmutables
│   │   ├── domain-event.ts                 # base para eventos
│   │   └── errors/domain.error.ts          # errores del dominio (NotFoundError, ValidationError…)
│   ├── application/
│   │   └── use-case.ts                     # interface UseCase<In, Out>
│   └── infrastructure/
│       ├── config/env.config.ts            # variables de entorno + validación Joi
│       └── persistence/database.module.ts  # TypeORM async config
│
└── modules/                                # un módulo por bounded context (aún vacío)
    └── <context>/
        ├── domain/
        │   ├── entities/
        │   ├── value-objects/
        │   ├── events/
        │   └── repositories/               # interfaces (ports)
        ├── application/
        │   ├── use-cases/                  # uno por acción de negocio
        │   ├── dtos/
        │   └── ports/                      # otras interfaces (email, gateway, etc.)
        ├── infrastructure/
        │   ├── persistence/
        │   │   ├── entities/               # @Entity de TypeORM
        │   │   ├── mappers/                # dominio ↔ TypeORM
        │   │   └── repositories/           # implementación del port de domain
        │   └── http/
        │       ├── controllers/
        │       └── dtos/                   # class-validator DTOs
        └── <context>.module.ts             # DI: bindea ports a implementaciones
```

## Convenciones

- **Cada bounded context tiene su propio módulo Nest** — se importa desde `AppModule`.
- **Los repositorios se declaran como interfaces en `domain/`** y se implementan en `infrastructure/`. En el `<context>.module.ts` se hace el binding con `useClass`:
  ```ts
  {
    provide: TICKETS_REPOSITORY,
    useClass: TypeOrmTicketsRepository,
  }
  ```
- **Use cases dependen del token del repositorio abstracto**, nunca de la implementación TypeORM.
- **Nunca exponer entidades del dominio en los controllers**. Los controllers reciben/devuelven DTOs.
- **DTOs con `class-validator`** para validación automática (el `ValidationPipe` global lo procesa).
- **Errors del dominio** heredan de `DomainError` y son transformados a respuestas HTTP en un `ExceptionFilter` (se agrega cuando el primer context lo necesite).

## Base de datos

- PostgreSQL 16 corriendo en Docker (`docker-compose.yml`).
- Conexión configurada en `shared/infrastructure/persistence/database.module.ts`.
- `synchronize: true` **solo en desarrollo**. Para producción se usarán migraciones (aún por añadir).
- `autoLoadEntities: true` — cada módulo Nest registra sus entidades con `TypeOrmModule.forFeature([...])` y se cargan automáticamente.

## Comandos útiles

```bash
# Desarrollo (watch)
npm run start:dev

# Producción
npm run build && npm run start:prod

# Lint + tests
npm run lint
npm run test

# Base de datos
docker compose up -d postgres     # arrancar
docker compose logs -f postgres   # ver logs
docker compose down               # detener
docker compose down -v            # detener + borrar datos
```

## Próximos pasos

- Crear el primer bounded context (probablemente `games` — lista de juegos autorizados).
- `ExceptionFilter` global para mapear `DomainError` → HTTP.
- Sistema de migraciones TypeORM (`typeorm-ts-node-esm` o `dotenv-cli`).
- Autenticación (JWT + guards).
