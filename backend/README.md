# Melior Real Estate — Backend API

Backend completo para la plataforma inmobiliaria Melior, construido con Express.js, Prisma, PostgreSQL, y Socket.io.

## Tecnologías

| Tecnología | Uso |
|---|---|
| **Express.js** | Framework HTTP / API REST |
| **TypeScript** | Tipado estático |
| **Prisma** | ORM, migraciones, consultas |
| **PostgreSQL** | Base de datos relacional |
| **JWT** | Autenticación (access + refresh tokens) |
| **Zod** | Validación de esquemas |
| **Socket.io** | Mensajería y notificaciones en tiempo real |
| **Cloudinary** | Almacenamiento de imágenes |
| **Multer** | Manejo de uploads |
| **Bcrypt** | Hashing de contraseñas |

## Estructura del Proyecto

```
backend/
├── prisma/
│   ├── schema.prisma        # Esquema de base de datos (17 tablas)
│   └── seed.ts              # Datos iniciales
├── src/
│   ├── config/              # Env, DB, Cloudinary
│   ├── controllers/         # Lógica de peticiones HTTP
│   ├── middlewares/          # Auth, validación, errores, uploads
│   ├── routes/              # Definición de endpoints
│   ├── schemas/             # Esquemas Zod de validación
│   ├── services/            # Lógica de negocio
│   ├── sockets/             # Socket.io (chat, notificaciones)
│   ├── types/               # TypeScript types
│   ├── utils/               # Helpers, errores, async handler
│   ├── app.ts               # Configuración Express
│   └── server.ts            # Entry point
├── .env.example
├── package.json
└── tsconfig.json
```

## Instalación

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 3. Generar cliente Prisma
npm run db:generate

# 4. Aplicar migraciones
npm run db:migrate

# 5. Poblar datos de ejemplo
npm run db:seed

# 6. Iniciar servidor de desarrollo
npm run dev
```

## Base de Datos — Tablas

| Tabla | Descripción |
|---|---|
| `users` | Usuarios con roles (ADMIN, AGENT, CLIENT) |
| `refresh_tokens` | Tokens JWT de refresco |
| `agent_profiles` | Perfil extendido de agentes |
| `client_profiles` | Perfil extendido de clientes |
| `addresses` | Direcciones reutilizables |
| `properties` | Propiedades inmobiliarias |
| `property_images` | Galería de imágenes (Cloudinary) |
| `property_features` | Amenidades / características |
| `favorites` | Propiedades favoritas de usuarios |
| `client_property_interests` | Relación cliente ↔ propiedad |
| `appointments` | Citas / visitas programadas |
| `transactions` | Transacciones de venta/alquiler |
| `payments` | Pagos asociados a transacciones |
| `messages` | Mensajes directos entre usuarios |
| `notifications` | Notificaciones del sistema |
| `reviews` | Reseñas de propiedades |
| `contact_inquiries` | Formulario de contacto público |

## Endpoints de la API

Base URL: `http://localhost:4000/api`

### Auth (`/api/auth`)
| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| POST | `/register` | Registro de usuario | No |
| POST | `/login` | Inicio de sesión | No |
| POST | `/refresh` | Renovar access token | No |
| POST | `/logout` | Cerrar sesión | Sí |
| POST | `/logout-all` | Cerrar todas las sesiones | Sí |
| GET | `/profile` | Obtener perfil | Sí |
| PATCH | `/profile` | Actualizar perfil | Sí |
| PATCH | `/password` | Cambiar contraseña | Sí |
| PATCH | `/avatar` | Subir avatar | Sí |

### Properties (`/api/properties`)
| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| GET | `/` | Listar con filtros y paginación | No |
| GET | `/featured` | Propiedades destacadas | No |
| GET | `/stats` | Estadísticas generales | No |
| GET | `/slug/:slug` | Buscar por slug | No |
| GET | `/:id` | Detalle por ID | No |
| GET | `/:id/similar` | Propiedades similares | No |
| POST | `/` | Crear propiedad | Agent/Admin |
| PATCH | `/:id` | Actualizar propiedad | Agent/Admin |
| DELETE | `/:id` | Eliminar propiedad | Agent/Admin |
| POST | `/:id/images` | Subir imágenes | Agent/Admin |
| DELETE | `/:id/images/:imageId` | Eliminar imagen | Agent/Admin |

**Query params para GET `/`:**
`search`, `status` (SALE/RENT), `propertyType`, `minPrice`, `maxPrice`, `beds`, `baths`, `city`, `neighborhood`, `isFeatured`, `listingStatus`, `agentId`, `page`, `limit`, `sortBy`, `sortOrder`

