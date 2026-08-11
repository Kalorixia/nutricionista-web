export interface SubscriptionPlanOption {
  id: string
  nombre: string
  precio_mensual: number
  max_pacientes: number
  ai_limit: number
}

export interface Subscription {
  plan_id: string | null
  activa: boolean
  auto_renueva: boolean
  fecha_inicio: string | null
  fecha_fin: string | null
  pacientes_usados: number
  ai_usado: number
}
