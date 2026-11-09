import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDate, formatDateOnly } from "@/utils/format"
import type {
  CargadaPor,
  Medicion,
  RequerimientoNutricional,
} from "@/types/patient"

const REQUERIMIENTOS_VISIBLES = 10

const ORIGINADO_POR: Record<NonNullable<CargadaPor>, string> = {
  paciente: "Paciente",
  nutricionista: "Nutricionista",
}

/**
 * Historial de requerimientos nutricionales del paciente (KAL-133-03), solo
 * lectura: cada versión con su resultado, si fue calculada o prescrita, de
 * qué medición, objetivo y actividad salió, y quién la originó.
 */
export function RequirementsCard({
  requerimientos,
  mediciones,
  error,
  onReintentar,
}: {
  requerimientos: RequerimientoNutricional[] | null
  mediciones: Medicion[] | null
  error: string | null
  onReintentar: () => void
}) {
  const [todos, set_todos] = useState(false)

  // El servidor las manda en orden de alta: la última es la vigente. Se
  // muestran al revés, sin mutar la prop.
  const vigente = requerimientos?.[requerimientos.length - 1] ?? null
  const recientes = requerimientos ? [...requerimientos].reverse() : []
  const visibles = todos
    ? recientes
    : recientes.slice(0, REQUERIMIENTOS_VISIBLES)

  return (
    <Card className="space-y-4 p-5" aria-label="Requerimientos nutricionales">
      <div>
        <h2 className="font-heading text-lg font-semibold">
          Requerimientos nutricionales
        </h2>
        <p className="text-xs text-muted-foreground">
          Cada cambio de los objetivos nutricionales del paciente, con los datos
          de los que salió.
        </p>
      </div>

      {error ? (
        <div role="alert" className="space-y-2 text-sm">
          <p>{error}</p>
          <Button size="sm" variant="outline" onClick={onReintentar}>
            Reintentar
          </Button>
        </div>
      ) : requerimientos === null ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : requerimientos.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Todavía no hay requerimientos calculados.
        </p>
      ) : (
        <div className="space-y-2">
          <ul
            className="divide-y divide-border"
            aria-label="Historial de requerimientos"
          >
            {visibles.map((requerimiento) => (
              <Version
                key={requerimiento.id_requerimiento}
                requerimiento={requerimiento}
                mediciones={mediciones}
                vigente={
                  requerimiento.id_requerimiento === vigente?.id_requerimiento
                }
              />
            ))}
          </ul>
          {recientes.length > REQUERIMIENTOS_VISIBLES && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => set_todos((v) => !v)}
            >
              {todos
                ? "Ver menos"
                : `Ver los ${recientes.length} requerimientos`}
            </Button>
          )}
        </div>
      )}
    </Card>
  )
}

function Version({
  requerimiento,
  mediciones,
  vigente,
}: {
  requerimiento: RequerimientoNutricional
  mediciones: Medicion[] | null
  vigente: boolean
}) {
  const { resultado, calculo } = requerimiento
  const prescritos = resultado.prescrito_por_profesional ?? []
  const kcal_prescritas = prescritos.includes("get_objetivo_kcal")
  const kcal_formula = Math.round(calculo.get_objetivo_kcal)
  const muestra_formula =
    kcal_prescritas && kcal_formula !== Math.round(resultado.get_objetivo_kcal)

  const medicion =
    mediciones?.find((m) => m.id_medicion === requerimiento.id_medicion) ?? null
  const origen_medicion =
    mediciones === null
      ? "Medición no disponible"
      : medicion === null
        ? "Medición dada de baja"
        : `Medición del ${formatDateOnly(medicion.fecha_medicion)}: ${[
            medicion.peso_kg != null ? `${medicion.peso_kg} kg` : "—",
            medicion.altura_cm != null ? `${medicion.altura_cm} cm` : "—",
          ].join(" · ")}`
  const objetivo =
    requerimiento.objetivo?.nombre ??
    (requerimiento.objetivo_personalizado
      ? `Otro: ${requerimiento.objetivo_personalizado}`
      : "—")

  return (
    <li className="space-y-1 py-2.5 text-sm">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="font-medium">
          {formatDate(requerimiento.created_at)}
        </span>
        <span className="text-muted-foreground">
          ·{" "}
          {requerimiento.originado_por
            ? ORIGINADO_POR[requerimiento.originado_por]
            : "Automático"}
        </span>
        {prescritos.length > 0 ? (
          <Badge>Prescrito</Badge>
        ) : (
          <Badge variant="outline">Calculado</Badge>
        )}
        {vigente && <Badge variant="secondary">Vigente</Badge>}
      </div>
      <p className="tabular-nums">
        {Math.round(resultado.get_objetivo_kcal)} kcal · Proteínas{" "}
        {Math.round(resultado.proteinas_g)} g · Carbohidratos{" "}
        {Math.round(resultado.carbohidratos_g)} g · Grasas{" "}
        {Math.round(resultado.grasas_g)} g
        {muestra_formula && (
          <span className="ml-1.5 text-xs text-muted-foreground">
            la fórmula daba {kcal_formula} kcal
          </span>
        )}
      </p>
      <p className="text-xs text-muted-foreground">
        {origen_medicion} · Objetivo: {objetivo} · Actividad:{" "}
        <span className="capitalize">
          {requerimiento.nivel_actividad.nombre}
        </span>
      </p>
    </li>
  )
}