### Clients (`/api/clients`)
| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| GET | `/` | Listar clientes | Agent/Admin |
| GET | `/:id` | Detalle de cliente | Agent/Admin |
| POST | `/` | Crear cliente | Agent/Admin |
| PATCH | `/:id` | Actualizar cliente | Agent/Admin |
| DELETE | `/:id` | Eliminar cliente | Agent/Admin |
| POST | `/:id/interests` | Agregar interés en propiedad | Agent/Admin |
| DELETE | `/:id/interests/:propertyId` | Eliminar interés | Agent/Admin |

### Favorites (`/api/favorites`)
| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| GET | `/` | Mis favoritos | Sí |
| POST | `/:propertyId` | Toggle favorito | Sí |
| GET | `/:propertyId/check` | ¿Es favorito? | Sí |

### Appointments (`/api/appointments`)
| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| GET | `/` | Mis citas | Sí |
| POST | `/` | Crear cita | Agent/Admin |
| PATCH | `/:id` | Actualizar cita | Sí |
| DELETE | `/:id` | Eliminar cita | Sí |

### Messages (`/api/messages`)
| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| GET | `/` | Conversaciones | Sí |
| GET | `/unread` | Mensajes sin leer | Sí |
| GET | `/:partnerId` | Mensajes con usuario | Sí |
| POST | `/` | Enviar mensaje | Sí |

### Notifications (`/api/notifications`)
| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| GET | `/` | Mis notificaciones | Sí |
| GET | `/unread` | Conteo sin leer | Sí |
| PATCH | `/:id/read` | Marcar como leída | Sí |
| PATCH | `/read-all` | Marcar todas como leídas | Sí |

### Inquiries (`/api/inquiries`)
| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| POST | `/` | Enviar consulta | No |
| GET | `/` | Listar consultas | Agent/Admin |
| GET | `/:id` | Detalle consulta | Agent/Admin |
| PATCH | `/:id` | Actualizar estado | Agent/Admin |
| DELETE | `/:id` | Eliminar consulta | Admin |

### Transactions (`/api/transactions`)
| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| GET | `/` | Listar transacciones | Agent/Admin |
| GET | `/:id` | Detalle transacción | Agent/Admin |
| POST | `/` | Crear transacción | Agent/Admin |
| POST | `/payments` | Registrar pago | Agent/Admin |
| PATCH | `/payments/:id` | Actualizar estado pago | Agent/Admin |

### Reviews (`/api/reviews`)
| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| GET | `/property/:propertyId` | Reseñas de propiedad | No |
| POST | `/` | Crear reseña | Sí |
| PATCH | `/:id` | Editar reseña | Sí |
| DELETE | `/:id` | Eliminar reseña | Sí |

### Dashboard (`/api/dashboard`)
| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| GET | `/admin` | Dashboard administrativo | Admin |
| GET | `/agent` | Dashboard de agente | Agent |

## Socket.io — Eventos en Tiempo Real

Conexión: `io(SERVER_URL, { auth: { token: accessToken } })`

### Eventos del Cliente → Servidor
| Evento | Payload | Descripción |
|---|---|---|
| `message:send` | `{ receiverId, content }` | Enviar mensaje |
| `message:typing` | `{ receiverId }` | Indicador de escritura |
| `message:stop-typing` | `{ receiverId }` | Parar indicador |
| `notifications:mark-read` | `{ notificationId }` | Marcar leída |
| `notifications:mark-all-read` | — | Marcar todas |
| `user:get-online` | `{ userIds: [] }` | Consultar en línea |

### Eventos del Servidor → Cliente
| Evento | Descripción |
|---|---|
| `message:new` | Mensaje recibido |
| `message:sent` | Confirmación de envío |
| `message:typing` | Alguien está escribiendo |
| `message:stop-typing` | Dejó de escribir |
| `notifications:updated` | Notificaciones actualizadas |
| `user:online-status` | Estado en línea de usuarios |

## Credenciales de Prueba

| Rol | Email | Contraseña |
|---|---|---|
| Admin | `admin@melior.com.do` | `Password123` |
| Agente | `ana.garcia@melior.com.do` | `Password123` |
| Agente | `carlos.mendez@melior.com.do` | `Password123` |
| Agente | `laura.reyes@melior.com.do` | `Password123` |
| Cliente | `maria.fernandez@gmail.com` | `Password123` |
| Cliente | `roberto.sanchez@gmail.com` | `Password123` |
| Cliente | `lucia.martinez@gmail.com` | `Password123` |
