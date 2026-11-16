import type {
  ConteoCumplimiento,
  EstadoRegistro,
  ItemRegistro,
  NutritionTotals,
} from "@/types/mealPlan"
import type {
  CalculoNutricional,
  CondicionPerfil,
  Medicion,
  RestriccionPerfil,
} from "@/types/patient"

/**
 * Campos consumidos de `HistorialProgresoResponse` / `ReporteProgresoResponse`
 * en `kalorixia-server/openapi.json` (KAL-87-01).
 */

export interface ObjetivoProgreso {
  id: number
  codigo: string
  nombre: string
}

export interface PlanProgreso {
  id_planificacion: number
  nombre: string
  estado: "publicada" | "archivada"
  desde: string
  hasta: string
  nombre_nutricionista: string
}

export interface ComidaProgreso {
  momento_comida: string
  id_planificacion: number
  estado: EstadoRegistro | null
  comentario: string | null
  items: ItemRegistro[]
  /** Los ítems si la comida fue `cumplida`; si no, vacío. */
  preparadas: ItemRegistro[]
  no_me_gustaron: ItemRegistro[]
}

export interface DiaProgreso {
  fecha: string
  dia_semana: string
  comidas: ComidaProgreso[]
}

export interface SemanaProgreso {
  inicio: string
  fin: string
  adherencia: ConteoCumplimiento
  por_plan: { id_planificacion: number; conteo: ConteoCumplimiento }[]
  recetas_preparadas: (ItemRegistro & { veces: number })[]
  dias: DiaProgreso[]
}

export interface HistorialProgreso {
  total: number
  limit: number
  offset: number
  objetivo: ObjetivoProgreso | null
  objetivo_personalizado: string | null
  planes: PlanProgreso[]
  mediciones: Medicion[]
  semanas: SemanaProgreso[]
}

export interface ComidaPlanReporte {
  momento_comida: string
  items: {
    id_receta: number
    nombre: string
    porcion_descripcion: string | null
    calorias_por_porcion: number | null
  }[]
}

export interface DiaPlanReporte {
  dia_semana: string
  completos: boolean
  totales: NutritionTotals | null
  diferencia_objetivo: NutritionTotals | null
  comidas: ComidaPlanReporte[]
}

export interface PlanReporte {
  id_planificacion: number
  nombre: string
  nombre_nutricionista: string
  desde: string
  hasta: string
  objetivo_diario: NutritionTotals | null
  dias: DiaPlanReporte[]
}

export interface ReporteProgreso {
  sin_registros: boolean
  encabezado: {
    paciente: { nombre: string; apellido: string }
    desde: string
    hasta: string
    nutricionista: {
      nombre: string
      apellido: string
      matricula: string | null
    } | null
    fecha_emision: string
  }
  perfil: {
    edad: number | null
    sexo_biologico: string | null
    peso_kg: number | null
    altura_cm: number | null
    nivel_actividad: { id: number; nombre: string } | null
    objetivo: ObjetivoProgreso | null
    objetivo_personalizado: string | null
  }
  restricciones: {
    restricciones_alimentarias: RestriccionPerfil[]
    condiciones_medicas: CondicionPerfil[]
  }
  requerimiento: {
    vigente_desde: string
    resultado: CalculoNutricional
  } | null
  planes: PlanReporte[]
  frecuencia_consumo: (ItemRegistro & { veces: number })[]
  adherencia: {
    resumen: ConteoCumplimiento
    semanas: (ConteoCumplimiento & { inicio: string; fin: string })[]
    por_plan: {
      id_planificacion: number
      nombre: string
      conteo: ConteoCumplimiento
    }[]
    no_me_gustaron: (ItemRegistro & { veces: number })[]
  }
  mediciones: {
    anterior: Medicion | null
    del_periodo: Medicion[]
  }
}
