export type EstadoPlan = "borrador" | "aprobada" | "publicada"

export interface MealSlot {
  id: string
  nombre: string
}

export interface DiaPlan {
  dia: string
  comidas: Record<string, string[]>
}

export interface MealPlan {
  id: string
  nombre: string
  objetivo: string
  id_paciente: number | null
  nombre_paciente: string | null
  estado: EstadoPlan
  slots: MealSlot[]
  dias: DiaPlan[]
  fecha_creacion: string
  fecha_publicacion: string | null
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

export const SLOTS_POR_DEFECTO: MealSlot[] = [
  { id: "desayuno", nombre: "Desayuno" },
  { id: "almuerzo", nombre: "Almuerzo" },
  { id: "merienda", nombre: "Merienda" },
  { id: "cena", nombre: "Cena" },
]
