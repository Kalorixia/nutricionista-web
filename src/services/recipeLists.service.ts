// MOCK — ver services/mocks/recipeLists.mock.ts.
import { recipeLists } from "@/services/mocks/recipeLists.mock"
import { delay, newId } from "@/services/mockUtils"
import type { RecipeList } from "@/types/recipe"

function findOrThrow(id: string): RecipeList {
  const list = recipeLists.find((l) => l.id === id)
  if (!list) throw new Error("Lista no encontrada")
  return list
}

export const recipeListsService = {
  async list(): Promise<RecipeList[]> {
    return delay(
      [...recipeLists].sort((a, b) =>
        b.fecha_creacion.localeCompare(a.fecha_creacion)
      )
    )
  },

  async create(nombre: string): Promise<RecipeList> {
    const list: RecipeList = {
      id: newId("list"),
      nombre,
      recetaIds: [],
      shareId: Math.random().toString(36).slice(2, 10),
      fecha_creacion: new Date().toISOString(),
    }
    recipeLists.unshift(list)
    return delay(list)
  },

  async toggleRecipe(listId: string, recetaId: string): Promise<RecipeList> {
    const list = findOrThrow(listId)
    list.recetaIds = list.recetaIds.includes(recetaId)
      ? list.recetaIds.filter((id) => id !== recetaId)
      : [...list.recetaIds, recetaId]
    return delay(list)
  },

  async remove(id: string): Promise<void> {
    const index = recipeLists.findIndex((l) => l.id === id)
    if (index !== -1) recipeLists.splice(index, 1)
    return delay(undefined, 50)
  },
}
