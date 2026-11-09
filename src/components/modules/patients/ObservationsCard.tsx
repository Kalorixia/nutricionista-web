import { useEffect, useState, type FormEvent } from "react"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useConfirm } from "@/components/common/ConfirmDialog"
import { ApiError } from "@/services/http"
import { patientsService } from "@/services/patients.service"
import { formatDateTime } from "@/utils/format"
import type { Observacion } from "@/types/patient"

const VISIBLES = 10
const MAX_TEXTO = 5000

function recargaPorEstado(e: unknown): boolean {
  return e instanceof ApiError && (e.status === 403 || e.status === 404)
}

/**
 * Notas clínicas del nutricionista sobre el paciente (KAL-133-04): historial de
 * todos los autores, alta y baja de las propias. Carga sus propios datos.
 */
export function ObservationsCard({ idPaciente }: { idPaciente: number }) {
  const confirm = useConfirm()
  const [observaciones, setObservaciones] = useState<Observacion[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [intento, setIntento] = useState(0)
  const [abierto, setAbierto] = useState(false)
  const [texto, setTexto] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [recargando, setRecargando] = useState(false)
  const [todas, setTodas] = useState(false)

  useEffect(() => {
    let vigente = true
    const cargar = async () => {
      try {
        const lista = await patientsService.listarObservaciones(idPaciente)
        if (!vigente) return
        setObservaciones(lista)
        setError(null)
      } catch (e) {
        if (!vigente) return
        setError(
          e instanceof ApiError && e.status === 404
            ? "Este paciente ya no está vinculado a tu perfil."
            : e instanceof Error
              ? e.message
              : "No pudimos cargar las observaciones"
        )
      } finally {
        if (vigente) setRecargando(false)
      }
    }
    void cargar()
    return () => {
      vigente = false
    }
  }, [idPaciente, intento])

  // Mientras se recarga no se permite otra alta o baja: la respuesta de la
  // recarga, pedida antes, pisaría ese cambio en la lista.
  const recargar = () => {
    setRecargando(true)
    setIntento((n) => n + 1)
  }

  const cerrar = () => {
    setAbierto(false)
    setTexto("")
  }

  const guardar = async (event: FormEvent) => {
    event.preventDefault()
    setEnviando(true)
    try {
      const nueva = await patientsService.crearObservacion(idPaciente, {
        texto,
      })
      toast.success("Observación registrada")
      setObservaciones((actuales) => [...(actuales ?? []), nueva])
      cerrar()
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "No pudimos registrar la observación"
      )
      if (e instanceof ApiError && e.status === 404) recargar()
    } finally {
      setEnviando(false)
    }
  }

  const darDeBaja = async (obs: Observacion) => {
    const fecha = formatDateTime(obs.created_at)
    const ok = await confirm({
      title: "¿Dar de baja la observación?",
      description: `La observación del ${fecha} deja de listarse, pero se conserva en el historial clínico. No se puede deshacer.`,
      confirmText: "Dar de baja",
    })
    if (!ok) return
    setEnviando(true)
    try {
      await patientsService.darDeBajaObservacion(idPaciente, obs.id_observacion)
      toast.success("Observación dada de baja")
      setObservaciones((actuales) =>
        (actuales ?? []).filter((o) => o.id_observacion !== obs.id_observacion)
      )
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "No pudimos dar de baja la observación"
      )
      if (recargaPorEstado(e)) recargar()
    } finally {
      setEnviando(false)
    }
  }

  const recientes = observaciones ? [...observaciones].reverse() : []
  const visibles = todas ? recientes : recientes.slice(0, VISIBLES)

  return (
    <Card className="space-y-4 p-5" aria-label="Observaciones clínicas">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="font-heading text-lg font-semibold">
            Observaciones clínicas
          </h2>
          <p className="text-xs text-muted-foreground">
            Notas de evolución para los profesionales que atienden al paciente.
            El paciente no las ve.
          </p>
        </div>
        {!abierto && observaciones !== null && !error && (
          <Button size="sm" variant="ghost" onClick={() => setAbierto(true)}>
            <Plus className="h-4 w-4" /> Agregar observación
          </Button>
        )}
      </div>

      {abierto && (
        <form onSubmit={guardar} className="space-y-2">
          <Label htmlFor="observacion-texto">Nueva observación</Label>
          <Textarea
            id="observacion-texto"
            required
            maxLength={MAX_TEXTO}
            rows={4}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              No se puede editar: para corregirla, dala de baja y cargá otra.
            </span>
            <span>
              {texto.length}/{MAX_TEXTO}
            </span>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={enviando || recargando}>
              {enviando && <Loader2 className="h-3.5 w-3.5 animate-spin" />}{" "}
              Guardar
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={cerrar}
              disabled={enviando}
            >
              Cancelar
            </Button>
          </div>
        </form>
      )}

      {error ? (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-md border border-destructive/40 p-3 text-sm text-destructive"
        >
          <span>{error}</span>
          <Button size="sm" variant="outline" onClick={recargar}>
            Reintentar
          </Button>
        </div>
      ) : observaciones === null ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : recientes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Todavía no hay observaciones.
        </p>
      ) : (
        <>
          <ul
            className="divide-y divide-border"
            aria-label="Historial de observaciones"
          >
            {visibles.map((obs) => {
              const fecha = formatDateTime(obs.created_at)
              return (
                <li key={obs.id_observacion} className="space-y-1 py-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">
                      {obs.autor_nombre} {obs.autor_apellido}
                    </span>
                    <span className="text-muted-foreground">{fecha}</span>
                    {obs.es_propia && <Badge variant="outline">Tuya</Badge>}
                    {obs.es_propia && (
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        className="ml-auto"
                        aria-label={`Dar de baja la observación del ${fecha}`}
                        disabled={enviando || recargando}
                        onClick={() => void darDeBaja(obs)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-sm break-words whitespace-pre-line">
                    {obs.texto}
                  </p>
                </li>
              )
            })}
          </ul>
          {recientes.length > VISIBLES && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setTodas((v) => !v)}
            >
              {todas
                ? "Ver menos"
                : `Ver las ${recientes.length} observaciones`}
            </Button>
          )}
        </>
      )}
    </Card>
  )
}
