# Fleet Control · Monitor de Vehículo en Tiempo Real

SPA de sala de control (control room) conectada a la API de [Traccar](https://www.traccar.org/). Muestra la flota en un mapa interactivo, el estado del vehículo seleccionado en tiempo real y todos los estados de carga, error y vacío que exige la prueba técnica.

**Demo:** https://fleet-control-monitor.vercel.app · **Stack:** React 19 · Vite 6 · TypeScript · Tailwind v4 · Leaflet

---

## Funcionalidades

| Requisito | Implementación |
|---|---|
| Login Traccar (`POST /api/session`) | Formulario con email/password + modo simulador oficial (lectura anónima) |
| Listar vehículos (`GET /api/devices`) | Panel lateral con filtro, contador online/offline y selección |
| Posiciones en vivo (`GET /api/positions`) | Polling cada 5 s con actualización incremental |
| Estados de carga | Skeletons con shimmer sin CLS (lista, tarjeta y mapa) |
| Estado de error | Pantalla empática con causa, `Reintentar` y `Cambiar servidor` |
| Estado vacío | Mensaje claro cuando la flota no tiene dispositivos |
| Mapa interactivo | Leaflet + tiles CartoDB (light/dark según tema) |
| Marcador SVG rotado | Flecha orientada por `course`, interpolación suave `requestAnimationFrame` |
| Velocidad | Nudos → km/h (`× 1.852`), flash visual al cambiar |
| Tema claro/oscuro | `data-theme` en `<html>`, persistido en `localStorage`, sin FOUC |
| Accesibilidad | `dl/dt/dd`, `aria-live`, `aria-selected`, `:focus-visible`, `prefers-reduced-motion` |

---

## Requisitos

- Node.js ≥ 18
- npm ≥ 9

## Instalación

```bash
npm install
cp .env.example .env   # opcional
npm run dev            # http://127.0.0.1:5173
```

## Variables de entorno

| Variable | Default | Descripción |
|---|---|---|
| `VITE_TRACCAR_URL` | `/traccar` | Base de la API (proxy same-origin en dev y Vercel) |
| `VITE_TRACCAR_PROXY_TARGET` | `https://simulator.traccar.org` | Destino del proxy de desarrollo en Vite |

En producción (Vercel) el rewrite de `vercel.json` enruta `/traccar/:path*` → `https://simulator.traccar.org/api/:path*`, evitando CORS (el simulador no envía headers CORS).

## Uso

1. **Usar simulador oficial** — conecta contra `simulator.traccar.org` con la flota en vivo de Londres (sin credenciales; el endpoint de sesión devuelve 403 read-only y se continúa en modo lectura).
2. **Iniciar sesión con tu servidor** — expande el formulario, introduce URL, email y contraseña. Requiere CORS habilitado o proxy configurado.

**Cuenta de prueba** (cuenta desechable en el servidor público de demo4, sin vehículos ni permisos de admin; verificada el 2026-10-22):

- URL: `https://demo4.traccar.org` (ya viene precargada)
- Email: `fleet.demo.433745790@example.com`
- Contraseña: `Demo123456!`

demo4 tiene `registration: true`: admite crear cuentas nuevas por API (`POST /api/users`). Con una cuenta nueva verás el estado vacío real de la flota; el simulador (opción 1) es el que trae vehículos en vivo.

## Arquitectura

```
src/
  App.tsx                 # orquestación de sesión, layout y estados globales
  components/
    Header.tsx            # marca, badge En vivo, fuente de datos, toggle tema
    LoginView.tsx         # pantalla de conexión (simulador / servidor)
    DeviceList.tsx        # panel lateral con filtro y selección
    StatusCard.tsx        # tarjeta semántica dl/dt/dd con aria-live
    MapView.tsx           # Leaflet, marcador SVG rotado, interpolación
    ErrorState.tsx        # error empático + Retry + Cambiar servidor
    Skeleton.tsx          # skeletons de lista, tarjeta y mapa
    ThemeToggle.tsx       # claro/oscuro
  hooks/useFleetData.ts   # polling de devices + positions, selección
  lib/
    traccar.ts            # cliente API (session, devices, positions, connect)
    format.ts             # nudos→km/h, coordenadas, tiempos relativos
    useTheme.ts           # tema persistente
  types/traccar.ts        # tipos de la API y TraccarError
  index.css               # tokens Apex Telemetry & Control (light/dark)
```

### Decisiones técnicas

- **Proxy same-origin**: el simulador Traccar no emite `Access-Control-Allow-Origin`; en dev el proxy de Vite y en Vercel el rewrite resuelven el CORS sin tocar la lógica de la app.
- **`connect()` flexible**: en modo `simulator` tolera 401/403 del `POST /session` y sigue con `GET /devices` + `GET /positions` anónimos; en modo `server` el login es obligatorio.
- **Smoothing del marcador**: cada nueva posición dispara una interpolación ease-out-cubic de ~1.6 s vía `requestAnimationFrame`; respeta `prefers-reduced-motion` (salto instantáneo).
- **Tokens como CSS Custom Properties** + `@theme inline` de Tailwind v4: un solo source of truth para light/dark y futuras extensiones de design system.

## Build y preview

```bash
npm run build     # tsc -b && vite build → dist/
npm run preview   # sirve dist/ localmente
```

## Accesibilidad (WCAG 2.1 AA)

- Foco visible con `outline: 2px solid` (nunca `outline: none` sin reemplazo).
- Región `aria-live="polite"` en velocidad y última actualización; `role="alert"` + `aria-live="assertive"` en errores.
- Lista de vehículos como `role="listbox"` / `role="option"` con `aria-selected`.
- Tarjeta de estado con lista semántica `dl`/`dt`/`dd`.
- Animaciones anuladas bajo `@media (prefers-reduced-motion: reduce)`.
- Contraste AA verificado en la paleta Apex (texto principal sobre superficies light/dark).

## Licencia

Proyecto de prueba técnica — uso evaluativo.
