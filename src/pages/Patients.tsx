import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
  Copy,
  Eye,
  Loader2,
  Search,
  Unlink,
  UserRound,
  Zap,
} from "lucide-react"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useConfirm } from "@/components/common/ConfirmDialog"
import { patientsService } from "@/services/patients.service"
import { formatDate } from "@/utils/format"
import type { CodigoVinculacion, PacienteVinculado } from "@/types/patient"

const ESTADO_LABEL: Record<CodigoVinculacion["estado"], string> = {
  activo: "Activo",
  usado: "Usado",
  expirado: "Expirado",
  revocado: "Revocado",
}

const ESTADO_VARIANT: Record<
  CodigoVinculacion["estado"],
  "default" | "secondary" | "destructive"
> = {
  activo: "default",
  usado: "secondary",
  expirado: "secondary",
  revocado: "destructive",
}

export default function Patients() {
  const confirm = useConfirm()

  const [codigos, setCodigos] = useState<CodigoVinculacion[]>([])
  const [loadingCodigos, setLoadingCodigos] = useState(true)
  const [generating, setGenerating] = useState(false)

  const [pacientes, setPacientes] = useState<PacienteVinculado[]>([])
  const [loadingPacientes, setLoadingPacientes] = useState(true)
  const [query, setQuery] = useState("")

  const loadCodigos = async () => {
    setLoadingCodigos(true)
    try {
      setCodigos(await patientsService.listarCodigos())
    } finally {
      setLoadingCodigos(false)
    }
  }

  const loadPacientes = async (q?: string) => {
    setLoadingPacientes(true)
    try {
      const { pacientes } = await patientsService.listarPacientes({ q })
      setPacientes(pacientes)
    } finally {
      setLoadingPacientes(false)
    }
  }

  useEffect(() => {
    void (async () => {
      await Promise.all([loadCodigos(), loadPacientes()])
    })()
  }, [])

  const handleGenerar = async () => {
    setGenerating(true)
    try {
      await patientsService.generarCodigo()
      toast.success("Código generado")
      await loadCodigos()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ocurrió un error")
    } finally {
      setGenerating(false)
    }
  }

  const handleCopiar = async (codigo: string) => {
    await navigator.clipboard.writeText(codigo)
    toast.success("Código copiado")
  }

  const handleRevocar = async (codigo: CodigoVinculacion) => {
    const ok = await confirm({
      title: "¿Revocar este código?",
      description: `El código ${codigo.codigo} dejará de poder canjearse.`,
      confirmText: "Revocar",
    })
    if (!ok) return
    try {
      await patientsService.revocarCodigo(codigo.id_codigo)
      toast.success("Código revocado")
      await loadCodigos()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ocurrió un error")
    }
  }

  const handleDesvincular = async (paciente: PacienteVinculado) => {
    const ok = await confirm({
      title: "¿Desvincular paciente?",
      description: `${paciente.nombre} ${paciente.apellido} dejará de estar vinculado a tu perfil.`,
      confirmText: "Desvincular",
    })
    if (!ok) return
    try {
      await patientsService.desvincularPaciente(paciente.id_paciente)
      toast.success("Paciente desvinculado")
      await loadPacientes(query || undefined)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ocurrió un error")
    }
  }

  const codigosActivos = codigos.filter((c) => c.estado === "activo")
  const codigosHistorial = codigos.filter((c) => c.estado !== "activo")

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-brand-dark font-heading text-3xl font-bold">
            Pacientes
          </h1>
          <p className="text-muted-foreground">
            Generá un código para que un paciente se vincule a tu perfil.
          </p>
        </div>
        <Button onClick={handleGenerar} disabled={generating} className="gap-1.5">
          {generating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Zap className="h-4 w-4" />
          )}
          Generar código
        </Button>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">
          Códigos activos
        </h2>
        {loadingCodigos ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : (
          <Card className="divide-y divide-border">
            {codigosActivos.map((c) => (
              <div key={c.id_codigo} className="flex items-center gap-3 p-4">
                <span className="font-mono text-lg tracking-widest">
                  {c.codigo}
                </span>
                <Badge variant={ESTADO_VARIANT[c.estado]}>
                  {ESTADO_LABEL[c.estado]}
                </Badge>
                <span className="flex-1 text-xs text-muted-foreground">
                  Vence el {formatDate(c.fecha_expiracion)}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopiar(c.codigo)}
                  className="gap-1 rounded-xl"
                >
                  <Copy className="h-4 w-4" /> Copiar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRevocar(c)}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  Revocar
                </Button>
              </div>
            ))}
            {codigosActivos.length === 0 && (
              <p className="p-6 text-center text-sm text-muted-foreground">
                No tenés códigos activos. Generá uno para vincular un paciente.
              </p>
            )}
          </Card>
        )}

        {codigosHistorial.length > 0 && (
          <details className="text-sm text-muted-foreground">
            <summary className="cursor-pointer select-none">
              Ver historial de códigos ({codigosHistorial.length})
            </summary>
            <Card className="mt-2 divide-y divide-border">
              {codigosHistorial.map((c) => (
                <div
                  key={c.id_codigo}
                  className="flex items-center gap-3 p-3 text-xs"
                >
                  <span className="font-mono tracking-widest">{c.codigo}</span>
                  <Badge variant={ESTADO_VARIANT[c.estado]}>
                    {ESTADO_LABEL[c.estado]}
                  </Badge>
                </div>
              ))}
            </Card>
          </details>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">
          Pacientes vinculados
        </h2>
        <div className="relative max-w-md">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              void loadPacientes(e.target.value || undefined)
            }}
            placeholder="Buscar por nombre…"
            className="rounded-xl pl-9"
          />
        </div>

        {loadingPacientes ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : (
          <Card className="divide-y divide-border">
            {pacientes.map((p) => (
              <div key={p.id_paciente} className="flex items-center gap-3 p-4">
                <div className="rounded-full bg-secondary p-2">
                  <UserRound className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {p.nombre} {p.apellido}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    Vinculado desde {formatDate(p.fecha_inicio)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  render={<Link to={`/pacientes/${p.id_paciente}`} />}
                  className="gap-1 rounded-xl"
                >
                  <Eye className="h-4 w-4" /> Ver perfil
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDesvincular(p)}
                  className="gap-1 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Unlink className="h-4 w-4" /> Desvincular
                </Button>
              </div>
            ))}
            {pacientes.length === 0 && (
              <p className="p-6 text-center text-sm text-muted-foreground">
                Todavía no tenés pacientes vinculados.
              </p>
            )}
          </Card>
        )}
      </section>
    </div>
  )
}
