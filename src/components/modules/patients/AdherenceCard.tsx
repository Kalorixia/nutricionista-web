import { useEffect, useState } from "react"
import { Loader2, ThumbsDown } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { mealPlansService } from "@/services/mealPlans.service"
import { fecha_corta, plan_por_defecto } from "@/utils/seguimiento"
import type {
  ConteoCumplimiento,
  EstadoRegistro,
  Planificacion,
  Seguimiento,
} from "@/types/mealPlan"

const DIAS_VISIBLES = 14

const ESTADO: Record<EstadoRegistro, { label: string; clase: string }> = {
  cumplida: {
    label: "Cumplida",
    clase:
      "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
  },
  con_cambios: {
    label: "Con cambios",
    clase:
      "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
  },
  no_cumplida: {
    label: "No cumplida",
    clase:
      "border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200",
  },
}

/**
 * Lo que el paciente registró sobre su plan (KAL-132-05): cumplimiento por
 * semana, día y comida, lo que no le gustó y la última fecha con registro.
 */
export function AdherenceCard({ planes }: { planes: Planificacion[] }) {
  const elegibles = planes.filter((p) => p.estado !== "borrador")
  const inicial = plan_por_defecto(planes)
  const [id_plan, set_id_plan] = useState<number | null>(
    inicial?.id_planificacion ?? null
  )
  const [datos, set_datos] = useState<Seguimiento | null>(null)
  const [error, set_error] = useState<string | null>(null)
  const [todos, set_todos] = useState(false)
  const [intento, set_intento] = useState(0)

  useEffect(() => {
    if (id_plan === null) return
    let vigente = true
    mealPlansService
      .followUp(id_plan)
      .then((resultado) => {
        if (!vigente) return
        set_datos(resultado)
        set_error(null)
      })
      .catch((e) => {
        if (!vigente) return
        set_datos(null)
        set_error(
          e instanceof Error ? e.message : "No pudimos cargar el seguimiento"
        )
      })
    return () => {
      vigente = false
    }
  }, [id_plan, intento])

  if (id_plan === null) return null
  const cargando = !error && datos?.id_planificacion !== id_plan
  const dias = datos
    ? todos
      ? datos.dias
      : datos.dias.slice(0, DIAS_VISIBLES)
    : []

  return (
    <Card className="space-y-4 p-5" aria-label="Seguimiento">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Seguimiento del plan</h2>
        {elegibles.length > 1 && (
          <select
            aria-label="Plan a seguir"
            value={id_plan}
            onChange={(event) => {
              set_id_plan(Number(event.target.value))
              set_todos(false)
            }}
            className="rounded-lg border border-border bg-background p-1.5 text-sm"
          >
            {elegibles.map((plan) => (
              <option key={plan.id_planificacion} value={plan.id_planificacion}>
                {plan.nombre} ({plan.estado})
              </option>
            ))}
          </select>
        )}
      </div>

      {error ? (
        <div role="alert" className="space-y-2 text-sm">
          <p>{error}</p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => set_intento((n) => n + 1)}
          >
            Reintentar
          </Button>
        </div>
      ) : cargando || !datos ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : datos.desde === null ? (
        <p className="text-sm text-muted-foreground">
          El plan todavía no empezó: no hay comidas para registrar.
        </p>
      ) : (
        <>
          <Resumen conteo={datos.resumen} />
          <p className="text-xs text-muted-foreground">
            Del {fecha_corta(datos.desde, false)} al{" "}
            {fecha_corta(datos.hasta ?? datos.desde, false)} ·{" "}
            {datos.ultima_fecha_registro
              ? `Último registro: ${fecha_corta(datos.ultima_fecha_registro)}`
              : "El paciente todavía no registró comidas"}
          </p>

          {datos.no_me_gustaron.length > 0 && (
            <div className="space-y-1.5">
              <h3 className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <ThumbsDown className="h-3.5 w-3.5" /> No le gustó
              </h3>
              <ul className="flex flex-wrap gap-1.5" aria-label="No le gustó">
                {datos.no_me_gustaron.map((item) => (
                  <li
                    key={item.id_receta}
                    className="rounded-full border border-border px-2.5 py-0.5 text-xs"
                  >
                    {item.nombre}
                    {item.veces > 1 ? ` ×${item.veces}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {datos.semanas.length > 1 && (
            <div className="space-y-1.5">
              <h3 className="text-xs font-semibold text-muted-foreground">
                Por semana
              </h3>
              <ul className="space-y-1 text-sm" aria-label="Por semana">
                {datos.semanas.map((semana) => (
                  <li key={semana.inicio} className="flex flex-wrap gap-x-3">
                    <span className="w-28 text-muted-foreground">
                      {fecha_corta(semana.inicio, false)} –{" "}
                      {fecha_corta(semana.fin, false)}
                    </span>
                    <span className="font-medium tabular-nums">
                      {semana.porcentaje_cumplimiento ?? 0}%
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {semana.cumplidas} cumplidas · {semana.con_cambios} con
                      cambios · {semana.no_cumplidas} no · {semana.sin_registro}{" "}
                      sin registro
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-1.5">
            <h3 className="text-xs font-semibold text-muted-foreground">
              Por día
            </h3>
            <ul className="divide-y divide-border text-sm" aria-label="Por día">
              {dias.map((dia) => (
                <li key={dia.fecha} className="space-y-1 py-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="w-20 shrink-0 font-medium capitalize">
                      {fecha_corta(dia.fecha)}
                    </span>
                    {dia.comidas.map((comida) => (
                      <span
                        key={comida.momento_comida}
                        title={comida.items
                          .map((item) => item.nombre)
                          .join(", ")}
                        className={cn(
                          "rounded-md border px-2 py-0.5 text-xs",
                          comida.estado
                            ? ESTADO[comida.estado].clase
                            : "border-dashed border-border text-muted-foreground"
                        )}
                      >
                        {comida.momento_comida}
                        {comida.estado ? "" : " · sin registro"}
                      </span>
                    ))}
                  </div>
                  {dia.comidas
                    .filter((c) => c.comentario || c.no_me_gustaron.length)
                    .map((comida) => (
                      <p
                        key={comida.momento_comida}
                        className="pl-20 text-xs text-muted-foreground"
                      >
                        <span className="font-medium text-foreground">
                          {comida.momento_comida}:
                        </span>{" "}
                        {[
                          comida.comentario ? `“${comida.comentario}”` : null,
                          comida.no_me_gustaron.length
                            ? `no le gustó ${comida.no_me_gustaron.map((i) => i.nombre).join(", ")}`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    ))}
                </li>
              ))}
            </ul>
            {datos.dias.length > DIAS_VISIBLES && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => set_todos((v) => !v)}
              >
                {todos ? "Ver menos" : `Ver los ${datos.dias.length} días`}
              </Button>
            )}
          </div>
        </>
      )}
    </Card>
  )
}

function Resumen({ conteo }: { conteo: ConteoCumplimiento }) {
  return (
    <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
      <div>
        <p className="text-3xl font-bold tabular-nums">
          {conteo.porcentaje_cumplimiento ?? 0}%
        </p>
        <p className="text-xs text-muted-foreground">
          de {conteo.esperadas} comidas cumplidas
        </p>
      </div>
      <dl className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {(
          [
            ["Cumplidas", conteo.cumplidas],
            ["Con cambios", conteo.con_cambios],
            ["No cumplidas", conteo.no_cumplidas],
            ["Sin registro", conteo.sin_registro],
          ] as const
        ).map(([label, valor]) => (
          <div key={label}>
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="font-medium tabular-nums">{valor}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
