# 💍 Invitación de boda digital

Invitación de boda interactiva **mobile-first** con sobre animado, parallax, RSVP con base de datos, acceso privado por link (con device binding invisible) y panel de administración para los novios.

**Stack:** Express + TypeScript · Prisma · Supabase (PostgreSQL) · React 18 + Vite · Tailwind · Framer Motion.

La base de datos guarda **solo** las invitaciones (familias, teléfonos, cupos y su respuesta: quién confirmó y cuántas personas van), los dispositivos, los accesos y la configuración del evento. **Las fotos se suben desde el panel y se guardan en el disco del servidor**, no en la base de datos (ver [Fotos](#fotos)).

---

## Estructura

```
boda/
├── package.json                 # workspaces: server + client (dev, build, start)
├── render.yaml                  # servicio de Render (plan free)
├── .github/workflows/deploy.yml # CI + deploy a Render
├── media/                       # fotos subidas desde el panel + photos.json (se sube a git)
├── supabase/
│   ├── setup.sql                # RLS en todas las tablas e índices
│   └── invitados-plantilla.csv  # plantilla para importar invitados
├── server/
│   ├── .env.example
│   ├── prisma/
│   │   ├── schema.prisma        # url = DATABASE_URL (pooler) · directUrl = DIRECT_URL
│   │   ├── migrations/          # migración inicial
│   │   └── seed.ts              # admin + evento de ejemplo + 5 invitaciones
│   └── src/
│       ├── app.ts · index.ts
│       ├── config/              # env (validado con Zod), cookies
│       ├── lib/                 # prisma.ts
│       ├── middlewares/         # invitationAccess (token + dispositivo), requireAdmin, rateLimits, upload, errorHandler
│       ├── services/            # device, event, calendar (.ics + links), photo (sharp → disco), import, export, token
│       ├── controllers/         # invitación pública + admin/*
│       ├── routes/              # /api/invitation, /api/photos, /api/admin
│       ├── schemas/             # Zod
│       └── utils/               # zona horaria, teléfonos, errores HTTP
└── client/
    ├── index.html               # Open Graph genérico (sin datos personales)
    ├── public/                  # og-image.jpg, favicon.svg
    └── src/
        ├── components/          # Envelope, ParallaxLayer, SmartImage, Lightbox, Reveal, MusicToggle, CalendarButtons…
        ├── sections/            # Hero, Greeting, Countdown, Story, Gallery, Quote, Venues, Itinerary, DressCode, Gifts, Rsvp, Closing
        ├── hooks/               # useParallax, useCountdown, useMediaQuery
        ├── lib/                 # api, fingerprint, format, types
        └── pages/               # InvitationPage + admin/ (Login, Dashboard, Invitations, Photos, Settings, Logs)
```

---

## 1. Crear el proyecto en Supabase

1. Entra a [supabase.com](https://supabase.com) → **New project**. Elige una región cercana (p. ej. `South America (São Paulo)`) y **guarda la contraseña de la base de datos**.
2. **Connection strings** → botón **Connect** (arriba) o *Project Settings → Database*:
   - **Transaction pooler** (puerto **6543**) → `DATABASE_URL`. Agrega al final `?pgbouncer=true&connection_limit=1`.
   - **Session pooler** o **Direct connection** (puerto **5432**) → `DIRECT_URL`.
   - Reemplaza `[YOUR-PASSWORD]` por tu contraseña (si tiene caracteres especiales, codifícalos en URL).

> No necesitas Supabase Storage ni la service role key: las fotos no van a Supabase.

## 2. Variables de entorno

```bash
cp server/.env.example server/.env
```

Completa `server/.env`. Genera secretos con:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

| Variable | Descripción |
| --- | --- |
| `DATABASE_URL` | Pooler (6543, `pgbouncer=true`) – consultas de la app |
| `DIRECT_URL` | Conexión directa (5432) – migraciones |
| `JWT_SECRET` / `COOKIE_SECRET` | ≥ 32 caracteres aleatorios |
| `CLIENT_URL` | Dominio público (`http://localhost:5173` en desarrollo) |
| `PORT` | `4000` |
| `MEDIA_DIR` | Carpeta de las fotos subidas (por defecto `./media`, que se guarda en git) |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | Admin inicial creado por el seed |

## 3. Base de datos

```bash
npm install                 # instala server + client (y genera Prisma Client)
npm run db:deploy           # aplica las migraciones (usa DIRECT_URL)
```

Luego, en Supabase → **SQL Editor** → *New query*, pega y ejecuta **`supabase/setup.sql`**. Esto:

- activa **Row Level Security en todas las tablas sin políticas públicas** (la anon key no puede leer ni escribir nada; solo Express accede vía Prisma),
- revoca privilegios de `anon` / `authenticated`,
- asegura los índices de `Invitation.token`, `InvitationDevice(invitationId, deviceId)` y `AccessLog(invitationId, createdAt)`.

> El script es idempotente. Si en el futuro agregas tablas con una migración nueva, vuelve a ejecutarlo.

Finalmente:

```bash
npm run db:seed
```

El seed crea el admin, el evento de ejemplo y 5 invitaciones de prueba (imprime sus links en consola).

> Durante el desarrollo puedes usar `npm run db:migrate` (equivale a `prisma migrate dev`) para crear nuevas migraciones al cambiar el schema.

## 4. Desarrollo local

```bash
npm run dev
```

- Frontend: <http://localhost:5173> (Vite hace proxy de `/api` a Express, así las cookies funcionan sin CORS)
- API: <http://localhost:4000>
- Panel: <http://localhost:5173/admin>
- Invitación: abre uno de los links que imprimió el seed (`/i/<token>`)

> 💡 Al abrir un link desde tu computadora, ese navegador ocupa uno de los cupos de dispositivos. Usa **Liberar dispositivos** en el panel antes de enviarlo.

> El fingerprint usa `crypto.subtle`, disponible solo en HTTPS o `localhost`. Si pruebas desde el celular por IP de la red local, el acceso funciona solo con la cookie.

## 5. Deploy gratis: GitHub Actions → Render

En producción Express sirve el build de React desde `client/dist` (un solo servicio). Cada `git push` a `main` ejecuta **GitHub Actions** (`.github/workflows/deploy.yml`): instala, hace typecheck y build, y **solo si todo pasa** le pide a Render que despliegue.

### Configuración (una sola vez)

1. **Render** → [dashboard.render.com](https://dashboard.render.com) → **New → Blueprint** → conecta GitHub y elige el repo `boda`. Render lee `render.yaml` (plan **free**).
2. Cuando te pida las variables, completa:
   - `DATABASE_URL` y `DIRECT_URL`: las de Supabase (paso 1).
   - `CLIENT_URL`: la URL que te da Render, p. ej. `https://invitacion-boda.onrender.com` (puedes poner una provisional y corregirla después en *Environment*).
   - `JWT_SECRET` y `COOKIE_SECRET` se generan solos.
3. En el servicio → **Settings → Deploy Hook** → copia la URL.
4. **GitHub** → repo → **Settings → Secrets and variables → Actions → New repository secret**:
   - Nombre: `RENDER_DEPLOY_HOOK_URL`
   - Valor: la URL del paso 3.
5. Haz un push (o en GitHub → *Actions* → *CI y deploy a Render* → *Run workflow*). El build en Render ejecuta también `prisma migrate deploy`.
6. La primera vez, crea los datos iniciales desde tu computadora apuntando a Supabase: `npm run db:seed` (con las URLs de Supabase en `server/.env`).

> `autoDeploy` está desactivado en `render.yaml`: así Render no despliega código que no compila; el que decide es GitHub Actions.

### Limitaciones del plan gratis de Render

- El servicio **se duerme tras 15 min sin visitas**; la primera visita después tarda ~30–60 s en despertar. Para el día del envío puedes abrir el link antes o usar un monitor gratuito (p. ej. UptimeRobot a `/api/health` cada 10 min).
- **El disco no es permanente:** lo que se escribe en el servidor se pierde en cada deploy o reinicio. Por eso las fotos se manejan así (ver [Fotos](#fotos)): súbelas desde el panel **en tu computadora**, y luego `git add media && git commit && git push`.

> `CLIENT_URL` debe ser exactamente el dominio público: se usa para CORS, para armar los links de WhatsApp y para la URL absoluta de la imagen Open Graph.

---

## Cómo funciona el acceso privado

- Cada invitación (familia/grupo) tiene un **token nanoid de 36 caracteres**: `/i/:token`. El invitado no escribe nada.
- **Primera apertura:** Express genera un `deviceId`, lo guarda en una cookie **httpOnly, Secure, SameSite=Lax, firmada, de 1 año** y lo registra en `InvitationDevice`. Se guarda también un **fingerprint SHA-256** (user agent, plataforma, resolución, zona horaria, idioma) como respaldo si la cookie se pierde.
- Se aceptan dispositivos nuevos hasta `maxDevices` (2 por defecto). Pasado el límite → **403** con una pantalla elegante y botón de WhatsApp a los novios; **no se envía ningún dato** de la familia ni del evento.
- Token inválido → "Invitación no válida". Cada intento se registra en `AccessLog`.
- Los links **expiran a las 06:00 del día siguiente a la boda** (hora local; constante en `server/src/utils/time.ts`).
- Rate limit: 150 req/15 min por IP y **15 respuestas fallidas/15 min** (anti fuerza bruta).
- `Referrer-Policy: no-referrer` evita que el token se filtre a Google Maps u otros sitios; las rutas `/i/*` y `/admin` llevan `noindex`.

## Panel de administración (`/admin`)

- **Inicio:** totales, enviadas, abiertas, confirmadas, rechazadas, pendientes, personas vs. cupos y alertas de intentos bloqueados.
- **Fotos:** subida múltiple (arrastrar o seleccionar varias) por sección, con progreso; se optimizan a WebP en 3 tamaños y se guardan en el disco del servidor. Orden por drag & drop (con asa táctil), cambio de sección, descripción y borrado.
- **Invitados:** búsqueda, filtros (No enviado / Enviado / Abierto / Confirmado / Rechazado / Bloqueado), **Enviar por WhatsApp** (abre `wa.me` con la plantilla y marca `sentAt`), *Reenviar* para quienes no abrieron, copiar link, detalle con quién confirmó, cuántas personas asisten, restricciones alimentarias, mensaje, dispositivos y logs, editar cupos / máx. dispositivos, **liberar dispositivos**, generar link nuevo, importar CSV/Excel y exportar a Excel.
- **Evento:** nombres, fechas, **cupos por defecto por invitación** (2 al inicio), lugares, coordenadas, textos, dress code, regalos, plantilla de WhatsApp, paleta de colores, música, historia e itinerario.

### Importar invitados

Archivo `.csv` (coma o punto y coma) o `.xlsx` con las columnas:

```
nombre_familia,telefono,email,cupos
```

Ver `supabase/invitados-plantilla.csv`. Los teléfonos de 8 dígitos se asumen de Bolivia (+591) al armar el link de WhatsApp.

## Confirmación de asistencia (RSVP)

El invitado elige **"¡Sí, asistiremos!"** o **"No podremos asistir"**, escribe **su nombre** (una sola persona responde por la familia) y, si asisten, elige **cuántas personas** van: de 1 hasta los cupos de su invitación. Opcionalmente agrega restricciones alimentarias y un mensaje.

- **Cupos por defecto:** Panel → Evento → *Cupos por defecto por invitación* (2 al inicio). Se usan al crear o importar invitaciones sin cupos.
- **Cupos de una familia en particular:** Panel → Invitados → Detalle → *Editar cupos / dispositivos*, o la columna `cupos` del CSV.

## Fotos

Las fotos **no se guardan en la base de datos**. Se suben desde el panel y quedan en el **disco del servidor**:

```
media/
├── fotos/<id>-480.webp, <id>-960.webp, <id>-1600.webp   # versiones optimizadas
└── photos.json                                           # sección, orden y descripción de cada foto
```

**Cómo subirlas:** Panel → **Fotos** → elige la sección → **Seleccionar fotos** (puedes elegir muchas a la vez o arrastrarlas). Cada foto se convierte a WebP en 3 tamaños con miniatura borrosa. Luego puedes ordenarlas arrastrando el asa ⋮⋮, moverlas de sección, editar su descripción o eliminarlas.

| Sección | Uso |
| --- | --- |
| Portada | 1ª: portada · 2ª: fondo de la frase destacada |
| Nuestra historia | Una por cada momento de la historia, en el mismo orden |
| Galería | Grid masonry con lightbox (recomendado ≥ 12) |
| Cierre | Foto final a pantalla completa |

Si una sección está vacía, la invitación muestra fotos de ejemplo de Unsplash.

> ⚠️ **Plan gratis de Render: sube las fotos en local.** El disco del servidor gratis se borra en cada deploy o reinicio, así que la carpeta `media/` se guarda en git:
>
> 1. Sube y ordena las fotos en el panel de tu computadora (`http://localhost:5173/admin/fotos`).
> 2. `git add media && git commit -m "Fotos" && git push`
> 3. GitHub Actions despliega y las fotos quedan publicadas.
>
> No subas fotos desde el panel del sitio publicado: se perderían en el siguiente reinicio.
> Si en el futuro usas un plan con disco permanente, define `MEDIA_DIR` apuntando a ese disco (p. ej. `/var/data/media`).

> Las fotos HEIC del iPhone a veces no se pueden leer: expórtalas como JPG.

## Rendimiento y accesibilidad

- Parallax con `useScroll` + `useTransform` y `translate3d` + `will-change` (nunca `background-attachment: fixed`). Se desactiva con `prefers-reduced-motion`.
- Imágenes WebP con `srcset`, `loading="lazy"`, placeholder borroso y proporciones fijas (sin saltos de layout).
- `100svh` / `100dvh`, áreas táctiles ≥ 44 px, overlay degradado sobre fotos, sin scroll horizontal.
- El código del panel se carga aparte: los invitados descargan ≈ 115 KB gzip de JS.
- La música arranca solo tras tocar el sello, se pausa al cambiar de app y tiene botón flotante para silenciar.
