import { useCallback, useEffect, useRef, useState } from "react"
import { Loader2, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { mealPlansService } from "@/services/mealPlans.service"
import type {
  ObjetivosPlan,
  ParametrosPlan,
  ParametrosPlanInput,
} from "@/types/mealPlan"

interface Props {
  idPaciente: number | null
  disabled?: boolean
  onChange: (value: ParametrosPlanInput) => void
}

interface Numeros {
  kcal: string
  proteinas: string
  grasas: string
  carbohidratos: string
}

const VACIOS: Numeros = {
  kcal: "",
  proteinas: "",
  grasas: "",
  carbohidratos: "",
}

const SELECT_CLASS =
  "w-full rounded-lg border border-border bg-background p-2 text-sm"

function redondear(objetivos: ObjetivosPlan | null): Numeros {
  if (!objetivos) return VACIOS
  return {
    kcal: String(Math.round(objetivos.get_objetivo_kcal)),
    proteinas: String(Math.round(objetivos.proteinas_g)),
    grasas: String(Math.round(objetivos.grasas_g)),
    carbohidratos: String(Math.round(objetivos.carbohidratos_g)),
  }
}

/** Carbohidratos que completan la energía: lo que no cubren proteínas y grasas. */
function carbohidratosRestantes(n: Numeros): string {
  const kcal = Number(n.kcal)
  const proteinas = Number(n.proteinas)
  const grasas = Number(n.grasas)
  if (!n.kcal || !n.proteinas || !n.grasas) return ""
  return String(
    Math.max(0, Math.round((kcal - 4 * proteinas - 9 * grasas) / 4))
  )
}

/**
 * Objetivos de un plan nuevo. Arranca con los del paciente y deja ajustarlos
 * para este plan sin tocar el perfil. Los números sugeridos siempre los calcula
 * el servidor: el portal no repite la fórmula.
 */
export function PlanTargetsSection({ idPaciente, disabled, onChange }: Props) {
  const [parametros, set_parametros] = useState<ParametrosPlan | null>(null)
  const [id_objetivo, set_id_objetivo] = useState("")
  const [id_nivel, set_id_nivel] = useState("")
  const [numeros, set_numeros] = useState<Numeros>(VACIOS)
  const [carbos_manuales, set_carbos_manuales] = useState(false)
  const [prescribir, set_prescribir] = useState(false)
  // Arranca cargando: el primer pedido sale apenas se monta.
  const [cargando, set_cargando] = useState(Boolean(idPaciente))
  const [error, set_error] = useState<string | null>(null)
  const pedido = useRef(0)

  type Opciones = { id_objetivo?: number; id_nivel_actividad?: number }

  // Toda escritura de estado ocurre en los callbacks de la promesa, nunca en
  // el cuerpo del efecto de montaje. Sólo vale la última respuesta: un cambio
  // rápido de objetivo no puede pisar los números con los de una anterior.
  const pedir = useCallback(
    (opciones: Opciones = {}) => {
      if (!idPaciente) return Promise.resolve()
      const actual = ++pedido.current
      return mealPlansService
        .parameters(idPaciente, opciones)
        .then((respuesta) => {
          if (actual !== pedido.current) return
          set_parametros(respuesta)
          set_id_objetivo(
            respuesta.objetivo ? String(respuesta.objetivo.id) : ""
          )
          set_id_nivel(
            respuesta.nivel_actividad
              ? String(respuesta.nivel_actividad.id)
              : ""
          )
          set_numeros(redondear(respuesta.objetivos))
          set_carbos_manuales(false)
          set_error(null)
        })
        .catch((cause: unknown) => {
          if (actual !== pedido.current) return
          set_error(
            cause instanceof Error
              ? cause.message
              : "No pudimos cargar los objetivos del paciente"
          )
        })
        .finally(() => {
          if (actual === pedido.current) set_cargando(false)
        })
    },
    [idPaciente]
  )

  /** Versión de los controles: además marca la espera. */
  const cargar = (opciones: Opciones = {}) => {
    set_cargando(true)
    set_error(null)
    return pedir(opciones)
  }

  // El estado arranca limpio por paciente: el padre remonta la sección con
  // `key={idPaciente}`, así que acá alcanza con pedir los valores.
  useEffect(() => {
    void pedir()
  }, [pedir])

  useEffect(() => {
    const completos = numeros.kcal && numeros.proteinas && numeros.grasas
    onChange({
      id_objetivo: id_objetivo ? Number(id_objetivo) : undefined,
      id_nivel_actividad: id_nivel ? Number(id_nivel) : undefined,
      objetivos: completos
        ? {
            get_objetivo_kcal: Number(numeros.kcal),
            proteinas_g: Number(numeros.proteinas),
            grasas_g: Number(numeros.grasas),
            carbohidratos_g: numeros.carbohidratos
              ? Number(numeros.carbohidratos)
              : undefined,
          }
        : undefined,
      guardar_como_prescripcion: completos ? prescribir : false,
    })
  }, [id_objetivo, id_nivel, numeros, prescribir, onChange])

  if (!idPaciente) return null

  const cambiar = (campo: keyof Numeros, valor: string) => {
    set_numeros((actual) => {
      const siguiente = { ...actual, [campo]: valor }
      if (campo === "carbohidratos") return siguiente
      return carbos_manuales
        ? siguiente
        : { ...siguiente, carbohidratos: carbohidratosRestantes(siguiente) }
    })
    if (campo === "carbohidratos") set_carbos_manuales(true)
  }

  const energia_macros =
    4 * Number(numeros.proteinas || 0) +
    4 * Number(numeros.carbohidratos || 0) +
    9 * Number(numeros.grasas || 0)
  const desfasaje = numeros.kcal
    ? Math.abs(energia_macros - Number(numeros.kcal))
    : 0
  const tolerancia = Math.max(Number(numeros.kcal) * 0.05, 50)
  const sugeridos = redondear(parametros?.objetivos ?? null)
  const modificado =
    !parametros?.del_paciente ||
    (Object.keys(VACIOS) as (keyof Numeros)[]).some(
      (campo) => numeros[campo] !== sugeridos[campo]
    )
  const bloqueado = disabled || cargando

  return (
    <fieldset className="space-y-3 rounded-lg border border-border p-3">
      <legend className="px-1 text-sm font-medium">Objetivos del plan</legend>
      <p className="text-xs text-muted-foreground">
        Arrancan con los del paciente. Lo que cambies vale sólo para este plan.
      </p>

      {error && (
        <div role="alert" className="text-xs text-destructive">
          <p>{error}</p>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => void cargar()}
          >
            Reintentar
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="plan-objetivo">Objetivo</Label>
          <select
            id="plan-objetivo"
            className={SELECT_CLASS}
            disabled={bloqueado}
            value={id_objetivo}
            onChange={(event) => {
              set_id_objetivo(event.target.value)
              void cargar({
                id_objetivo: Number(event.target.value) || undefined,
                id_nivel_actividad: Number(id_nivel) || undefined,
              })
            }}
          >
            {!id_objetivo && <option value="">Sin objetivo</option>}
            {parametros?.opciones_objetivo.map((opcion) => (
              <option key={opcion.id} value={opcion.id}>
                {opcion.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="plan-actividad">Actividad</Label>
          <select
            id="plan-actividad"
            className={SELECT_CLASS}
            disabled={bloqueado}
            value={id_nivel}
            onChange={(event) => {
              set_id_nivel(event.target.value)
              void cargar({
                id_objetivo: Number(id_objetivo) || undefined,
                id_nivel_actividad: Number(event.target.value) || undefined,
              })
            }}
          >
            {!id_nivel && <option value="">Sin dato</option>}
            {parametros?.opciones_nivel_actividad.map((opcion) => (
              <option key={opcion.id} value={opcion.id}>
                {opcion.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {(
          [
            ["kcal", "Energía (kcal/día)"],
            ["proteinas", "Proteínas (g)"],
            ["grasas", "Grasas (g)"],
            ["carbohidratos", "Carbohidratos (g)"],
          ] as [keyof Numeros, string][]
        ).map(([campo, etiqueta]) => (
          <div key={campo}>
            <Label htmlFor={`plan-${campo}`}>{etiqueta}</Label>
            <Input
              id={`plan-${campo}`}
              type="number"
              min="0"
              inputMode="numeric"
              disabled={bloqueado}
              value={numeros[campo]}
              onChange={(event) => cambiar(campo, event.target.value)}
            />
          </div>
        ))}
      </div>

      {cargando && (
        <p
          role="status"
          className="flex items-center gap-1 text-xs text-muted-foreground"
        >
          <Loader2 className="h-3 w-3 animate-spin" /> Calculando…
        </p>
      )}
      {!cargando && parametros && !parametros.objetivos && !numeros.kcal && (
        <p className="text-xs text-muted-foreground">
          El paciente no tiene datos para calcular sus objetivos. Podés
          completarlos acá para este plan.
        </p>
      )}
      {numeros.kcal && desfasaje > tolerancia && (
        <p role="alert" className="text-xs text-destructive">
          Los macronutrientes suman {Math.round(energia_macros)} kcal y la
          energía del plan es {numeros.kcal} kcal.
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-xs">
          <Checkbox
            id="plan-prescribir"
            disabled={bloqueado || !numeros.kcal}
            checked={prescribir}
            onCheckedChange={(marcado) => set_prescribir(marcado === true)}
          />
          Guardar también como objetivo del paciente
        </label>
        {modificado && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="gap-1"
            disabled={bloqueado}
            onClick={() => void cargar()}
          >
            <RotateCcw className="h-3.5 w-3.5" /> Volver a los del paciente
          </Button>
        )}
      </div>
    </fieldset>
  )
}
