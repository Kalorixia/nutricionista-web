export interface PlanSuscripcion {
  codigo: string
  nombre: string
  max_pacientes_activos: number
  max_generaciones_mes: number
}

export interface UsoSuscripcion {
  /** Mes calendario en hora de Argentina (YYYY-MM). */
  mes: string
  /** Puede superar el máximo si el plan bajó. */
  pacientes_activos: number
  /** Pedidos al Copiloto del mes, sin contar los fallidos. */
  generaciones_mes: number
}

export interface MiSuscripcion {
  plan: PlanSuscripcion
  uso: UsoSuscripcion
}
