import { useEffect, useState } from "react"
import { Loader2, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RestriccionCombobox } from "@/components/modules/patients/RestriccionCombobox"
import { patientsService } from "@/services/patients.service"
import type {
  ActualizarPerfilInput,
  CatalogosRegistro,
  PerfilPaciente,
  RestriccionInput,
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
}

/** Una restricción en la lista del formulario: un grupo o un ingrediente. */
interface RestriccionElegida {
  origen: "grupo" | "ingrediente"
  id: number
  nombre: string
  tipo: TipoRestriccion
  detalle: string | null
}

/** Valor de cada opción del selector: `grupo:<id>` o `ingrediente:<id>`. */
const clave = (item: Pick<RestriccionElegida, "origen" | "id">) =>
  `${item.origen}:${item.id}`

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
 * Las restricciones se eligen del catálogo —un grupo de alimentos o un
 * ingrediente puntual— y cada una lleva su tipo (alergia, intolerancia o
 * aversión), sin texto libre (KAL-40-06). Para cambiar el tipo se quita y se
 * vuelve a agregar. Las condiciones médicas conservan el texto libre.
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
  const [restricciones, set_restricciones] = useState<RestriccionElegida[]>(
    () =>
      perfil.restricciones_alimentarias.flatMap(
        (item): RestriccionElegida[] => {
          const base = {
            nombre: item.nombre,
            tipo: item.tipo,
            detalle: item.detalle,
          }
          if (item.id_restriccion != null)
            return [{ origen: "grupo", id: item.id_restriccion, ...base }]
          if (item.id_ingrediente != null)
            return [{ origen: "ingrediente", id: item.id_ingrediente, ...base }]
          // Sin grupo ni ingrediente no puede existir: el CHECK de origen de
          // la base lo impide desde KAL-40-06. Si llegara, no se reenvía.
          return []
        }
      )
  )
  const [nueva_condicion, set_nueva_condicion] = useState("")
  const [nueva_eleccion, set_nueva_eleccion] = useState("")
  const [busqueda, set_busqueda] = useState("")
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
      restricciones_alimentarias: restricciones.map(
        (item): RestriccionInput => {
          const resto = {
            tipo: item.tipo,
            ...(item.detalle ? { detalle: item.detalle } : {}),
          }
          return item.origen === "grupo"
            ? { id_restriccion: item.id, ...resto }
            : { id_ingrediente: item.id, ...resto }
        }
      ),
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

  // Lo que ya está en la lista no se ofrece: el servidor rechaza un repetido
  // aunque cambie el tipo.
  const elegidas = new Set(restricciones.map(clave))

  const agregar_restriccion = () => {
    if (!catalogos || !nueva_eleccion) return
    const [origen, id_texto] = nueva_eleccion.split(":")
    const id = Number(id_texto)
    const opcion =
      origen === "grupo"
        ? catalogos.restricciones_alimentarias.find((item) => item.id === id)
        : catalogos.ingredientes.find((item) => item.id === id)
    if (!opcion || elegidas.has(nueva_eleccion)) return
    set_restricciones((actual) => [
      ...actual,
      {
        origen: origen === "grupo" ? "grupo" : "ingrediente",
        id,
        nombre: opcion.nombre,
        tipo: nuevo_tipo,
        detalle: null,
      },
    ])
    set_nueva_eleccion("")
    set_busqueda("")
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
          items={condiciones_propias.map((item) => ({
            clave: item.nombre,
            nombre: item.nombre,
            texto: `${item.nombre}${item.detalle ? ` (${item.detalle})` : ""}`,
          }))}
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
        <ListaPropia
          etiqueta="restricción"
          items={restricciones.map((item) => ({
            clave: clave(item),
            nombre: item.nombre,
            texto: `${item.tipo}: ${item.nombre}${item.detalle ? ` (${item.detalle})` : ""}`,
          }))}
          disabled={guardando}
          onQuitar={(quitada) =>
            set_restricciones((actual) =>
              actual.filter((item) => clave(item) !== quitada)
            )
          }
        />
        <div className="flex flex-wrap gap-2">
          <RestriccionCombobox
            grupos={catalogos.restricciones_alimentarias
              .filter((item) => !elegidas.has(`grupo:${item.id}`))
              .map((item) => ({
                value: `grupo:${item.id}`,
                label: item.nombre,
              }))}
            ingredientes={catalogos.ingredientes
              .filter((item) => !elegidas.has(`ingrediente:${item.id}`))
              .map((item) => ({
                value: `ingrediente:${item.id}`,
                label: item.nombre,
              }))}
            value={nueva_eleccion}
            onValueChange={set_nueva_eleccion}
            inputValue={busqueda}
            onInputValueChange={set_busqueda}
            disabled={guardando}
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
            disabled={guardando || !nueva_eleccion}
            onClick={agregar_restriccion}
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

/**
 * Chips con botón de quitar. Cada ítem trae su clave (lo que identifica qué
 * quitar), el nombre para el botón y el texto que se muestra.
 */
function ListaPropia({
  etiqueta,
  items,
  disabled,
  onQuitar,
}: {
  etiqueta: string
  items: { clave: string; nombre: string; texto: string }[]
  disabled: boolean
  onQuitar: (clave: string) => void
}) {
  if (!items.length) return null
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <li
          key={item.clave}
          className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs"
        >
          {item.texto}
          <button
            type="button"
            aria-label={`Quitar ${etiqueta} ${item.nombre}`}
            disabled={disabled}
            onClick={() => onQuitar(item.clave)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        </li>
      ))}
    </ul>
  )
}
