import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import {
  ArrowLeft,
  ChefHat,
  Clock,
  Flame,
  ImageOff,
  Loader2,
  Users,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import AddToListButton from "@/components/modules/recipes/AddToListButton"
import { recipesService } from "@/services/recipes.service"
import type { RecetaDetalle, RecetaIngredienteDetalle } from "@/types/recipe"

function formatearCantidad(ing: RecetaIngredienteDetalle): string {
  if (ing.cantidad == null) return ing.unidad ?? ""
  return ing.unidad ? `${ing.cantidad} ${ing.unidad}` : String(ing.cantidad)
}

export default function RecipeDetail() {
  const { id } = useParams<{ id: string }>()
  const [receta, setReceta] = useState<RecetaDetalle | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [image_error, set_image_error] = useState(false)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    recipesService
      .get(Number(id))
      .then((result) => {
        if (!cancelled) setReceta(result)
      })
      .catch(() => {
        if (!cancelled) setNotFound(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) {
    return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
  }

  if (notFound || !receta) {
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
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          render={<Link to="/recetas" />}
          className="gap-1.5 text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Recetas
        </Button>
        <AddToListButton recetaId={receta.id_receta} />
      </div>

      {(receta.imagenes[0] ?? receta.imagen_url) && !image_error ? (
        <img
          src={receta.imagenes[0] ?? receta.imagen_url ?? undefined}
          alt={receta.nombre}
          onError={() => set_image_error(true)}
          className="aspect-[16/7] w-full rounded-3xl object-cover shadow-[var(--card-shadow)]"
        />
      ) : (
        <div
          role="img"
          aria-label={`Sin imagen para ${receta.nombre}`}
          className="hero-gradient flex aspect-[16/7] w-full items-center justify-center rounded-3xl border text-muted-foreground"
        >
          {image_error ? (
            <ImageOff className="h-12 w-12" />
          ) : (
            <ChefHat className="h-12 w-12" />
          )}
        </div>
      )}

      <div>
        <h1 className="text-brand-dark font-heading text-3xl font-bold">
          {receta.nombre}
        </h1>
        {receta.descripcion && (
          <p className="mt-1 text-muted-foreground">{receta.descripcion}</p>
        )}
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Clock className="h-4 w-4" /> {receta.tiempo_preparacion} min
        </span>
        <span className="flex items-center gap-1.5">
          <Users className="h-4 w-4" /> {receta.porciones} porciones
        </span>
        {receta.calorias_por_porcion != null && (
          <span className="flex items-center gap-1.5">
            <Flame className="h-4 w-4" /> {receta.calorias_por_porcion} kcal
          </span>
        )}
        {receta.dificultad && (
          <Badge variant="secondary">{receta.dificultad}</Badge>
        )}
      </div>

      {receta.categorias.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {receta.categorias.map((cat) => (
            <Badge key={cat} variant="outline">
              {cat}
            </Badge>
          ))}
        </div>
      )}

      {receta.ingredientes.length > 0 && (
        <Card className="surface-raised border-primary/10 p-5">
          <h2 className="mb-3 font-heading text-lg font-semibold">
            Ingredientes
          </h2>
          <ul className="space-y-1.5 text-sm">
            {receta.ingredientes.map((ing) => (
              <li
                key={ing.id_receta_ingrediente}
                className="flex justify-between gap-4"
              >
                <span>
                  {ing.nombre}
                  {ing.observaciones && (
                    <span className="text-muted-foreground">
                      {" "}
                      ({ing.observaciones})
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-muted-foreground">
                  {formatearCantidad(ing)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {receta.pasos.length > 0 && (
        <Card className="surface-raised border-primary/10 p-5">
          <h2 className="mb-3 font-heading text-lg font-semibold">
            Preparación
          </h2>
          <ol className="space-y-3 text-sm">
            {receta.pasos.map((paso) => (
              <li key={paso.id_paso} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {paso.numero_paso}
                </span>
                <span>
                  {paso.descripcion}
                  {paso.tiempo_minutos != null && (
                    <span className="text-muted-foreground">
                      {" "}
                      ({paso.tiempo_minutos} min)
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ol>
        </Card>
      )}
    </div>
  )
}
