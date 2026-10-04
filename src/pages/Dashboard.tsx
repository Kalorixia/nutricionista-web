import { useEffect, useState } from "react"
import { CalendarRange, Construction, Loader2, Users, Zap } from "lucide-react"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"
import { patientsService } from "@/services/patients.service"
import { mealPlansService } from "@/services/mealPlans.service"
import {
  nutritionistService,
  type ActividadItem,
} from "@/services/nutritionist.service"
import { formatDateTime } from "@/utils/format"
import { isNotImplemented } from "@/utils/errors"

/** "dev" = el endpoint real todavía no está implementado (backend 501). */
type StatValue = number | "dev" | "error"

interface Stats {
  pacientes: StatValue
  codigosActivos: StatValue
  planesPublicados: StatValue
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users
  label: string
  value: StatValue
}) {
  return (
    <Card className="surface-raised flex items-center gap-3 border-primary/10 p-5 transition-transform hover:-translate-y-0.5">
      <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="hero-gradient rounded-3xl border border-primary/10 p-6 sm:p-8">
        {value === "dev" ? (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Construction className="h-3.5 w-3.5" /> En desarrollo
          </p>
        ) : value === "error" ? (
          <p className="text-xs text-destructive">No se pudo cargar</p>
        ) : (
          <p className="text-2xl font-bold">{value}</p>
        )}
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </Card>
  )
}

function resolveStat(result: PromiseSettledResult<number>): StatValue {
  if (result.status === "fulfilled") return result.value
  return isNotImplemented(result.reason) ? "dev" : "error"
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [actividad, setActividad] = useState<ActividadItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setLoading(true)
      const [pacientes, codigos, planes, actividadResult] =
        await Promise.allSettled([
          patientsService.listarPacientes().then((r) => r.total),
          patientsService.listarCodigos("activo").then((r) => r.length),
          mealPlansService
            .list()
            .then((r) => r.filter((p) => p.estado === "publicada").length),
          nutritionistService.actividadReciente(),
        ])
      if (cancelled) return
      setStats({
        pacientes: resolveStat(pacientes),
        codigosActivos: resolveStat(codigos),
        planesPublicados: resolveStat(planes),
      })
      setActividad(
        actividadResult.status === "fulfilled" ? actividadResult.value : []
      )
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-brand-dark font-heading text-3xl font-bold">
          Hola, {user?.nombre?.trim() || "nutricionista"}
        </h1>
        <p className="text-muted-foreground">
          Este es un resumen de tu actividad en Kalorixia.
        </p>
      </div>

      {loading || !stats ? (
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            icon={Users}
            label="Pacientes vinculados"
            value={stats.pacientes}
          />
          <StatCard
            icon={Zap}
            label="Códigos activos"
            value={stats.codigosActivos}
          />
          <StatCard
            icon={CalendarRange}
            label="Planes publicados"
            value={stats.planesPublicados}
          />
        </div>
      )}

      <Card className="surface-raised divide-y divide-border overflow-hidden">
        <div className="p-4">
          <h2 className="font-heading text-sm font-semibold">
            Actividad reciente
          </h2>
        </div>
        {actividad.map((item) => (
          <div key={item.id} className="p-4 text-sm">
            <p>{item.mensaje}</p>
            <p className="text-xs text-muted-foreground">
              {formatDateTime(item.fecha)}
            </p>
          </div>
        ))}
        {actividad.length === 0 && !loading && (
          <p className="p-6 text-center text-sm text-muted-foreground">
            Sin actividad reciente.
          </p>
        )}
      </Card>
    </div>
  )
}
