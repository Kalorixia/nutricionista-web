import { useEffect, useState } from "react"
import { CalendarRange, Loader2, Users, Zap } from "lucide-react"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"
import { patientsService } from "@/services/patients.service"
import { mealPlansService } from "@/services/mealPlans.service"
import { dashboardService } from "@/services/dashboard.service"
import { formatDateTime } from "@/utils/format"
import type { ActivityItem } from "@/services/mocks/dashboard.mock"

interface Stats {
  pacientes: number
  codigosActivos: number
  planesPublicados: number
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [actividad, setActividad] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      patientsService.listarPacientes(),
      patientsService.listarCodigos("activo"),
      mealPlansService.list(),
      dashboardService.recentActivity(),
    ])
      .then(([{ total }, codigos, planes, actividad]) => {
        setStats({
          pacientes: total,
          codigosActivos: codigos.length,
          planesPublicados: planes.filter((p) => p.estado === "publicada")
            .length,
        })
        setActividad(actividad)
      })
      .finally(() => setLoading(false))
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
          <Card className="flex items-center gap-3 p-5">
            <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.pacientes}</p>
              <p className="text-sm text-muted-foreground">
                Pacientes vinculados
              </p>
            </div>
          </Card>
          <Card className="flex items-center gap-3 p-5">
            <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.codigosActivos}</p>
              <p className="text-sm text-muted-foreground">Códigos activos</p>
            </div>
          </Card>
          <Card className="flex items-center gap-3 p-5">
            <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
              <CalendarRange className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.planesPublicados}</p>
              <p className="text-sm text-muted-foreground">
                Planes publicados
              </p>
            </div>
          </Card>
        </div>
      )}

      <Card className="divide-y divide-border">
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
