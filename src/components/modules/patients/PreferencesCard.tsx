import { useState } from "react"
import { Loader2, Pencil } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { patientsService } from "@/services/patients.service"
import type { PreferenciasPaciente } from "@/types/patient"

const TIEMPOS: Record<string, string> = {
  menos_15: "menos de 15 min",
  "15_30": "15 a 30 min",
  "30_60": "30 a 60 min",
  mas_60: "más de una hora",
}
const HABILIDADES: Record<string, string> = {
  basica: "básica",
  intermedia: "intermedia",
  avanzada: "avanzada",
}
const PRESUPUESTOS: Record<string, string> = {
  ajustado: "ajustado",
  medio: "medio",
  holgado: "holgado",
}
const MOMENTOS = ["Desayuno", "Almuerzo", "Merienda", "Cena"] as const
const SELECT_CLASS =
  "w-full rounded-lg border border-border bg-background p-2 text-sm"

const lista = (texto: string) =>
  texto
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)

/**
 * Gustos y hábitos del paciente (KAL-132-01). Los carga él desde la app; el
 * profesional los completa o corrige con lo que conversaron en consulta. El
 * Copiloto los usa como orientación, nunca por encima de una restricción.
 */
export function PreferencesCard({
  idPaciente,
  preferencias,
  onChange,
}: {
  idPaciente: number
  preferencias: PreferenciasPaciente | null | undefined
  onChange: (preferencias: PreferenciasPaciente | null) => void
}) {
  const [editando, set_editando] = useState(false)
  const [guardando, set_guardando] = useState(false)
  const [borrador, set_borrador] = useState<PreferenciasPaciente>({})
  const [gustos, set_gustos] = useState("")
  const [evitar, set_evitar] = useState("")

  const abrir = () => {
    set_borrador({ ...(preferencias ?? {}) })
    set_gustos((preferencias?.le_gustan ?? []).join(", "))
    set_evitar((preferencias?.prefiere_evitar ?? []).join(", "))
    set_editando(true)
  }

  const guardar = async () => {
    set_guardando(true)
    try {
      const cuerpo: PreferenciasPaciente = {
        ...borrador,
        le_gustan: lista(gustos),
        prefiere_evitar: lista(evitar),
      }
      for (const clave of Object.keys(
        cuerpo
      ) as (keyof PreferenciasPaciente)[]) {
        const valor = cuerpo[clave]
        if (
          valor == null ||
          valor === "" ||
          (Array.isArray(valor) && !valor.length)
        )
          delete cuerpo[clave]
      }
      onChange(await patientsService.guardarPreferencias(idPaciente, cuerpo))
      set_editando(false)
      toast.success("Preferencias guardadas")
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No pudimos guardar las preferencias"
      )
    } finally {
      set_guardando(false)
    }
  }

  const datos: [string, string | null][] = [
    ["Le gustan", preferencias?.le_gustan?.join(", ") || null],
    ["Prefiere evitar", preferencias?.prefiere_evitar?.join(", ") || null],
    [
      "Tiempo para cocinar",
      preferencias?.tiempo_cocina_semana ||
      preferencias?.tiempo_cocina_fin_de_semana
        ? [
            preferencias?.tiempo_cocina_semana &&
              `semana: ${TIEMPOS[preferencias.tiempo_cocina_semana]}`,
            preferencias?.tiempo_cocina_fin_de_semana &&
              `fin de semana: ${TIEMPOS[preferencias.tiempo_cocina_fin_de_semana]}`,
          ]
            .filter(Boolean)
            .join(" · ")
        : null,
    ],
    [
      "Cocina",
      preferencias?.habilidad_cocina
        ? HABILIDADES[preferencias.habilidad_cocina]
        : null,
    ],
    ["Fuera de casa o vianda", preferencias?.comidas_fuera?.join(", ") || null],
    [
      "Presupuesto",
      preferencias?.presupuesto ? PRESUPUESTOS[preferencias.presupuesto] : null,
    ],
    [
      "Cocina para",
      preferencias?.personas_hogar
        ? `${preferencias.personas_hogar} ${preferencias.personas_hogar === 1 ? "persona" : "personas"}`
        : null,
    ],
    ["Comentarios", preferencias?.comentarios || null],
  ]
  const respondidas = datos.filter(([, valor]) => valor)

  return (
    <Card className="space-y-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-semibold">Preferencias</h2>
          <p className="text-xs text-muted-foreground">
            Orientan al Copiloto; no reemplazan a las restricciones.
          </p>
        </div>
        {!editando && (
          <Button size="sm" variant="ghost" onClick={abrir} className="gap-1.5">
            <Pencil className="h-3.5 w-3.5" /> Editar preferencias
          </Button>
        )}
      </div>

      {!editando &&
        (respondidas.length ? (
          <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            {respondidas.map(([etiqueta, valor]) => (
              <div key={etiqueta}>
                <dt className="text-xs text-muted-foreground">{etiqueta}</dt>
                <dd>{valor}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">
            El paciente todavía no contó sus preferencias.
          </p>
        ))}

      {editando && (
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault()
            void guardar()
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="pref-gustos">
                Le gustan (separados por coma)
              </Label>
              <Input
                id="pref-gustos"
                value={gustos}
                disabled={guardando}
                onChange={(event) => set_gustos(event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="pref-evitar">
                Prefiere evitar (separados por coma)
              </Label>
              <Input
                id="pref-evitar"
                value={evitar}
                disabled={guardando}
                onChange={(event) => set_evitar(event.target.value)}
              />
            </div>
            {(
              [
                ["tiempo_cocina_semana", "Tiempo en la semana", TIEMPOS],
                [
                  "tiempo_cocina_fin_de_semana",
                  "Tiempo el fin de semana",
                  TIEMPOS,
                ],
                ["habilidad_cocina", "Habilidad en la cocina", HABILIDADES],
                ["presupuesto", "Presupuesto", PRESUPUESTOS],
              ] as const
            ).map(([clave, etiqueta, opciones]) => (
              <div key={clave}>
                <Label htmlFor={`pref-${clave}`}>{etiqueta}</Label>
                <select
                  id={`pref-${clave}`}
                  className={SELECT_CLASS}
                  disabled={guardando}
                  value={(borrador[clave] as string | null | undefined) ?? ""}
                  onChange={(event) =>
                    set_borrador((actual) => ({
                      ...actual,
                      [clave]: event.target.value || null,
                    }))
                  }
                >
                  <option value="">Sin dato</option>
                  {Object.entries(opciones).map(([valor, texto]) => (
                    <option key={valor} value={valor}>
                      {texto}
                    </option>
                  ))}
                </select>
              </div>
            ))}
            <div>
              <Label htmlFor="pref-personas">Cocina para (personas)</Label>
              <Input
                id="pref-personas"
                type="number"
                min="1"
                max="12"
                disabled={guardando}
                value={borrador.personas_hogar ?? ""}
                onChange={(event) =>
                  set_borrador((actual) => ({
                    ...actual,
                    personas_hogar: event.target.value
                      ? Number(event.target.value)
                      : null,
                  }))
                }
              />
            </div>
          </div>
          <fieldset className="space-y-1">
            <legend className="text-sm font-medium">
              Fuera de casa o vianda
            </legend>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {MOMENTOS.map((momento) => (
                <label
                  key={momento}
                  className="flex items-center gap-2 text-sm"
                >
                  <Checkbox
                    disabled={guardando}
                    checked={(borrador.comidas_fuera ?? []).includes(momento)}
                    onCheckedChange={() =>
                      set_borrador((actual) => {
                        const actuales = actual.comidas_fuera ?? []
                        return {
                          ...actual,
                          comidas_fuera: MOMENTOS.filter((item) =>
                            item === momento
                              ? !actuales.includes(momento)
                              : actuales.includes(item)
                          ),
                        }
                      })
                    }
                  />
                  {momento}
                </label>
              ))}
            </div>
          </fieldset>
          <div>
            <Label htmlFor="pref-comentarios">Comentarios</Label>
            <Textarea
              id="pref-comentarios"
              maxLength={1000}
              disabled={guardando}
              value={borrador.comentarios ?? ""}
              onChange={(event) =>
                set_borrador((actual) => ({
                  ...actual,
                  comentarios: event.target.value,
                }))
              }
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="submit"
              size="sm"
              disabled={guardando}
              className="gap-1.5"
            >
              {guardando && <Loader2 className="h-3.5 w-3.5 animate-spin" />}{" "}
              Guardar
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={guardando}
              onClick={() => set_editando(false)}
            >
              Cancelar
            </Button>
          </div>
        </form>
      )}
    </Card>
  )
}
