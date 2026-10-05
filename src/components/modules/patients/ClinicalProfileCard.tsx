import { useState } from "react"
import { Loader2, Pencil } from "lucide-react"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ClinicalProfileForm } from "@/components/modules/patients/ClinicalProfileForm"
import { patientsService } from "@/services/patients.service"
import type { PerfilPaciente } from "@/types/patient"

/**
 * Perfil clínico del paciente, editable por el profesional.
 *
 * El profesional corrige todo lo físico y clínico (sexo, peso, altura,
 * actividad, objetivo, condiciones y restricciones) sin depender de que el
 * paciente lo haga desde la app. Nombre y fecha de nacimiento no (KAL-131-07).
 *
 * Los objetivos se prescriben aparte: son una decisión clínica, no un dato
 * físico. Lo prescrito gana sobre el cálculo y sobrevive a que el paciente
 * cambie su peso, por eso se muestra siempre junto a lo que la fórmula
 * sugeriría — para que el profesional pueda comparar y decidir.
 */
export function ClinicalProfileCard({
  perfil,
  onChange,
}: {
  perfil: PerfilPaciente
  onChange: (perfil: PerfilPaciente) => void
}) {
  const [editando, set_editando] = useState<"datos" | "objetivo" | null>(null)
  const [guardando, set_guardando] = useState(false)
  const [kcal, set_kcal] = useState("")

  const calculo = perfil.calculo_nutricional
  const prescritos = calculo?.prescrito_por_profesional ?? []
  const kcal_prescritas = prescritos.includes("get_objetivo_kcal")
  const sugerido = calculo?.calculado?.get_objetivo_kcal
  // Un objetivo propio no tiene fórmula: el paciente queda sin energía
  // objetivo hasta que el profesional la prescribe (KAL-131-06).
  const objetivo_propio = perfil.objetivo_personalizado ?? null
  const datos_completos =
    perfil.peso_kg != null &&
    perfil.altura_cm != null &&
    perfil.fecha_nacimiento != null &&
    perfil.sexo_biologico != null &&
    perfil.nivel_actividad != null
  const puede_prescribir =
    calculo != null || (objetivo_propio != null && datos_completos)

  const guardar = async (accion: () => Promise<PerfilPaciente>) => {
    if (guardando) return
    set_guardando(true)
    try {
      onChange(await accion())
      set_editando(null)
      toast.success("Perfil actualizado")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No pudimos guardar el cambio"
      )
    } finally {
      set_guardando(false)
    }
  }

  const abrir_datos = () => set_editando("datos")

  const abrir_objetivo = () => {
    set_kcal(
      calculo?.get_objetivo_kcal != null
        ? String(Math.round(calculo.get_objetivo_kcal))
        : ""
    )
    set_editando("objetivo")
  }

  return (
    <Card className="space-y-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-heading text-lg font-semibold">Perfil clínico</h2>
        {editando === null && (
          <Button
            size="sm"
            variant="ghost"
            onClick={abrir_datos}
            className="gap-1.5"
          >
            <Pencil className="h-3.5 w-3.5" /> Editar datos
          </Button>
        )}
      </div>

      {editando === "datos" ? (
        <ClinicalProfileForm
          perfil={perfil}
          guardando={guardando}
          onGuardar={(cambios) =>
            void guardar(() =>
              patientsService.actualizarPerfil(perfil.id_paciente, cambios)
            )
          }
          onCancelar={() => set_editando(null)}
        />
      ) : (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
          <Dato
            etiqueta="Peso"
            valor={perfil.peso_kg != null ? `${perfil.peso_kg} kg` : null}
          />
          <Dato
            etiqueta="Altura"
            valor={perfil.altura_cm != null ? `${perfil.altura_cm} cm` : null}
          />
          <Dato
            etiqueta="Objetivo"
            valor={
              perfil.objetivo?.nombre ??
              (objetivo_propio ? `Otro: ${objetivo_propio}` : null)
            }
          />
          <Dato
            etiqueta="Actividad"
            valor={perfil.nivel_actividad?.nombre ?? null}
          />
        </dl>
      )}

      <div className="border-t border-border pt-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-medium">Objetivos nutricionales</h3>
            {kcal_prescritas ? (
              <p className="text-xs text-muted-foreground">
                Los fijaste vos. Se mantienen aunque el paciente cambie su peso.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Calculados automáticamente a partir del perfil.
              </p>
            )}
          </div>
          {editando === null && puede_prescribir && (
            <Button
              size="sm"
              variant="ghost"
              onClick={abrir_objetivo}
              className="gap-1.5"
            >
              <Pencil className="h-3.5 w-3.5" /> Prescribir
            </Button>
          )}
        </div>

        {!calculo && editando !== "objetivo" && (
          <p className="mt-2 text-sm text-muted-foreground">
            {objetivo_propio && datos_completos
              ? "El paciente eligió un objetivo propio, que no tiene fórmula. Prescribí la energía para calcular sus macros; mientras tanto, el Copiloto genera sin objetivo energético."
              : "Faltan datos físicos del paciente para calcular sus objetivos."}
          </p>
        )}

        {editando === "objetivo" && (
          <form
            className="mt-3 flex flex-wrap items-end gap-3"
            onSubmit={(event) => {
              event.preventDefault()
              void guardar(() =>
                patientsService.prescribirObjetivo(
                  perfil.id_paciente,
                  kcal.trim() ? { get_objetivo_kcal: Number(kcal) } : {}
                )
              )
            }}
          >
            <div>
              <Label htmlFor="perfil-kcal">Energía diaria (kcal)</Label>
              <Input
                id="perfil-kcal"
                type="number"
                min="1"
                max="10000"
                value={kcal}
                disabled={guardando}
                onChange={(event) => set_kcal(event.target.value)}
                className="w-32"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Vacío vuelve al cálculo automático
                {sugerido != null && ` (${Math.round(sugerido)} kcal)`}.
              </p>
            </div>
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
              onClick={() => set_editando(null)}
            >
              Cancelar
            </Button>
          </form>
        )}

        {calculo && editando !== "objetivo" && (
          <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
            <Dato
              etiqueta="Energía"
              valor={`${Math.round(calculo.get_objetivo_kcal)} kcal`}
              prescrito={kcal_prescritas}
              sugerido={
                kcal_prescritas && sugerido != null
                  ? `${Math.round(sugerido)} kcal`
                  : null
              }
            />
            <Dato
              etiqueta="Proteínas"
              valor={`${Math.round(calculo.proteinas_g)} g`}
              prescrito={prescritos.includes("proteinas_g")}
            />
            <Dato
              etiqueta="Carbohidratos"
              valor={`${Math.round(calculo.carbohidratos_g)} g`}
              prescrito={prescritos.includes("carbohidratos_g")}
            />
            <Dato
              etiqueta="Grasas"
              valor={`${Math.round(calculo.grasas_g)} g`}
              prescrito={prescritos.includes("grasas_g")}
            />
          </dl>
        )}
      </div>

      {(perfil.condiciones_medicas.length > 0 ||
        perfil.restricciones_alimentarias.length > 0) && (
        <div className="flex flex-wrap gap-1.5 border-t border-border pt-4">
          {perfil.condiciones_medicas.map((condicion) => (
            <Badge key={`c-${condicion.nombre}`} variant="secondary">
              {condicion.nombre}
              {condicion.detalle ? `: ${condicion.detalle}` : ""}
            </Badge>
          ))}
          {perfil.restricciones_alimentarias.map((restriccion) => (
            <Badge key={`r-${restriccion.nombre}`} variant="outline">
              {restriccion.tipo ? `${restriccion.tipo}: ` : ""}
              {restriccion.nombre}
            </Badge>
          ))}
        </div>
      )}
    </Card>
  )
}

function Dato({
  etiqueta,
  valor,
  prescrito,
  sugerido,
}: {
  etiqueta: string
  valor: string | null
  prescrito?: boolean
  sugerido?: string | null
}) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{etiqueta}</dt>
      <dd className="font-medium tabular-nums">
        {valor ?? "—"}
        {prescrito && (
          <span className="ml-1.5 text-xs font-normal text-primary">
            prescrito
          </span>
        )}
      </dd>
      {sugerido && (
        <dd className="text-xs text-muted-foreground">
          la fórmula sugiere {sugerido}
        </dd>
      )}
    </div>
  )
}
