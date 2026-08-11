// MOCK — ver services/mocks/recipes.mock.ts para el detalle de qué falta
// en el backend real.
import { recipes } from "@/services/mocks/recipes.mock"
import { delay } from "@/services/mockUtils"
import type { Recipe } from "@/types/recipe"

export const recipesService = {
  async list(query?: string): Promise<Recipe[]> {
    const q = query?.trim().toLowerCase()
    const filtered = q
      ? recipes.filter(
          (r) =>
            r.titulo.toLowerCase().includes(q) ||
            r.tags.some((tag) => tag.toLowerCase().includes(q))
        )
      : recipes
    return delay(filtered)
  },

  async get(id: string): Promise<Recipe | undefined> {
    return delay(recipes.find((r) => r.id === id))
  },

  async byIds(ids: string[]): Promise<Recipe[]> {
    return delay(recipes.filter((r) => ids.includes(r.id)))
  },
}
