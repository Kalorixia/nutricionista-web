/** `alimento` = se come sin preparar: una porción, sin pasos (KAL-131-02). */
export type TipoReceta = "receta" | "alimento"

export interface RecetaListItem {
  id_receta: number
  nombre: string
  descripcion: string | null
  tiempo_preparacion: number
  porciones: number
  dificultad: string | null
  calorias_por_porcion: number | null
  estado_nutricional: "pendiente" | "validada" | null
  imagen_url: string | null
  publica: boolean
  created_at: string
  updated_at: string | null
  tipo?: TipoReceta
  porcion_descripcion?: string | null
  categorias: string[]
}

export interface RecetaIngredienteDetalle {
  id_receta_ingrediente: number
  nombre: string
  cantidad: number | null
  unidad: string | null
  observaciones: string | null
}

export interface PasoDetalle {
  id_paso: number
  numero_paso: number
  descripcion: string
  tiempo_minutos: number | null
  imagen_url: string | null
}

export interface RecetaDetalle extends RecetaListItem {
  id_usuario: number
  imagenes: string[]
  ingredientes: RecetaIngredienteDetalle[]
  pasos: PasoDetalle[]
}

export interface Categoria {
  id_categoria: number
  nombre: string
  descripcion: string | null
  icono: string | null
}

export interface ListaRecetasResponse {
  recetas: RecetaListItem[]
  total: number
  limit: number | null
  offset: number
}

export interface ListaReceta {
  id_lista: number
  nombre: string
  publica: boolean
  created_at: string
  receta_ids: number[]
}

export interface ListaRecetaDetalle {
  id_lista: number
  nombre: string
  publica: boolean
  created_at: string
  recetas: RecetaListItem[]
}
