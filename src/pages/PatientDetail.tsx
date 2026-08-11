import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Loader2, Unlink } from "lucide-react"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useConfirm } from "@/components/common/ConfirmDialog"
import { patientsService } from "@/services/patients.service"
import { formatDate } from "@/utils/format"
import type { PacienteDetalle } from "@/types/patient"

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
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    void (async () => {
      setLoading(true)
      try {
        const result = await patientsService.obtenerPaciente(Number(id))
        if (!cancelled) setPaciente(result)
      } catch {
        if (!cancelled) setNotFound(true)
      } finally {
        if (!cancelled) setLoading(false)
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
        <Button
          variant="ghost"
          onClick={handleDesvincular}
          className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Unlink className="h-4 w-4" /> Desvincular
        </Button>
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
    </div>
  )
}
