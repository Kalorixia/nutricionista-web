import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { ArrowLeft, ChefHat, Clock, Flame, Loader2, Users } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { recipesService } from "@/services/recipes.service"
import type { Recipe } from "@/types/recipe"

export default function RecipeDetail() {
  const { id } = useParams<{ id: string }>()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    recipesService.get(id).then((result) => {
      if (!cancelled) setRecipe(result ?? null)
      if (!cancelled) setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) {
    return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
  }

  if (!recipe) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Receta no encontrada.</p>
        <Button variant="outline" render={<Link to="/recetas" />}>
          Volver a recetas
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Button
        variant="ghost"
        size="sm"
        render={<Link to="/recetas" />}
        className="gap-1.5 text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Recetas
      </Button>

      <div className="flex h-48 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
        <ChefHat className="h-12 w-12" />
      </div>

      <div>
        <h1 className="text-brand-dark font-heading text-3xl font-bold">
          {recipe.titulo}
        </h1>
        <p className="mt-1 text-muted-foreground">{recipe.descripcion}</p>
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Clock className="h-4 w-4" /> {recipe.tiempo_min} min
        </span>
        <span className="flex items-center gap-1.5">
          <Users className="h-4 w-4" /> {recipe.porciones} porciones
        </span>
        {recipe.calorias && (
          <span className="flex items-center gap-1.5">
            <Flame className="h-4 w-4" /> {recipe.calorias} kcal
          </span>
        )}
        <Badge variant="secondary">{recipe.dificultad}</Badge>
      </div>

      {recipe.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {recipe.tags.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      <Card className="p-5">
        <h2 className="mb-3 font-heading text-lg font-semibold">
          Ingredientes
        </h2>
        <ul className="space-y-1.5 text-sm">
          {recipe.ingredientes.map((ing) => (
            <li key={ing.nombre} className="flex justify-between">
              <span>{ing.nombre}</span>
              <span className="text-muted-foreground">{ing.cantidad}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="p-5">
        <h2 className="mb-3 font-heading text-lg font-semibold">
          Preparación
        </h2>
        <ol className="space-y-3 text-sm">
          {recipe.pasos.map((paso, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {i + 1}
              </span>
              <span>{paso}</span>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  )
}
