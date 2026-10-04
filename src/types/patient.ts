export type EstadoCodigo = "activo" | "usado" | "expirado" | "revocado"

export interface CodigoVinculacion {
  id_codigo: number
  codigo: string
  estado: EstadoCodigo
  fecha_creacion: string
  fecha_expiracion: string
  fecha_uso: string | null
}

export interface PacienteVinculado {
  id_paciente: number
  nombre: string
  apellido: string
  fecha_inicio: string
}

export interface PacienteDetalle {
  id_paciente: number
  nombre: string
  apellido: string
  fecha_nacimiento: string
  sexo_biologico: string
  peso_kg: number
  altura_cm: number
  objetivo: string
  nivel_actividad: string
  condiciones_medicas: string[]
  restricciones_alimentarias: string[]
  fecha_inicio: string
}

/** Objetivos nutricionales vigentes de un paciente. */
export interface CalculoNutricional {
  version: string
  edad: number
  tmb_kcal: number
  get_kcal: number
  get_objetivo_kcal: number
  proteinas_g: number
  grasas_g: number
  carbohidratos_g: number
  hidratacion_ml: number
  /** Campos que fijó el profesional: pisan el cálculo y sobreviven a un cambio de peso. */
  prescrito_por_profesional?: string[]
  /** Lo que la fórmula sugeriría para esos campos, para poder comparar. */
  calculado?: Record<string, number>
}

export interface CondicionPerfil {
  nombre: string
  detalle: string | null
}

export interface RestriccionPerfil {
  tipo: string | null
  nombre: string
  detalle: string | null
}

export interface PerfilPaciente {
  id_paciente: number
  nombre: string
  apellido: string
  fecha_nacimiento: string | null
  sexo_biologico: "femenino" | "masculino" | null
  peso_kg: number | null
  altura_cm: number | null
  objetivo: { id: number; codigo: string; nombre: string } | null
  /** Objetivo escrito por el paciente ("Otro"); excluyente con `objetivo`. */
  objetivo_personalizado?: string | null
  nivel_actividad: { id: number; nombre: string } | null
  calculo_nutricional: CalculoNutricional | null
  condiciones_medicas: CondicionPerfil[]
  restricciones_alimentarias: RestriccionPerfil[]
  onboarding_completado: boolean
}

export interface ActualizarPerfilInput {
  peso_kg?: number
  altura_cm?: number
  fecha_nacimiento?: string
  sexo_biologico?: "femenino" | "masculino"
  id_objetivo?: number
  id_nivel_actividad?: number
}

/** Todo opcional: lo que se manda pisa el cálculo, el objeto vacío lo borra. */
export interface PrescribirObjetivoInput {
  get_objetivo_kcal?: number
  proteinas_g?: number
  grasas_g?: number
  carbohidratos_g?: number
}
