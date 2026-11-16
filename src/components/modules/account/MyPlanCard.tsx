import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { subscriptionService } from "@/services/subscription.service"
import type { MiSuscripcion } from "@/types/subscription"

function mesLabel(mes: string): string {
  const [anio, numero] = mes.split("-").map(Number)
  if (!anio || !numero) return mes
  return new Date(anio, numero - 1, 1).toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric",
  })
}

function UsageRow({
  label,
  used,
  max,
}: {
  label: string
  used: number
  max: number
}) {
  const atLimit = used >= max
  const percent = max > 0 ? Math.min(100, (used / max) * 100) : 100
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between">
        <span className="text-muted-foreground">{label}</span>
        <span
          className={atLimit ? "font-semibold text-destructive" : "font-medium"}
        >
          {used} de {max}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${atLimit ? "bg-destructive" : "bg-primary"}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {atLimit && (
        <p className="text-xs text-destructive">
          Llegaste al límite de tu plan
        </p>
      )}
    </div>
  )
}

export default function MyPlanCard() {
  const [data, setData] = useState<MiSuscripcion | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    subscriptionService
      .getMine()
      .then((result) => {
        if (!cancelled) setData(result)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <Card className="space-y-4 p-5 text-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold">Mi plan</h2>
        {data && <Badge>{data.plan.nombre}</Badge>}
      </div>
      {loading && (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      )}
      {failed && (
        <p className="text-muted-foreground">No pudimos cargar tu plan.</p>
      )}
      {data && (
        <>
          <UsageRow
            label="Pacientes activos"
            used={data.uso.pacientes_activos}
            max={data.plan.max_pacientes_activos}
          />
          <UsageRow
            label={`Borradores del Copiloto en ${mesLabel(data.uso.mes)}`}
            used={data.uso.generaciones_mes}
            max={data.plan.max_generaciones_mes}
          />
          <p className="text-sm">
            Tus pacientes pueden hacer hasta{" "}
            <span className="font-semibold">
              {data.plan.max_consultas_asistente_dia}
            </span>{" "}
            consultas por día al asistente de cocina.
          </p>
          <p className="text-xs text-muted-foreground">
            Los pedidos al Copiloto que fallan no cuentan. El cupo se renueva el
            primer día de cada mes. Para cambiar de plan, contactá al
            administrador.
          </p>
        </>
      )}
    </Card>
  )
}
