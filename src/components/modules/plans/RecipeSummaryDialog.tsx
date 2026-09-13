import { Clock, Users, Flame } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import type { PlanRecetaResumen } from "@/types/mealPlan"

/**
 * Resumen de una receta del plan, sin salir del editor.
 *
 * El nutricionista revisa 28 casilleros antes de aprobar; obligarlo a abrir cada
 * receta en otra pantalla y volver hace que en la práctica no las revise. Con lo
 * que ya viene en el detalle del plan alcanza para decidir, y queda el enlace a
 * la receta completa para cuando haga falta.
 */
export function RecipeSummaryDialog({
  receta,
  momento,
  dia,
  onClose,
}: {
  receta: PlanRecetaResumen | null
  momento?: string
  dia?: string
  onClose: () => void
}) {
  if (!receta) return null

  const macros = [
    { etiqueta: "Proteínas", valor: receta.proteinas_g },
    { etiqueta: "Carbohidratos", valor: receta.carbohidratos_g },
    { etiqueta: "Grasas", valor: receta.grasas_totales_g },
  ].filter((macro) => macro.valor != null)

  return (
    <Dialog open onOpenChange={(abierto) => !abierto && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="pr-6 text-left">{receta.nombre}</DialogTitle>
        </DialogHeader>

        {dia && momento && (
          <p className="-mt-2 text-sm text-muted-foreground">
            {dia} · {momento}
          </p>
        )}

        {receta.imagen_url && (
          <img
            src={receta.imagen_url}
            alt=""
            className="aspect-video w-full rounded-lg object-cover"
            loading="lazy"
          />
        )}

        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <span className="flex items-center gap-1.5">
            <Clock aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
            {receta.tiempo_preparacion} min
          </span>
          <span className="flex items-center gap-1.5">
            <Users aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
            Rinde {receta.porciones}
          </span>
          {receta.calorias_por_porcion != null && (
            <span className="flex items-center gap-1.5">
              <Flame aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
              {Math.round(receta.calorias_por_porcion)} kcal por porción
            </span>
          )}
        </div>

        {macros.length > 0 && (
          <dl className="grid grid-cols-3 gap-2 rounded-lg bg-muted/50 p-3 text-center">
            {macros.map((macro) => (
              <div key={macro.etiqueta}>
                <dt className="text-xs text-muted-foreground">
                  {macro.etiqueta}
                </dt>
                <dd className="font-medium tabular-nums">
                  {Math.round(macro.valor as number)} g
                </dd>
              </div>
            ))}
          </dl>
        )}

        {receta.descripcion && (
          <p className="text-sm text-muted-foreground">{receta.descripcion}</p>
        )}

        {receta.categorias.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {receta.categorias.map((categoria) => (
              <Badge key={categoria} variant="secondary">
                {categoria}
              </Badge>
            ))}
          </div>
        )}

        <Button asChild variant="outline" className="w-full">
          <Link to={`/recetas/${receta.id_receta}`}>
            Ver la receta completa
          </Link>
        </Button>
      </DialogContent>
    </Dialog>
  )
}
