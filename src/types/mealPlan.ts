import type { RecetaListItem } from "@/types/recipe"

export type EstadoPlanificacion = "borrador" | "publicada" | "archivada"

export interface Planificacion {
  id_planificacion: number
  id_paciente: number
  nombre_paciente: string
  nombre: string
  descripcion: string | null
  estado: EstadoPlanificacion
  fecha_inicio: string | null
  fecha_fin: string | null
  fecha_publicacion: string | null
  created_at: string
  cantidad_recetas: number
}

/**
 * La receta tal como viene dentro del detalle de un plan. Trae los macros por
 * porción, que el listado general de recetas no incluye: son los que el
 * nutricionista necesita para revisar un casillero sin abrir la receta entera.
 */
export interface PlanRecetaResumen extends RecetaListItem {
  proteinas_g: number | null
  carbohidratos_g: number | null
  grasas_totales_g: number | null
}

export interface PlanificacionRecetaItem {
  id_planificacion_receta: number
  dia_semana: string | null
  momento_comida: string | null
  orden: number | null
  receta: PlanRecetaResumen
}

export interface PlanificacionDetalle {
  id_planificacion: number
  id_paciente: number
  nombre_paciente: string
  nombre: string
  descripcion: string | null
  estado: EstadoPlanificacion
  fecha_inicio: string | null
  fecha_fin: string | null
  fecha_publicacion: string | null
  created_at: string
  recetas: PlanificacionRecetaItem[]
  resumen_diario?: {
    dia_semana: string
    completos: boolean
    totales: NutritionTotals | null
    diferencia_objetivo: NutritionTotals | null
  }[]
  objetivos_nutricionales?: {
    get_objetivo_kcal: number
    proteinas_g: number
    grasas_g: number
    carbohidratos_g: number
    hidratacion_ml: number
  } | null
  generacion_ia?: GeneracionIA | null
}

/**
 * Metadatos de un borrador generado por el Copiloto.
 *
 * `sin_verificar` es lo que el backend no pudo comprobar con los datos del
 * catálogo (una condición cargada a mano, un detalle clínico escrito libre).
 * `advertencias` es lo que el modelo dice haber revisado sobre esos puntos, y
 * no está verificado por el sistema. Los dos se muestran antes de aprobar.
 */
export type EstadoGeneracion =
  | "pendiente"
  | "procesando"
  | "completada"
  | "fallida"

/** Pedido de borrador al Copiloto. Se resuelve en segundo plano. */
export interface GeneracionPlan {
  id_generacion: number
  id_paciente: number
  estado: EstadoGeneracion
  id_planificacion: number | null
  nombre: string | null
  error_codigo: string | null
  error_mensaje: string | null
  created_at: string
  updated_at: string
}

export interface GeneracionIA {
  modelo: string
  version_prompt: string
  generado_en: string
  sin_verificar?: string[]
  advertencias?: string[]
}

/** Campos consumidos del PlanDetailResponse en kalorixia-server/openapi.json. */
export interface NutritionTotals {
  energia_kcal: number
  proteinas_g: number
  carbohidratos_g: number
  grasas_totales_g: number
}

export interface ItemCompra {
  id_item: number
  nombre: string
  cantidad: number | null
  unidad: string | null
  comprado: boolean
}

export interface ListaCompra {
  id_lista_compra: number
  id_planificacion: number
  fecha_generacion: string
  items: ItemCompra[]
}

export const DIAS_SEMANA = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
]

export const MOMENTOS_COMIDA = ["Desayuno", "Almuerzo", "Merienda", "Cena"]
