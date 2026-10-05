import { useCallback, useEffect, useRef, useState } from "react"
import { Loader2, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { mealPlansService } from "@/services/mealPlans.service"
import { SELECT_CLASS } from "@/utils/form_styles"
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

/** Valor del selector para el objetivo propio (KAL-132-06). */
const OTRO = "otro"

const CAMPOS: [keyof Numeros, string, string][] = [
  ["kcal", "Energía (kcal/día)", "kcal"],
  ["proteinas", "Proteínas (g)", "g"],
  ["grasas", "Grasas (g)", "g"],
  ["carbohidratos", "Carbohidratos (g)", "g"],
]

function redondear(objetivos: ObjetivosPlan | null | undefined): Numeros {
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
 *
 * "Otro" permite escribir un objetivo propio (KAL-132-06). No tiene fórmula:
 * rigen los números que cargue el profesional, con el mantenimiento del
 * paciente como referencia para arrancar.
 */
export function PlanTargetsSection({ idPaciente, disabled, onChange }: Props) {
  const [parametros, set_parametros] = useState<ParametrosPlan | null>(null)
  const [id_objetivo, set_id_objetivo] = useState("")
  const [texto_otro, set_texto_otro] = useState("")
  const [id_nivel, set_id_nivel] = useState("")
  const [numeros, set_numeros] = useState<Numeros>(VACIOS)
  const [carbos_manuales, set_carbos_manuales] = useState(false)
  const [prescribir, set_prescribir] = useState(false)
  // Arranca cargando: el primer pedido sale apenas se monta.
  const [cargando, set_cargando] = useState(Boolean(idPaciente))
  const [error, set_error] = useState<string | null>(null)
  const pedido = useRef(0)

  type Opciones = {
    id_objetivo?: number
    id_nivel_actividad?: number
    objetivo_personalizado?: string
  }

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
          if (respuesta.objetivo) set_id_objetivo(String(respuesta.objetivo.id))
          else if (respuesta.objetivo_personalizado) {
            set_id_objetivo(OTRO)
            // El texto que escribe el profesional no se pisa con la respuesta.
            if (!opciones.objetivo_personalizado)
              set_texto_otro(respuesta.objetivo_personalizado)
          } else if (!opciones.objetivo_personalizado) set_id_objetivo("")
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

  const es_otro = id_objetivo === OTRO

  useEffect(() => {
    const completos = numeros.kcal && numeros.proteinas && numeros.grasas
    onChange({
      id_objetivo: id_objetivo && !es_otro ? Number(id_objetivo) : undefined,
      ...(es_otro ? { objetivo_personalizado: texto_otro.trim() } : {}),
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
  }, [
    id_objetivo,
    es_otro,
    texto_otro,
    id_nivel,
    numeros,
    prescribir,
    onChange,
  ])

  if (!idPaciente)
    return (
      <p className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
        Elegí un paciente para ver sus objetivos.
      </p>
    )

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
  const mantenimiento = parametros?.mantenimiento

  return (
    <div className="space-y-4">
      {error && (
        <div
          role="alert"
          className="flex items-center justify-between gap-2 rounded-2xl bg-destructive/10 px-3 py-2 text-xs text-destructive"
        >
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

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="plan-objetivo">Objetivo</Label>
          <select
            id="plan-objetivo"
            className={SELECT_CLASS}
            disabled={bloqueado}
            value={id_objetivo}
            onChange={(event) => {
              const valor = event.target.value
              set_id_objetivo(valor)
              void cargar({
                ...(valor === OTRO
                  ? { objetivo_personalizado: texto_otro.trim() || OTRO }
                  : { id_objetivo: Number(valor) || undefined }),
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
            <option value={OTRO}>Otro…</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="plan-actividad">Actividad física</Label>
          <select
            id="plan-actividad"
            className={SELECT_CLASS}
            disabled={bloqueado}
            value={id_nivel}
            onChange={(event) => {
              set_id_nivel(event.target.value)
              void cargar({
                ...(es_otro
                  ? { objetivo_personalizado: texto_otro.trim() || OTRO }
                  : { id_objetivo: Number(id_objetivo) || undefined }),
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

      {es_otro && (
        <div className="space-y-1.5">
          <Label htmlFor="plan-objetivo-otro">¿Cuál es el objetivo?</Label>
          <Input
            id="plan-objetivo-otro"
            maxLength={150}
            disabled={disabled}
            value={texto_otro}
            onChange={(event) => set_texto_otro(event.target.value)}
            placeholder="Ej: preparación para una maratón, recomposición corporal"
            aria-invalid={!texto_otro.trim() || undefined}
          />
          <p className="text-xs text-muted-foreground">
            Un objetivo propio no tiene fórmula: cargá la energía y los macros.
            Si los dejás vacíos, el Copiloto arma el plan sin objetivo
            energético.
          </p>
        </div>
      )}

      <div className="rounded-2xl bg-muted/50 p-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {CAMPOS.map(([campo, etiqueta, unidad]) => (
            <div key={campo} className="space-y-1.5">
              <Label
                htmlFor={`plan-${campo}`}
                className="text-xs text-muted-foreground"
              >
                {etiqueta}
              </Label>
              <div className="relative">
                <Input
                  id={`plan-${campo}`}
                  type="number"
                  min="0"
                  inputMode="numeric"
                  disabled={bloqueado}
                  value={numeros[campo]}
                  onChange={(event) => cambiar(campo, event.target.value)}
                  className="bg-background pr-11 tabular-nums"
                />
                <span
                  aria-hidden
                  className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground"
                >
                  {unidad}
                </span>
              </div>
            </div>
          ))}
        </div>
        {!carbos_manuales && numeros.kcal && (
          <p className="mt-2 text-xs text-muted-foreground">
            Los carbohidratos se completan solos con la energía que no cubren
            proteínas y grasas.
          </p>
        )}
      </div>

      {cargando && (
        <p
          role="status"
          className="flex items-center gap-1 text-xs text-muted-foreground"
        >
          <Loader2 className="h-3 w-3 animate-spin" /> Calculando…
        </p>
      )}
      {!cargando && es_otro && mantenimiento && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-dashed border-border px-3 py-2 text-xs">
          <span className="text-muted-foreground">
            Referencia de mantenimiento:{" "}
            <span className="font-medium text-foreground tabular-nums">
              {Math.round(mantenimiento.get_objetivo_kcal)} kcal
            </span>{" "}
            · P {Math.round(mantenimiento.proteinas_g)} g · G{" "}
            {Math.round(mantenimiento.grasas_g)} g · C{" "}
            {Math.round(mantenimiento.carbohidratos_g)} g
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={bloqueado}
            onClick={() => {
              set_numeros(redondear(mantenimiento))
              set_carbos_manuales(false)
            }}
          >
            Usar como base
          </Button>
        </div>
      )}
      {!cargando &&
        !es_otro &&
        parametros &&
        !parametros.objetivos &&
        !numeros.kcal && (
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
          <Switch
            id="plan-prescribir"
            size="sm"
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
            onClick={() => {
              set_texto_otro("")
              void cargar()
            }}
          >
            <RotateCcw className="h-3.5 w-3.5" /> Volver a los del paciente
          </Button>
        )}
      </div>
    </div>
  )
}
