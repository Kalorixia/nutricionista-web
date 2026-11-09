import { useState } from "react"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useConfirm } from "@/components/common/ConfirmDialog"
import { ApiError } from "@/services/http"
import { patientsService } from "@/services/patients.service"
import { formatDateOnly, localDateIso } from "@/utils/format"
import type { CargadaPor, Medicion } from "@/types/patient"

const MEDICIONES_VISIBLES = 10

const CARGADA_POR: Record<NonNullable<CargadaPor>, string> = {
  paciente: "Paciente",
  nutricionista: "Nutricionista",
}

/**
 * Historial de mediciones del paciente (KAL-133-03): el nutricionista lo ve,
 * registra una medición nueva y da de baja una cargada por error. La lista la
 * carga la página; la tarjeta escribe y avisa con `onCambio` para que se
 * refresque todo lo que depende del peso y la altura vigentes.
 */
export function MeasurementsCard({
  idPaciente,
  mediciones,
  error,
  pesoVigente,
  alturaVigente,
  onCambio,
  onReintentar,
}: {
  idPaciente: number
  mediciones: Medicion[] | null
  error: string | null
  pesoVigente: number | null
  alturaVigente: number | null
  onCambio: () => void
  onReintentar: () => void
}) {
  const confirm = useConfirm()
  const [abierto, set_abierto] = useState(false)
  const [enviando, set_enviando] = useState(false)
  const [peso, set_peso] = useState("")
  const [altura, set_altura] = useState("")
  const [fecha, set_fecha] = useState("")
  const [todas, set_todas] = useState(false)

  const abrir = () => {
    set_peso(pesoVigente != null ? String(pesoVigente) : "")
    set_altura(alturaVigente != null ? String(alturaVigente) : "")
    set_fecha(localDateIso(new Date()))
    set_abierto(true)
  }

  const registrar = async () => {
    if (enviando) return
    set_enviando(true)
    try {
      await patientsService.registrarMedicion(idPaciente, {
        peso_kg: Number(peso),
        altura_cm: Number(altura),
        fecha_medicion: fecha,
      })
      toast.success("Medición registrada")
      set_abierto(false)
      onCambio()
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "No pudimos registrar la medición"
      )
      if (e instanceof ApiError && e.status === 404) onCambio()
    } finally {
      set_enviando(false)
    }
  }

  const dar_de_baja = async (medicion: Medicion) => {
    if (enviando) return
    const fecha_texto = formatDateOnly(medicion.fecha_medicion)
    const ok = await confirm({
      title: "¿Dar de baja la medición?",
      description: `La medición del ${fecha_texto} deja de contar y de listarse, pero se conserva en el historial clínico. Si es la más reciente, el peso y la altura vigentes vuelven a los de la anterior.`,
      confirmText: "Dar de baja",
    })
    if (!ok) return
    set_enviando(true)
    try {
      await patientsService.darDeBajaMedicion(idPaciente, medicion.id_medicion)
      toast.success("Medición dada de baja")
      onCambio()
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "No pudimos dar de baja la medición"
      )
      if (e instanceof ApiError && e.status === 404) onCambio()
    } finally {
      set_enviando(false)
    }
  }

  // El servidor las manda de la más antigua a la más reciente: la última es
  // la vigente. Se muestran al revés, sin mutar la prop.
  const vigente = mediciones?.[mediciones.length - 1] ?? null
  const recientes = mediciones ? [...mediciones].reverse() : []
  const visibles = todas ? recientes : recientes.slice(0, MEDICIONES_VISIBLES)
  const unica = mediciones?.length === 1

  return (
    <Card className="space-y-4 p-5" aria-label="Mediciones">
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-heading text-lg font-semibold">Mediciones</h2>
        {!abierto && (
          <Button
            size="sm"
            variant="ghost"
            onClick={abrir}
            disabled={enviando}
            className="gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" /> Registrar medición
          </Button>
        )}
      </div>

      {abierto && (
        <form
          aria-label="Registrar medición"
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault()
            void registrar()
          }}
        >
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <Label htmlFor="medicion-peso">Peso (kg)</Label>
              <Input
                id="medicion-peso"
                type="number"
                step="0.1"
                min="0.1"
                max="500"
                required
                value={peso}
                disabled={enviando}
                onChange={(event) => set_peso(event.target.value)}
                className="w-28"
              />
            </div>
            <div>
              <Label htmlFor="medicion-altura">Altura (cm)</Label>
              <Input
                id="medicion-altura"
                type="number"
                step="0.1"
                min="30"
                max="300"
                required
                value={altura}
                disabled={enviando}
                onChange={(event) => set_altura(event.target.value)}
                className="w-28"
              />
            </div>
            <div>
              <Label htmlFor="medicion-fecha">Fecha</Label>
              <Input
                id="medicion-fecha"
                type="date"
                min="1900-01-01"
                max={localDateIso(new Date())}
                required
                value={fecha}
                disabled={enviando}
                onChange={(event) => set_fecha(event.target.value)}
                className="w-40"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Si es la medición más reciente, pasa a ser el peso y la altura
            vigentes y se recalculan los objetivos.
          </p>
          <div className="flex gap-2">
            <Button
              type="submit"
              size="sm"
              disabled={enviando}
              className="gap-1.5"
            >
              {enviando && <Loader2 className="h-3.5 w-3.5 animate-spin" />}{" "}
              Guardar
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={enviando}
              onClick={() => set_abierto(false)}
            >
              Cancelar
            </Button>
          </div>
        </form>
      )}

      {error ? (
        <div role="alert" className="space-y-2 text-sm">
          <p>{error}</p>
          <Button size="sm" variant="outline" onClick={onReintentar}>
            Reintentar
          </Button>
        </div>
      ) : mediciones === null ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : mediciones.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Todavía no hay mediciones registradas.
        </p>
      ) : (
        <div className="space-y-2">
          <div className="overflow-x-auto">
            <table
              className="w-full text-left text-sm"
              aria-label="Historial de mediciones"
            >
              <thead className="text-xs text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="py-1.5 pr-3 font-medium">Fecha</th>
                  <th className="py-1.5 pr-3 font-medium">Peso</th>
                  <th className="py-1.5 pr-3 font-medium">Altura</th>
                  <th className="py-1.5 pr-3 font-medium">Cargada por</th>
                  <th className="py-1.5">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visibles.map((medicion) => {
                  const fecha_texto = formatDateOnly(medicion.fecha_medicion)
                  return (
                    <tr key={medicion.id_medicion}>
                      <td className="py-1.5 pr-3 whitespace-nowrap">
                        {fecha_texto}
                        {medicion.id_medicion === vigente?.id_medicion && (
                          <Badge variant="secondary" className="ml-1.5">
                            Vigente
                          </Badge>
                        )}
                      </td>
                      <td className="py-1.5 pr-3 tabular-nums">
                        {medicion.peso_kg != null
                          ? `${medicion.peso_kg} kg`
                          : "—"}
                      </td>
                      <td className="py-1.5 pr-3 tabular-nums">
                        {medicion.altura_cm != null
                          ? `${medicion.altura_cm} cm`
                          : "—"}
                      </td>
                      <td className="py-1.5 pr-3">
                        {medicion.cargada_por
                          ? CARGADA_POR[medicion.cargada_por]
                          : "Carga inicial"}
                      </td>
                      <td className="py-1.5 text-right">
                        {!unica && (
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            disabled={enviando}
                            aria-label={`Dar de baja la medición del ${fecha_texto}`}
                            onClick={() => void dar_de_baja(medicion)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {unica && (
            <p className="text-xs text-muted-foreground">
              Es la única medición: para corregirla, registrá la correcta y
              después dala de baja.
            </p>
          )}
          {recientes.length > MEDICIONES_VISIBLES && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => set_todas((v) => !v)}
            >
              {todas ? "Ver menos" : `Ver las ${recientes.length} mediciones`}
            </Button>
          )}
        </div>
      )}
    </Card>
  )
}
