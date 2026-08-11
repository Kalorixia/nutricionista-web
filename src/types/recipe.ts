export interface RecipeIngredient {
  nombre: string
  cantidad: string
}

export type RecipeDifficulty = "facil" | "media" | "dificil"

export interface Recipe {
  id: string
  titulo: string
  imagen: string | null
  descripcion: string
  tiempo_min: number
  porciones: number
  dificultad: RecipeDifficulty
  tags: string[]
  ingredientes: RecipeIngredient[]
  pasos: string[]
  calorias: number | null
}

export interface RecipeList {
  id: string
  nombre: string
  recetaIds: string[]
  shareId: string
  fecha_creacion: string
}
