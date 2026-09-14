import { useState } from "react"
import { Loader2, Pencil } from "lucide-react"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { patientsService } from "@/services/patients.service"
import type { PerfilPaciente } from "@/types/patient"

/**
 * Perfil clínico del paciente, editable por el profesional.
 *
 * Hasta ahora estos datos sólo los podía tocar el paciente desde su app, así
 * que un peso mal cargado en el onboarding quedaba mal para siempre y el
 * nutricionista no tenía forma de corregirlo.
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
  const [peso, set_peso] = useState("")
  const [altura, set_altura] = useState("")
  const [kcal, set_kcal] = useState("")

  const calculo = perfil.calculo_nutricional
  const prescritos = calculo?.prescrito_por_profesional ?? []
  const kcal_prescritas = prescritos.includes("get_objetivo_kcal")
  const sugerido = calculo?.calculado?.get_objetivo_kcal

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

  const abrir_datos = () => {
    set_peso(perfil.peso_kg != null ? String(perfil.peso_kg) : "")
    set_altura(perfil.altura_cm != null ? String(perfil.altura_cm) : "")
    set_editando("datos")
  }

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
          <Button size="sm" variant="ghost" onClick={abrir_datos} className="gap-1.5">
            <Pencil className="h-3.5 w-3.5" /> Editar datos
          </Button>
        )}
      </div>

      {editando === "datos" ? (
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(event) => {
            event.preventDefault()
            const cambios: Record<string, number> = {}
            if (peso.trim()) cambios.peso_kg = Number(peso)
            if (altura.trim()) cambios.altura_cm = Number(altura)
            void guardar(() =>
              patientsService.actualizarPerfil(perfil.id_paciente, cambios)
            )
          }}
        >
          <div>
            <Label htmlFor="perfil-peso">Peso (kg)</Label>
            <Input
              id="perfil-peso"
              type="number"
              step="0.1"
              min="1"
              max="500"
              value={peso}
              disabled={guardando}
              onChange={(event) => set_peso(event.target.value)}
              className="w-28"
            />
          </div>
          <div>
            <Label htmlFor="perfil-altura">Altura (cm)</Label>
            <Input
              id="perfil-altura"
              type="number"
              step="0.1"
              min="30"
              max="300"
              value={altura}
              disabled={guardando}
              onChange={(event) => set_altura(event.target.value)}
              className="w-28"
            />
          </div>
          <Button type="submit" size="sm" disabled={guardando} className="gap-1.5">
            {guardando && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Guardar
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
      ) : (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
          <Dato etiqueta="Peso" valor={perfil.peso_kg != null ? `${perfil.peso_kg} kg` : null} />
          <Dato etiqueta="Altura" valor={perfil.altura_cm != null ? `${perfil.altura_cm} cm` : null} />
          <Dato etiqueta="Objetivo" valor={perfil.objetivo?.nombre ?? null} />
          <Dato etiqueta="Actividad" valor={perfil.nivel_actividad?.nombre ?? null} />
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
          {editando === null && calculo && (
            <Button size="sm" variant="ghost" onClick={abrir_objetivo} className="gap-1.5">
              <Pencil className="h-3.5 w-3.5" /> Prescribir
            </Button>
          )}
        </div>

        {!calculo && (
          <p className="mt-2 text-sm text-muted-foreground">
            Faltan datos físicos del paciente para calcular sus objetivos.
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
            <Button type="submit" size="sm" disabled={guardando} className="gap-1.5">
              {guardando && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Guardar
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
              sugerido={kcal_prescritas && sugerido != null ? `${Math.round(sugerido)} kcal` : null}
            />
            <Dato etiqueta="Proteínas" valor={`${Math.round(calculo.proteinas_g)} g`} prescrito={prescritos.includes("proteinas_g")} />
            <Dato etiqueta="Carbohidratos" valor={`${Math.round(calculo.carbohidratos_g)} g`} prescrito={prescritos.includes("carbohidratos_g")} />
            <Dato etiqueta="Grasas" valor={`${Math.round(calculo.grasas_g)} g`} prescrito={prescritos.includes("grasas_g")} />
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
