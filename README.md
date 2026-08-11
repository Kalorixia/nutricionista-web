# nutricionista-web

Portal del nutricionista de Kalorixia. React + TypeScript + Vite + shadcn/ui,
separado del prototipo de Lovable siguiendo el mismo patrón que `admin-web`:
una capa de servicios que habla con el backend real (`kalorixia-server`)
donde ya existe API, y servicios "mock" (misma forma async, datos en memoria)
donde todavía no la hay.

## Desarrollo

```bash
npm install
cp .env.example .env   # ajustar VITE_API_BASE_URL / BACKEND_ORIGIN si hace falta
npm run dev
```

Scripts disponibles: `dev`, `build`, `lint`, `format`, `typecheck`, `preview`.

## Qué está conectado a la API real vs. qué es mock

| Área | Estado | Servicio |
| --- | --- | --- |
| Login / registro / verificación de email / recuperar contraseña | Real | `services/authService.ts` |
| Estado de aprobación de matrícula | Real | `services/nutritionist.service.ts` |
| Códigos de vinculación (generar/listar/revocar) | Real | `services/patients.service.ts` |
| Pacientes vinculados (listar/detalle/desvincular) | Real | `services/patients.service.ts` |
| Planificación de dietas (planes, publicar, generar con IA) | Mock | `services/mealPlans.service.ts` |
| Catálogo de recetas | Mock — `/api/v1/recetas` hoy es solo para administradores | `services/recipes.service.ts` |
| Listas/colecciones de recetas compartibles | Mock | `services/recipeLists.service.ts` |
| Suscripción / plan / uso | Mock — no hay integración de pagos | `services/subscription.service.ts` |
| Actividad reciente del dashboard | Mock | `services/dashboard.service.ts` |

Cada servicio mock importa de `services/mocks/*.mock.ts` y usa el helper
`delay()` de `services/mockUtils.ts` para simular latencia de red, con la
misma forma async que tendría el servicio real — así que cuando el backend
sume el endpoint correspondiente, alcanza con reescribir el cuerpo del
servicio (no hace falta tocar las páginas que lo consumen).

## Pendiente para producción

- Agregar el dominio final de Vercel de este repo a `CORS_ORIGINS` en el
  backend (Cloud Run, no vive en el repo de `kalorixia-server`):
  ```bash
  gcloud run services update kalorixia-backend \
    --update-env-vars CORS_ORIGINS=https://kalorixia-admin.vercel.app,https://<dominio-nutricionista-web>
  ```
- Reemplazar los servicios mock listados arriba a medida que el backend
  sume los endpoints correspondientes.

## Estructura de carpetas

```
src/
  hooks/        # hooks compartidos (use-auth, use-mobile)
  routes/       # guards de ruta (RequireAuth, RequireApprovedNutritionist)
  services/     # servicios reales + mocks (services/mocks/)
  components/
    ui/         # primitivas shadcn
    common/     # componentes reutilizables (KalorixiaLoader, ConfirmDialog)
    modules/    # componentes compuestos por dominio (layout, etc.)
  pages/        # una página por ruta
  types/        # tipos compartidos entre servicios/páginas
  utils/        # helpers (formato de fechas, etc.)
  store/        # reservado para estado cliente futuro
```

## Adding shadcn components

```bash
npx shadcn@latest add <component>
```

Coloca los componentes en `src/components/ui`. Importalos como:

```tsx
import { Button } from "@/components/ui/button"
```
