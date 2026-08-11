export interface SessionResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  requires_password_change: boolean
}

export type EstadoMatricula = "pendiente" | "aprobada" | "rechazada"

export interface NutricionistaPerfil {
  tipo: "nutricionista"
  id_nutricionista: number
  estado_matricula: EstadoMatricula | null
}

export interface OtroPerfil {
  tipo: "administrador" | "paciente"
  [key: string]: unknown
}

export interface UsuarioActual {
  id_usuario: number
  auth_user_id: string
  email: string
  nombre: string
  apellido: string
  foto_url: string | null
  activo: boolean
  estado: string
  roles: string[]
  perfil: NutricionistaPerfil | OtroPerfil | null
}

export interface EstadoMatriculaDetalle {
  id_nutricionista: number
  matricula: string
  estado: EstadoMatricula
  fecha_solicitud: string
  fecha_validacion: string | null
  observaciones: string | null
}

export interface Especialidad {
  id: number
  nombre: string
  descripcion: string | null
}
