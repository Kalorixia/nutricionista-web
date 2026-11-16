import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { FileDown, Loader2, ThumbsDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ProgressReportDialog } from "@/components/modules/patients/ProgressReportDialog"
import { cn } from "@/lib/utils"
import { ApiError } from "@/services/http"
import { patientsService } from "@/services/patients.service"
import { formatDateOnly } from "@/utils/format"
import { puntos_peso } from "@/utils/progreso"
import { ESTADO_REGISTRO, fecha_corta } from "@/utils/seguimiento"
import type { ConteoCumplimiento } from "@/types/mealPlan"
import type { Medicion } from "@/types/patient"
import type { HistorialProgreso, SemanaProgreso } from "@/types/progreso"

const SEMANAS_POR_PAGINA = 4
const DESVINCULADO = "Este paciente ya no está vinculado a tu perfil."

function mensaje(error: unknown, por_defecto: string): string {
  if (error instanceof ApiError && error.status === 404) return DESVINCULADO
  return error instanceof Error ? error.message : por_defecto
}

interface Carga {
  /** Identifica el pedido al que pertenece: paciente, versión e intento. */
  clave: string
  datos: HistorialProgreso | null
  semanas: SemanaProgreso[]
  siguiente_offset: number
  error: string | null
}

/**
 * Historial de progreso cruzando planes (KAL-87-03): adherencia por semana,
 * lo que el paciente preparó, el plan de cada comida y la evolución del peso
 * junto al objetivo vigente. Convive con el seguimiento de un plan y con las
 * mediciones, sin reemplazarlos.
 */
