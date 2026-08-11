// MOCK — no hay integración de pagos ni backend de suscripciones todavía.
// Reemplazar por el proveedor de pagos real (Stripe u otro) + endpoints.
import type { Subscription, SubscriptionPlanOption } from "@/types/subscription"

export const subscriptionPlans: SubscriptionPlanOption[] = [
  { id: "free", nombre: "Gratuito", precio_mensual: 0, max_pacientes: 5, ai_limit: 3 },
  { id: "pro", nombre: "Pro", precio_mensual: 9990, max_pacientes: 30, ai_limit: 30 },
  {
    id: "premium",
    nombre: "Premium",
    precio_mensual: 19990,
    max_pacientes: 100,
    ai_limit: 100,
  },
]

export const mySubscription: Subscription = {
  plan_id: "free",
  activa: true,
  auto_renueva: false,
  fecha_inicio: "2026-08-01T00:00:00.000Z",
  fecha_fin: null,
  pacientes_usados: 0,
  ai_usado: 0,
}
