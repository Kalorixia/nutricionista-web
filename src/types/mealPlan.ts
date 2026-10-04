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
  /** Null en una plantilla (KAL-132-03). */
  id_paciente: number | null
  /** Plantilla propia: sin paciente, siempre borrador, nunca se publica. */
  es_plantilla?: boolean
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
  objetivos_nutricionales?: ObjetivosPlan | null
  generacion_ia?: GeneracionIA | null
  /** Última modificación después de publicar (KAL-131-08). Sólo para el profesional. */
  ultima_edicion?: {
    fecha: string
    usuario: string
    accion: "agregar_item" | "quitar_item" | "editar_cabecera"
  } | null
  ediciones?: number
  /** Lo que el profesional le escribe al paciente (KAL-132-02). */
  indicaciones_generales?: string | null
  /** Notas por comida, con clave "Día|Momento". */
  notas_comidas?: Record<string, string>
}

/** Una plantilla de la sección "Mis plantillas" (KAL-132-03). */
export interface PlantillaResumen {
  id_planificacion: number
  nombre: string
  descripcion: string | null
  cantidad_recetas: number
  created_at: string
}

/** Lo que se quitó al copiar a un paciente porque no lo puede comer. */
export interface ItemQuitado {
  dia_semana: string
  momento_comida: string
  id_receta: number
  nombre: string | null
  motivo: string
}

export interface CopiaPlan {
  plan: PlanificacionDetalle
  quitados: ItemQuitado[]
}

/** PATCH /planificaciones/{id}: lo que no se manda no se toca. */
export interface ActualizarPlanificacionInput {
  nombre?: string
  descripcion?: string | null
  fecha_inicio?: string | null
  fecha_fin?: string | null
  objetivos?: ObjetivosPlanInput
  indicaciones_generales?: string
  /** Parche: null o vacío borra la nota de esa comida. */
  notas_comidas?: Record<string, string | null>
}

/**
 * Objetivos contra los que se mide un plan. Los planes nuevos guardan los
 * suyos; `ajustado_para_plan` dice qué cambió el profesional respecto de lo que
 * proponía la fórmula (`sugerido_para_plan`).
 */
export interface ObjetivosPlan {
  get_objetivo_kcal: number
  proteinas_g: number
  grasas_g: number
  carbohidratos_g: number
  hidratacion_ml?: number | null
  prescrito_por_profesional?: string[]
  ajustado_para_plan?: string[]
  sugerido_para_plan?: Record<string, number>
}

export interface OpcionCatalogo {
  id: number
  nombre: string
  codigo?: string
}

/** GET /planificaciones/parametros */
export interface ParametrosPlan {
  id_paciente: number
  objetivo: OpcionCatalogo | null
  nivel_actividad: OpcionCatalogo | null
  objetivos: ObjetivosPlan | null
  del_paciente: boolean
  opciones_objetivo: OpcionCatalogo[]
  opciones_nivel_actividad: OpcionCatalogo[]
}

/** Lo que el profesional fija para un plan nuevo. No toca el perfil. */
export interface ObjetivosPlanInput {
  get_objetivo_kcal: number
  proteinas_g: number
  grasas_g: number
  carbohidratos_g?: number
}

export interface ParametrosPlanInput {
  id_objetivo?: number
  id_nivel_actividad?: number
  objetivos?: ObjetivosPlanInput
  guardar_como_prescripcion?: boolean
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
  "pendiente" | "procesando" | "completada" | "fallida"

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
  /** Calculadas por el backend sobre lo persistido: ajuste al objetivo, comidas omitidas, variedad. */
  advertencias_sistema?: string[]
  desviacion?: DesviacionIA | null
  revision_profesional?: RevisionProfesional | null
  descartes_restricciones?: DescarteRestriccion[]
}

/** Lo que descartó la revisión automática de una restricción. Juicio del modelo, no certificación. */
export interface DescarteRestriccion {
  restriccion: string
  motivo: string
  ingredientes: string[]
  items_descartados: number
}

export interface MedidaDesviacion {
  energia: number
  proteinas: number | null
  dias_fuera: number
}

/** Cuánto se aparta el borrador de los objetivos, antes y después de la corrección. */
export interface DesviacionIA {
  antes: MedidaDesviacion | null
  despues: MedidaDesviacion | null
  umbral: number
  correccion:
    | "aplicada"
    | "descartada"
    | "fallida"
    | "no_necesaria"
    | "deshabilitada"
    | "sin_objetivo"
}

/** Cuánto cambió el profesional el borrador antes de publicarlo. */
export interface RevisionProfesional {
  agregados: number
  quitados: number
  cambiados: number
  publicado_en: string
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
