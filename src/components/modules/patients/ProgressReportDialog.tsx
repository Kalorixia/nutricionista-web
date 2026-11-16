import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ApiError } from "@/services/http"
import { patientsService } from "@/services/patients.service"
import { localDateIso } from "@/utils/format"
import { contenido_reporte, descargar_reporte_pdf } from "@/utils/reporte_pdf"
import type { ReporteProgreso } from "@/types/progreso"

const DIAS_POR_DEFECTO = 30
const DIAS_MAXIMOS = 366
const MS_DIA = 24 * 60 * 60 * 1000

const a_utc = (iso: string) => {
  const [anio, mes, dia] = iso.split("-").map(Number)
  return Date.UTC(anio, mes - 1, dia)
}

/** Días del período contando los dos extremos. */
const dias_inclusive = (desde: string, hasta: string) =>
  Math.round((a_utc(hasta) - a_utc(desde)) / MS_DIA) + 1

/** Los mismos mensajes que da el servidor, para no pedir lo que va a rechazar. */
function error_periodo(
  desde: string,
  hasta: string,
  hoy: string
): string | null {
  if (!desde || !hasta) return "Elegí las dos fechas"
  if (desde > hasta)
    return "La fecha desde no puede ser posterior a la fecha hasta"
  if (hasta > hoy) return "El período no puede incluir fechas futuras"
  if (dias_inclusive(desde, hasta) > DIAS_MAXIMOS)
    return "El período no puede superar los 366 días"
  return null
}

function periodo_por_defecto(hoy: string) {
  const fecha = new Date(`${hoy}T12:00:00`)
  fecha.setDate(fecha.getDate() - (DIAS_POR_DEFECTO - 1))
  return localDateIso(fecha)
}

/**
 * Descargar el reporte de progreso de un período (KAL-87-03). Pide los datos
 * al servidor y arma el PDF en el cliente. La matrícula viene en el reporte.
 */
export function ProgressReportDialog({
  idPaciente,
  onClose,
}: {
  idPaciente: number
  onClose: () => void
}) {
  const [hoy] = useState(() => localDateIso(new Date()))
  const [desde, set_desde] = useState(() => periodo_por_defecto(hoy))
  const [hasta, set_hasta] = useState(hoy)
  const [busy, set_busy] = useState(false)
  const [error, set_error] = useState<string | null>(null)

  const descargar = async () => {
    const invalido = error_periodo(desde, hasta, hoy)
    if (invalido) {
      set_error(invalido)
      return
    }
    set_busy(true)
    set_error(null)
    let reporte: ReporteProgreso
    try {
      reporte = await patientsService.obtenerReporte(idPaciente, desde, hasta)
    } catch (e) {
      set_error(
        e instanceof ApiError && e.status === 404
          ? "Este paciente ya no está vinculado a tu perfil."
          : e instanceof Error
            ? e.message
            : "No pudimos obtener el reporte"
      )
      set_busy(false)
      return
    }
    try {
      await descargar_reporte_pdf(contenido_reporte(reporte))
      onClose()
    } catch {
      set_error("No se pudo generar el PDF. Intentá de nuevo.")
      set_busy(false)
    }
  }

  return (
    <Dialog open onOpenChange={(abierto) => !abierto && !busy && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Descargar reporte de progreso</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            Incluye el perfil, el plan, la frecuencia de consumo, la adherencia
            y las mediciones del período elegido. Si no hay registros, el
            reporte lo dice.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">Desde</span>
              <Input
                type="date"
                aria-label="Desde"
                value={desde}
                max={hoy}
                disabled={busy}
                onChange={(event) => set_desde(event.target.value)}
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">Hasta</span>
              <Input
                type="date"
                aria-label="Hasta"
                value={hasta}
                max={hoy}
                disabled={busy}
                onChange={(event) => set_hasta(event.target.value)}
              />
            </label>
          </div>
          {error && (
            <p role="alert" className="text-destructive">
              {error}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" disabled={busy} onClick={onClose}>
            Cancelar
          </Button>
          <Button disabled={busy} onClick={descargar} className="gap-1.5">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Descargar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
