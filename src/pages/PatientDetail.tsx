import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeft,
  ClipboardList,
  Construction,
  Loader2,
  Plus,
  Unlink,
} from "lucide-react"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useConfirm } from "@/components/common/ConfirmDialog"
import { patientsService } from "@/services/patients.service"
import { mealPlansService } from "@/services/mealPlans.service"
import { formatDate } from "@/utils/format"
import { isNotImplemented } from "@/utils/errors"
import { ClinicalProfileCard } from "@/components/modules/patients/ClinicalProfileCard"
import { PreferencesCard } from "@/components/modules/patients/PreferencesCard"
import type { PacienteDetalle, PerfilPaciente } from "@/types/patient"
import type { Planificacion } from "@/types/mealPlan"

function calcularEdad(fechaNacimiento: string): number {
  const nacimiento = new Date(fechaNacimiento)
  const hoy = new Date()
  let edad = hoy.getFullYear() - nacimiento.getFullYear()
  const aunNoCumplio =
    hoy.getMonth() < nacimiento.getMonth() ||
    (hoy.getMonth() === nacimiento.getMonth() &&
      hoy.getDate() < nacimiento.getDate())
  if (aunNoCumplio) edad -= 1
  return edad
}

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const confirm = useConfirm()

  const [paciente, setPaciente] = useState<PacienteDetalle | null>(null)
  const [perfil, set_perfil] = useState<PerfilPaciente | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [notImplemented, setNotImplemented] = useState(false)

  const [planes, setPlanes] = useState<Planificacion[]>([])
  const [loadingPlanes, setLoadingPlanes] = useState(true)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    void (async () => {
      setLoading(true)
      try {
        const result = await patientsService.obtenerPaciente(Number(id))
        if (!cancelled) setPaciente(result)
      } catch (error) {
        if (cancelled) return
        if (isNotImplemented(error)) setNotImplemented(true)
        else setNotFound(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  useEffect(() => {
    if (!id) return
    let cancelled = false
    void (async () => {
      try {
        const result = await patientsService.obtenerPerfil(Number(id))
        if (!cancelled) set_perfil(result)
      } catch {
        // El perfil clínico es un agregado de esta pantalla: si falla, el resto
        // del detalle sigue siendo util.
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  useEffect(() => {
    if (!id) return
    let cancelled = false
    void (async () => {
      setLoadingPlanes(true)
      try {
        const result = await mealPlansService.list(Number(id))
        if (!cancelled) setPlanes(result)
      } catch {
        // El listado de planes es un agregado secundario en esta pantalla;
        // si falla, no bloqueamos el resto del detalle del paciente.
      } finally {
        if (!cancelled) setLoadingPlanes(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  const handleDesvincular = async () => {
    if (!paciente) return
    const ok = await confirm({
      title: "¿Desvincular paciente?",
      description: `${paciente.nombre} ${paciente.apellido} dejará de estar vinculado a tu perfil.`,
      confirmText: "Desvincular",
    })
    if (!ok) return
    try {
      await patientsService.desvincularPaciente(paciente.id_paciente)
      toast.success("Paciente desvinculado")
      navigate("/pacientes", { replace: true })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ocurrió un error")
    }
  }

  if (loading) {
    return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
  }

  if (notImplemented) {
    return (
      <div className="space-y-4">
        <p className="flex items-center gap-2 text-muted-foreground">
          <Construction className="h-4 w-4" /> El detalle de pacientes todavía
          está en desarrollo en el backend.
        </p>
        <Button variant="outline" render={<Link to="/pacientes" />}>
          Volver a pacientes
        </Button>
      </div>
    )
  }

  if (notFound || !paciente) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Paciente no encontrado.</p>
        <Button variant="outline" render={<Link to="/pacientes" />}>
          Volver a pacientes
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Button
        variant="ghost"
        size="sm"
        render={<Link to="/pacientes" />}
        className="gap-1.5 text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Pacientes
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-brand-dark font-heading text-3xl font-bold">
            {paciente.nombre} {paciente.apellido}
          </h1>
          <p className="text-muted-foreground">
            Vinculado desde {formatDate(paciente.fecha_inicio)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            render={
              <Link to={`/planificacion?paciente=${paciente.id_paciente}`} />
            }
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" /> Crear plan
          </Button>
          <Button
            variant="ghost"
            onClick={handleDesvincular}
            className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Unlink className="h-4 w-4" /> Desvincular
          </Button>
        </div>
      </div>

      <Card className="grid grid-cols-2 gap-4 p-5 text-sm">
        <div>
          <p className="text-muted-foreground">Edad</p>
          <p className="font-medium">
            {calcularEdad(paciente.fecha_nacimiento)} años
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Sexo biológico</p>
          <p className="font-medium capitalize">{paciente.sexo_biologico}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Peso</p>
          <p className="font-medium">{paciente.peso_kg} kg</p>
        </div>
        <div>
          <p className="text-muted-foreground">Altura</p>
          <p className="font-medium">{paciente.altura_cm} cm</p>
        </div>
        <div>
          <p className="text-muted-foreground">Objetivo</p>
          <p className="font-medium capitalize">{paciente.objetivo}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Nivel de actividad</p>
          <p className="font-medium capitalize">{paciente.nivel_actividad}</p>
        </div>
      </Card>

      {perfil && <ClinicalProfileCard perfil={perfil} onChange={set_perfil} />}
      {perfil && (
        <PreferencesCard
          idPaciente={perfil.id_paciente}
          preferencias={perfil.preferencias}
          onChange={(preferencias) =>
            set_perfil((actual) =>
              actual ? { ...actual, preferencias } : actual
            )
          }
        />
      )}

      <Card className="space-y-3 p-5">
        <div>
          <p className="mb-1.5 text-sm text-muted-foreground">
            Condiciones médicas
          </p>
          <div className="flex flex-wrap gap-1.5">
            {paciente.condiciones_medicas.length > 0 ? (
              paciente.condiciones_medicas.map((c) => (
                <Badge key={c} variant="secondary">
                  {c}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">
                Sin registrar
              </span>
            )}
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-sm text-muted-foreground">
            Restricciones alimentarias
          </p>
          <div className="flex flex-wrap gap-1.5">
            {paciente.restricciones_alimentarias.length > 0 ? (
              paciente.restricciones_alimentarias.map((r) => (
                <Badge key={r} variant="secondary">
                  {r}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">
                Sin registrar
              </span>
            )}
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">
          Planes de alimentación
        </h2>
        {loadingPlanes ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <Card className="divide-y divide-border">
            {planes.map((plan) => (
              <Link
                key={plan.id_planificacion}
                to={`/planificacion/${plan.id_planificacion}`}
                className="flex items-center gap-3 p-4 hover:bg-secondary/50"
              >
                <div className="rounded-full bg-secondary p-2">
                  <ClipboardList className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{plan.nombre}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {plan.estado} · {plan.cantidad_recetas} recetas
                  </p>
                </div>
              </Link>
            ))}
            {planes.length === 0 && (
              <p className="p-6 text-center text-sm text-muted-foreground">
                Todavía no le creaste ningún plan.
              </p>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}
