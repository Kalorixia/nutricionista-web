export interface Disclaimer {
  rol: "paciente" | "nutricionista"
  version: number
  titulo: string
  cuerpo: string
  vigente_desde: string
  aceptado: boolean
  fecha_aceptacion: string | null
}
