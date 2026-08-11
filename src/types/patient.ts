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
