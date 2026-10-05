import { useEffect, useState } from "react"
import { Loader2, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { patientsService } from "@/services/patients.service"
import type {
  ActualizarPerfilInput,
  CatalogosRegistro,
  PerfilPaciente,
  TipoRestriccion,
} from "@/types/patient"

const SELECT_CLASS =
  "w-full rounded-lg border border-border bg-background p-2 text-sm"
const OTRO = "otro"
const TIPOS: { valor: TipoRestriccion; etiqueta: string }[] = [
  { valor: "alergia", etiqueta: "Alergia" },
  { valor: "intolerancia", etiqueta: "Intolerancia" },
  { valor: "aversion", etiqueta: "Aversión" },
]

interface Propia {
  nombre: string
  detalle: string | null
  tipo?: TipoRestriccion
}

function alternar(lista: number[], id: number) {
  return lista.includes(id)
    ? lista.filter((item) => item !== id)
    : [...lista, id]
}

/**
 * Edición clínica completa por el profesional (KAL-131-07): sexo, peso,
 * altura, actividad, objetivo, condiciones y restricciones. Nombre y fecha de
 * nacimiento no: son la identidad del paciente.
 *
 * Las listas reemplazan a las guardadas, así que todo lo que el formulario no
 * edita (las aclaraciones de cada condición o restricción) se reenvía tal cual.
 */
export function ClinicalProfileForm({
  perfil,
  guardando,
  onGuardar,
  onCancelar,
}: {
  perfil: PerfilPaciente
  guardando: boolean
  onGuardar: (cambios: ActualizarPerfilInput) => void
  onCancelar: () => void
}) {
  const [catalogos, set_catalogos] = useState<CatalogosRegistro | null>(null)
  const [error_catalogos, set_error_catalogos] = useState<string | null>(null)
  const [sexo, set_sexo] = useState(perfil.sexo_biologico ?? "")
  const [peso, set_peso] = useState(
    perfil.peso_kg != null ? String(perfil.peso_kg) : ""
  )
  const [altura, set_altura] = useState(
    perfil.altura_cm != null ? String(perfil.altura_cm) : ""
  )
  const [nivel, set_nivel] = useState(
    perfil.nivel_actividad ? String(perfil.nivel_actividad.id) : ""
  )
  const [objetivo, set_objetivo] = useState(
    perfil.objetivo_personalizado
      ? OTRO
      : perfil.objetivo
        ? String(perfil.objetivo.id)
        : ""
  )
  const [objetivo_propio, set_objetivo_propio] = useState(
    perfil.objetivo_personalizado ?? ""
  )
  const [condiciones, set_condiciones] = useState<number[]>(
    perfil.condiciones_medicas
      .map((item) => item.id_condicion ?? null)
      .filter((id): id is number => id !== null)
  )
  const [condiciones_propias, set_condiciones_propias] = useState<Propia[]>(
    perfil.condiciones_medicas
      .filter((item) => item.id_condicion == null)
      .map((item) => ({ nombre: item.nombre, detalle: item.detalle }))
  )
  const [restricciones, set_restricciones] = useState<number[]>(
    perfil.restricciones_alimentarias
      .map((item) => item.id_restriccion ?? null)
      .filter((id): id is number => id !== null)
  )
  const [restricciones_propias, set_restricciones_propias] = useState<Propia[]>(
    perfil.restricciones_alimentarias
      .filter((item) => item.id_restriccion == null)
      .map((item) => ({
        nombre: item.nombre,
        detalle: item.detalle,
        tipo: (item.tipo as TipoRestriccion | null) ?? "alergia",
      }))
  )
  const [nueva_condicion, set_nueva_condicion] = useState("")
  const [nueva_restriccion, set_nueva_restriccion] = useState("")
  const [nuevo_tipo, set_nuevo_tipo] = useState<TipoRestriccion>("alergia")

  useEffect(() => {
    let activo = true
    patientsService
      .catalogos()
      .then((data) => activo && set_catalogos(data))
      .catch(
        (cause: unknown) =>
          activo &&
          set_error_catalogos(
            cause instanceof Error
              ? cause.message
              : "No pudimos cargar las opciones"
          )
      )
    return () => {
      activo = false
    }
  }, [])

  // Aclaraciones de las entradas del catálogo: no se editan acá, se conservan.
  const detalle_condicion = (id: number) =>
    perfil.condiciones_medicas.find((item) => item.id_condicion === id)
      ?.detalle ?? null
  const detalle_restriccion = (id: number) =>
    perfil.restricciones_alimentarias.find((item) => item.id_restriccion === id)
      ?.detalle ?? null

  const enviar = () => {
    const cambios: ActualizarPerfilInput = {
      condiciones_medicas: [
        ...condiciones.map((id) => ({
          id_condicion: id,
          ...(detalle_condicion(id) ? { detalle: detalle_condicion(id)! } : {}),
        })),
        ...condiciones_propias.map((item) => ({
          nombre_personalizado: item.nombre,
          ...(item.detalle ? { detalle: item.detalle } : {}),
        })),
      ],
      restricciones_alimentarias: [
        ...restricciones.map((id) => ({
          id_restriccion: id,
          ...(detalle_restriccion(id)
            ? { detalle: detalle_restriccion(id)! }
            : {}),
        })),
        ...restricciones_propias.map((item) => ({
          tipo_personalizado: item.tipo ?? "alergia",
          nombre_personalizado: item.nombre,
          ...(item.detalle ? { detalle: item.detalle } : {}),
        })),
      ],
    }
    if (sexo) cambios.sexo_biologico = sexo as "femenino" | "masculino"
    if (peso.trim()) cambios.peso_kg = Number(peso)
    if (altura.trim()) cambios.altura_cm = Number(altura)
    if (nivel) cambios.id_nivel_actividad = Number(nivel)
    if (objetivo === OTRO && objetivo_propio.trim())
      cambios.objetivo_personalizado = objetivo_propio.trim()
    else if (objetivo && objetivo !== OTRO)
      cambios.id_objetivo = Number(objetivo)
    onGuardar(cambios)
  }

  if (!catalogos) {
    return error_catalogos ? (
      <p role="alert" className="text-sm text-destructive">
        {error_catalogos}
      </p>
    ) : (
      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
    )
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        enviar()
      }}
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <Label htmlFor="perfil-sexo">Sexo biológico</Label>
          <select
            id="perfil-sexo"
            className={SELECT_CLASS}
            value={sexo}
            disabled={guardando}
            onChange={(event) => set_sexo(event.target.value)}
          >
            <option value="" disabled>
              Elegí
            </option>
            <option value="femenino">Femenino</option>
            <option value="masculino">Masculino</option>
          </select>
        </div>
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
          />
        </div>
        <div>
          <Label htmlFor="perfil-actividad">Actividad</Label>
          <select
            id="perfil-actividad"
            className={SELECT_CLASS}
            value={nivel}
            disabled={guardando}
            onChange={(event) => set_nivel(event.target.value)}
          >
            <option value="" disabled>
              Elegí
            </option>
            {catalogos.niveles_actividad.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="perfil-objetivo">Objetivo</Label>
          <select
            id="perfil-objetivo"
            className={SELECT_CLASS}
            value={objetivo}
            disabled={guardando}
            onChange={(event) => set_objetivo(event.target.value)}
          >
            <option value="" disabled>
              Elegí
            </option>
            {catalogos.objetivos.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nombre}
              </option>
            ))}
            <option value={OTRO}>Otro</option>
          </select>
        </div>
        {objetivo === OTRO && (
          <div>
            <Label htmlFor="perfil-objetivo-propio">Objetivo propio</Label>
            <Input
              id="perfil-objetivo-propio"
              maxLength={150}
              value={objetivo_propio}
              disabled={guardando}
              onChange={(event) => set_objetivo_propio(event.target.value)}
              placeholder="Por ejemplo: preparar una maratón"
            />
          </div>
        )}
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Condiciones médicas</legend>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {catalogos.condiciones_medicas.map((item) => (
            <label key={item.id} className="flex items-center gap-2 text-sm">
              <Checkbox
                disabled={guardando}
                checked={condiciones.includes(item.id)}
                onCheckedChange={() =>
                  set_condiciones((actual) => alternar(actual, item.id))
                }
              />
              {item.nombre}
            </label>
          ))}
        </div>
        <ListaPropia
          etiqueta="condición"
          items={condiciones_propias}
          disabled={guardando}
          onQuitar={(nombre) =>
            set_condiciones_propias((actual) =>
              actual.filter((item) => item.nombre !== nombre)
            )
          }
        />
        <div className="flex gap-2">
          <Input
            aria-label="Otra condición"
            placeholder="Otra condición"
            maxLength={150}
            value={nueva_condicion}
            disabled={guardando}
            onChange={(event) => set_nueva_condicion(event.target.value)}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-1"
            disabled={guardando || !nueva_condicion.trim()}
            onClick={() => {
              const nombre = nueva_condicion.trim()
              if (
                !condiciones_propias.some(
                  (item) => item.nombre.toLowerCase() === nombre.toLowerCase()
                )
              )
                set_condiciones_propias((actual) => [
                  ...actual,
                  { nombre, detalle: null },
                ])
              set_nueva_condicion("")
            }}
          >
            <Plus className="h-3.5 w-3.5" /> Agregar condición
          </Button>
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">
          Restricciones alimentarias
        </legend>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {catalogos.restricciones_alimentarias.map((item) => (
            <label key={item.id} className="flex items-center gap-2 text-sm">
              <Checkbox
                disabled={guardando}
                checked={restricciones.includes(item.id)}
                onCheckedChange={() =>
                  set_restricciones((actual) => alternar(actual, item.id))
                }
              />
              {item.nombre}
            </label>
          ))}
        </div>
        <ListaPropia
          etiqueta="restricción"
          items={restricciones_propias}
          disabled={guardando}
          onQuitar={(nombre) =>
            set_restricciones_propias((actual) =>
              actual.filter((item) => item.nombre !== nombre)
            )
          }
        />
        <div className="flex flex-wrap gap-2">
          <Input
            aria-label="Otra restricción"
            placeholder="Otra restricción"
            maxLength={150}
            className="flex-1"
            value={nueva_restriccion}
            disabled={guardando}
            onChange={(event) => set_nueva_restriccion(event.target.value)}
          />
          <select
            aria-label="Tipo de restricción"
            className="rounded-lg border border-border bg-background p-2 text-sm"
            value={nuevo_tipo}
            disabled={guardando}
            onChange={(event) =>
              set_nuevo_tipo(event.target.value as TipoRestriccion)
            }
          >
            {TIPOS.map((item) => (
              <option key={item.valor} value={item.valor}>
                {item.etiqueta}
              </option>
            ))}
          </select>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-1"
            disabled={guardando || !nueva_restriccion.trim()}
            onClick={() => {
              const nombre = nueva_restriccion.trim()
              if (
                !restricciones_propias.some(
                  (item) => item.nombre.toLowerCase() === nombre.toLowerCase()
                )
              )
                set_restricciones_propias((actual) => [
                  ...actual,
                  { nombre, detalle: null, tipo: nuevo_tipo },
                ])
              set_nueva_restriccion("")
            }}
          >
            <Plus className="h-3.5 w-3.5" /> Agregar restricción
          </Button>
        </div>
      </fieldset>

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
          onClick={onCancelar}
        >
          Cancelar
        </Button>
      </div>
    </form>
  )
}

function ListaPropia({
  etiqueta,
  items,
  disabled,
  onQuitar,
}: {
  etiqueta: string
  items: Propia[]
  disabled: boolean
  onQuitar: (nombre: string) => void
}) {
  if (!items.length) return null
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <li
          key={item.nombre}
          className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs"
        >
          {item.tipo ? `${item.tipo}: ` : ""}
          {item.nombre}
          {item.detalle ? ` (${item.detalle})` : ""}
          <button
            type="button"
            aria-label={`Quitar ${etiqueta} ${item.nombre}`}
            disabled={disabled}
            onClick={() => onQuitar(item.nombre)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        </li>
      ))}
    </ul>
  )
}
