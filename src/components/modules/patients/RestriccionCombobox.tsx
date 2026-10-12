import { Combobox } from "@base-ui/react/combobox"
import { ChevronDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/** Una opción del buscador: `value` es `grupo:<id>` o `ingrediente:<id>`. */
export interface OpcionRestriccion {
  value: string
  label: string
}

interface GrupoOpciones {
  value: string
  items: OpcionRestriccion[]
}

/**
 * Alto de una opción (`h-9`, 2.25rem). El menú mide como mucho diez opciones
 * y el resto se alcanza con scroll: se renderiza la lista filtrada completa.
 */
const LISTA_CLASS = "max-h-[min(calc(10*2.25rem),var(--available-height))]"

/** Minúsculas y sin acentos: "mani" encuentra "Maní". */
function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
}

const coincide = (item: OpcionRestriccion, query: string) =>
  normalizar(item.label).includes(normalizar(query.trim()))

/**
 * Buscador de grupo de alimentos o ingrediente para una restricción
 * (KAL-40-06). Filtra por nombre sin distinguir mayúsculas ni acentos y
 * muestra las coincidencias en dos grupos, "Grupos de alimentos" e
 * "Ingredientes". Lo que no se deba ofrecer (lo ya elegido) lo saca quien
 * arma las listas.
 */
export function RestriccionCombobox({
  grupos,
  ingredientes,
  value,
  onValueChange,
  inputValue,
  onInputValueChange,
  disabled,
}: {
  grupos: OpcionRestriccion[]
  ingredientes: OpcionRestriccion[]
  value: string
  onValueChange: (value: string) => void
  inputValue: string
  onInputValueChange: (value: string) => void
  disabled: boolean
}) {
  const items: GrupoOpciones[] = [
    { value: "Grupos de alimentos", items: grupos },
    { value: "Ingredientes", items: ingredientes },
  ]
  const elegida =
    grupos.find((item) => item.value === value) ??
    ingredientes.find((item) => item.value === value) ??
    null

  return (
    <Combobox.Root<OpcionRestriccion>
      items={items}
      value={elegida}
      onValueChange={(opcion) => onValueChange(opcion?.value ?? "")}
      inputValue={inputValue}
      onInputValueChange={(texto, detalles) => {
        onInputValueChange(texto)
        // Si se sigue escribiendo después de elegir, la elección ya no vale.
        if (
          (detalles.reason === "input-change" ||
            detalles.reason === "input-clear") &&
          elegida &&
          normalizar(texto) !== normalizar(elegida.label)
        )
          onValueChange("")
      }}
      isItemEqualToValue={(item, actual) => item.value === actual.value}
      filter={coincide}
      disabled={disabled}
    >
      <div className="relative min-w-0 flex-1">
        <Combobox.Input
          aria-label="Grupo o ingrediente"
          placeholder="Buscá un grupo o ingrediente"
          className="h-9 w-full min-w-0 rounded-lg border border-border bg-background py-2 pr-8 pl-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <Combobox.Trigger
          aria-label="Ver opciones"
          className="absolute inset-y-0 right-0 flex w-8 items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          <ChevronDownIcon className="size-4" />
        </Combobox.Trigger>
      </div>
      <Combobox.Portal>
        <Combobox.Positioner
          className="isolate z-50 outline-none"
          align="start"
          sideOffset={4}
        >
          <Combobox.Popup className="dark w-(--anchor-width) min-w-48 overflow-hidden rounded-2xl bg-popover/90 p-1 text-popover-foreground shadow-2xl ring-1 ring-foreground/5 backdrop-blur-2xl outline-none">
            <Combobox.Empty className="px-3 text-sm text-muted-foreground not-empty:py-2 empty:p-0">
              Sin resultados
            </Combobox.Empty>
            <Combobox.List
              className={cn(LISTA_CLASS, "overflow-y-auto overscroll-contain")}
            >
              {(grupo: GrupoOpciones) => (
                <Combobox.Group key={grupo.value} items={grupo.items}>
                  <Combobox.GroupLabel className="flex h-9 items-center px-3 text-xs text-muted-foreground">
                    {grupo.value}
                  </Combobox.GroupLabel>
                  <Combobox.Collection>
                    {(item: OpcionRestriccion) => (
                      <Combobox.Item
                        key={item.value}
                        value={item}
                        className="flex h-9 cursor-default items-center rounded-xl px-3 text-sm outline-hidden select-none data-highlighted:bg-foreground/10"
                      >
                        <span className="truncate">{item.label}</span>
                      </Combobox.Item>
                    )}
                  </Combobox.Collection>
                </Combobox.Group>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  )
}