export function ProgressCard({
  idPaciente,
  idsPlanesPropios,
  version,
}: {
  idPaciente: number
  idsPlanesPropios: number[]
  version: number
}) {
  const [intento, set_intento] = useState(0)
  const [carga, set_carga] = useState<Carga | null>(null)
  const [cargando_mas, set_cargando_mas] = useState(false)
  const [error_mas, set_error_mas] = useState<string | null>(null)
  const [reporte_abierto, set_reporte_abierto] = useState(false)
  const clave = `${idPaciente}:${version}:${intento}`

  useEffect(() => {
    let vigente = true
    patientsService
      .obtenerProgreso(idPaciente, { limit: SEMANAS_POR_PAGINA, offset: 0 })
      .then((datos) => {
        if (!vigente) return
        set_error_mas(null)
        set_carga({
          clave,
          datos,
          semanas: datos.semanas,
          siguiente_offset: SEMANAS_POR_PAGINA,
          error: null,
        })
      })
      .catch((e) => {
        if (!vigente) return
        set_carga({
          clave,
          datos: null,
          semanas: [],
          siguiente_offset: 0,
          error: mensaje(e, "No pudimos cargar el progreso"),
        })
      })
    return () => {
      vigente = false
    }
  }, [idPaciente, clave])

  const actual = carga?.clave === clave ? carga : null

  const ver_anteriores = async () => {
    if (!actual) return
    set_cargando_mas(true)
    set_error_mas(null)
    try {
      const pagina = await patientsService.obtenerProgreso(idPaciente, {
        limit: SEMANAS_POR_PAGINA,
        offset: actual.siguiente_offset,
      })
      set_carga((previa) =>
        previa && previa.clave === actual.clave
          ? {
              ...previa,
              semanas: [...previa.semanas, ...pagina.semanas],
              siguiente_offset: previa.siguiente_offset + SEMANAS_POR_PAGINA,
            }
          : previa
      )
    } catch (e) {
      set_error_mas(mensaje(e, "No pudimos cargar más semanas"))
    } finally {
      set_cargando_mas(false)
    }
  }

  const datos = actual?.datos ?? null

  return (
    <Card className="space-y-4 p-5" aria-label="Progreso">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Progreso</h2>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() => set_reporte_abierto(true)}
        >
          <FileDown className="h-4 w-4" /> Descargar reporte
        </Button>
      </div>

      {!actual ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : actual.error || !datos ? (
        <div role="alert" className="space-y-2 text-sm">
          <p>{actual.error}</p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => set_intento((n) => n + 1)}
          >
            Reintentar
          </Button>
        </div>
      ) : (
        <>
          <Peso datos={datos} />
          {datos.planes.length > 0 && (
            <Planes datos={datos} propios={idsPlanesPropios} />
          )}
          {datos.total === 0 ? (
            <p className="text-sm text-muted-foreground">
              Todavía no hay progreso: el paciente no tiene planes publicados.
            </p>
          ) : (
            <div className="space-y-4">
              {actual.semanas.map((semana) => (
                <Semana key={semana.inicio} semana={semana} datos={datos} />
              ))}
              {actual.siguiente_offset < datos.total && (
                <div className="space-y-1.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={cargando_mas}
                    onClick={ver_anteriores}
                    className="gap-1.5"
                  >
                    {cargando_mas && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}{" "}
                    Ver semanas anteriores
                  </Button>
                  {error_mas && (
                    <p role="alert" className="text-sm text-destructive">
                      {error_mas}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {reporte_abierto && (
        <ProgressReportDialog
          idPaciente={idPaciente}
          onClose={() => set_reporte_abierto(false)}
        />
      )}
    </Card>
  )
}

const ANCHO_GRAFICO = 160
const ALTO_GRAFICO = 40

function diferencia_kg(desde: number, hasta: number): string {
  const dif = Math.round((hasta - desde) * 10) / 10
  const texto = Math.abs(dif).toLocaleString("es-AR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
  return `${dif > 0 ? "+" : dif < 0 ? "-" : ""}${texto} kg`
}

const kg = (valor: number) =>
  `${valor.toLocaleString("es-AR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg`

/** El peso junto al objetivo vigente, sin veredicto de meta (C4). */
function Peso({ datos }: { datos: HistorialProgreso }) {
  const objetivo =
    datos.objetivo?.nombre ??
    datos.objetivo_personalizado ??
    "Sin objetivo cargado"
  const con_peso: (Medicion & { peso_kg: number })[] = datos.mediciones.filter(
    (m): m is Medicion & { peso_kg: number } => m.peso_kg !== null
  )
  const primera = con_peso[0]
  const ultima = con_peso[con_peso.length - 1]
  const puntos = puntos_peso(con_peso, ANCHO_GRAFICO, ALTO_GRAFICO)

  return (
    <div className="space-y-1.5 text-sm">
      <p>
        <span className="text-muted-foreground">Objetivo:</span> {objetivo}
      </p>
      {con_peso.length === 0 ? (
        <p className="text-muted-foreground">Sin mediciones</p>
      ) : con_peso.length === 1 ? (
        <p>
          Peso: <span className="font-medium">{kg(primera.peso_kg)}</span> (
          {formatDateOnly(primera.fecha_medicion)})
        </p>
      ) : (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <p>
            Peso: {kg(primera.peso_kg)} (
            {formatDateOnly(primera.fecha_medicion)}) →{" "}
            <span className="font-medium">{kg(ultima.peso_kg)}</span> (
            {formatDateOnly(ultima.fecha_medicion)}){" "}
            <span className="font-medium tabular-nums">
              {diferencia_kg(primera.peso_kg, ultima.peso_kg)}
            </span>
          </p>
          <svg
            role="img"
            aria-label={`Evolución del peso: de ${kg(primera.peso_kg)} a ${kg(ultima.peso_kg)}`}
            viewBox={`0 0 ${ANCHO_GRAFICO} ${ALTO_GRAFICO}`}
            width={ANCHO_GRAFICO}
            height={ALTO_GRAFICO}
            className="text-primary"
          >
            <polyline
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
              points={puntos.map((p) => `${p.x},${p.y}`).join(" ")}
            />
          </svg>
        </div>
      )}
    </div>
  )
}

function Planes({
  datos,
  propios,
}: {
  datos: HistorialProgreso
  propios: number[]
}) {
  return (
    <div className="space-y-1.5">
      <h3 className="text-xs font-semibold text-muted-foreground">Planes</h3>
      <ul className="space-y-1 text-sm" aria-label="Planes del progreso">
        {datos.planes.map((plan) => {
          const nombre = propios.includes(plan.id_planificacion) ? (
            <Link
              to={`/planificacion/${plan.id_planificacion}`}
              className="font-medium underline-offset-2 hover:underline"
            >
              {plan.nombre}
            </Link>
          ) : (
            <span className="font-medium">{plan.nombre}</span>
          )
          return (
            <li key={plan.id_planificacion} className="flex flex-wrap gap-x-2">
              {nombre}
              <span className="text-muted-foreground">
                {plan.estado} · {fecha_corta(plan.desde, false)} –{" "}
                {fecha_corta(plan.hasta, false)} · {plan.nombre_nutricionista}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function Desglose({ conteo }: { conteo: ConteoCumplimiento }) {
  return (
    <span className="text-xs text-muted-foreground">
      {conteo.cumplidas} cumplidas · {conteo.con_cambios} con cambios ·{" "}
      {conteo.no_cumplidas} no · {conteo.sin_registro} sin registro
    </span>
  )
}

function Semana({
  semana,
  datos,
}: {
  semana: SemanaProgreso
  datos: HistorialProgreso
}) {
  const nombre_plan = (id: number) =>
    datos.planes.find((p) => p.id_planificacion === id)?.nombre ?? "Plan"
  const cruza_planes = semana.por_plan.length > 1

  return (
    <section
      className="space-y-2 border-t border-border pt-3"
      aria-label={`Semana del ${fecha_corta(semana.inicio, false)}`}
    >
      <div className="flex flex-wrap items-baseline gap-x-3">
        <h3 className="text-sm font-medium">
          {fecha_corta(semana.inicio, false)} – {fecha_corta(semana.fin, false)}
        </h3>
        <span className="font-semibold tabular-nums">
          {semana.adherencia.porcentaje_cumplimiento ?? 0}%
        </span>
        <Desglose conteo={semana.adherencia} />
      </div>

      {cruza_planes && (
        <ul className="space-y-0.5 text-xs" aria-label="Por plan">
          {semana.por_plan.map((p) => (
            <li key={p.id_planificacion} className="flex flex-wrap gap-x-2">
              <span className="font-medium">
                {nombre_plan(p.id_planificacion)}
              </span>
              <span className="tabular-nums">
                {p.conteo.porcentaje_cumplimiento ?? 0}%
              </span>
              <Desglose conteo={p.conteo} />
            </li>
          ))}
        </ul>
      )}

      {semana.recetas_preparadas.length > 0 && (
        <p className="text-xs">
          <span className="font-medium">Preparó:</span>{" "}
          {semana.recetas_preparadas
            .map((r) => `${r.nombre}${r.veces > 1 ? ` ×${r.veces}` : ""}`)
            .join(", ")}
        </p>
      )}

      <ul className="divide-y divide-border text-sm" aria-label="Por día">
        {semana.dias.map((dia) => (
          <li key={dia.fecha} className="space-y-1 py-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="w-20 shrink-0 font-medium capitalize">
                {fecha_corta(dia.fecha)}
              </span>
              {dia.comidas.map((comida) => (
                <span
                  key={comida.momento_comida}
                  title={comida.items.map((item) => item.nombre).join(", ")}
                  className={cn(
                    "rounded-md border px-2 py-0.5 text-xs",
                    comida.estado
                      ? ESTADO_REGISTRO[comida.estado].clase
                      : "border-dashed border-border text-muted-foreground"
                  )}
                >
                  {comida.momento_comida}
                  {cruza_planes && ` (${nombre_plan(comida.id_planificacion)})`}
                  {comida.estado ? "" : " · sin registro"}
                </span>
              ))}
            </div>
            {dia.comidas
              .filter(
                (c) =>
                  c.comentario ||
                  c.no_me_gustaron.length ||
                  c.estado === "con_cambios" ||
                  c.preparadas.length
              )
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
                    comida.estado === "con_cambios" && comida.items.length
                      ? `comió ${comida.items.map((i) => i.nombre).join(", ")}`
                      : null,
                    comida.preparadas.length
                      ? `preparó ${comida.preparadas.map((i) => i.nombre).join(", ")}`
                      : null,
                    comida.no_me_gustaron.length ? (
                      <ThumbsDownTexto
                        key="nmg"
                        items={comida.no_me_gustaron.map((i) => i.nombre)}
                      />
                    ) : null,
                  ]
                    .filter(Boolean)
                    .map((parte, i) => (
                      <span key={i}>
                        {i > 0 ? " · " : ""}
                        {parte}
                      </span>
                    ))}
                </p>
              ))}
          </li>
        ))}
      </ul>
    </section>
  )
}

function ThumbsDownTexto({ items }: { items: string[] }) {
  return (
    <span>
      <ThumbsDown className="mr-1 inline h-3 w-3" />
      no le gustó {items.join(", ")}
    </span>
  )
}
