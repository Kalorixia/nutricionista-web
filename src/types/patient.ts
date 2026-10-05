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
  /** Null cuando es una condición escrita a mano. */
  id_condicion?: number | null
  nombre: string
  detalle: string | null
}

export interface RestriccionPerfil {
  /** Null cuando es una restricción escrita a mano. */
  id_restriccion?: number | null
  tipo: string | null
  nombre: string
  detalle: string | null
}

export type TipoRestriccion = "alergia" | "intolerancia" | "aversion"

export interface OpcionRegistro {
  id: number
  nombre: string
  codigo?: string
  tipo?: string
  descripcion?: string | null
}

/** GET /pacientes/catalogos/registro: las opciones del perfil clínico. */
export interface CatalogosRegistro {
  objetivos: OpcionRegistro[]
  niveles_actividad: OpcionRegistro[]
  condiciones_medicas: OpcionRegistro[]
  restricciones_alimentarias: OpcionRegistro[]
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
  /** Gustos y hábitos opcionales (KAL-132-01); null si no respondió. */
  preferencias?: PreferenciasPaciente | null
  nivel_actividad: { id: number; nombre: string } | null
  calculo_nutricional: CalculoNutricional | null
  condiciones_medicas: CondicionPerfil[]
  restricciones_alimentarias: RestriccionPerfil[]
  onboarding_completado: boolean
}

/**
 * Lo que el nutricionista puede corregir (KAL-131-07). Nombre y fecha de
 * nacimiento no: el backend los rechaza con 422. Las listas reemplazan a las
 * guardadas.
 */
export interface ActualizarPerfilInput {
  peso_kg?: number
  altura_cm?: number
  sexo_biologico?: "femenino" | "masculino"
  id_objetivo?: number
  objetivo_personalizado?: string
  id_nivel_actividad?: number
  condiciones_medicas?: {
    id_condicion?: number
    nombre_personalizado?: string
    detalle?: string
  }[]
  restricciones_alimentarias?: {
    id_restriccion?: number
    tipo_personalizado?: TipoRestriccion
    nombre_personalizado?: string
    detalle?: string
  }[]
}

/** Todo opcional: lo que se manda pisa el cálculo, el objeto vacío lo borra. */
export interface PrescribirObjetivoInput {
  get_objetivo_kcal?: number
  proteinas_g?: number
  grasas_g?: number
  carbohidratos_g?: number
}

export type TiempoCocina = "menos_15" | "15_30" | "30_60" | "mas_60"

/** Preferencias del paciente. Orientan al Copiloto; no son restricciones. */
export interface PreferenciasPaciente {
  le_gustan?: string[]
  prefiere_evitar?: string[]
  tiempo_cocina_semana?: TiempoCocina | null
  tiempo_cocina_fin_de_semana?: TiempoCocina | null
  habilidad_cocina?: "basica" | "intermedia" | "avanzada" | null
  comidas_fuera?: ("Desayuno" | "Almuerzo" | "Merienda" | "Cena")[]
  presupuesto?: "ajustado" | "medio" | "holgado" | null
  personas_hogar?: number | null
  comentarios?: string | null
}
