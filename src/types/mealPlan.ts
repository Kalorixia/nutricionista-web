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

export interface PlanificacionRecetaItem {
  id_planificacion_receta: number
  dia_semana: string | null
  momento_comida: string | null
  orden: number | null
  receta: RecetaListItem
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
