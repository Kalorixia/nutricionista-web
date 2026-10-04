import { useEffect, useMemo, useRef, useState } from "react"
import { Link, useParams } from "react-router-dom"
import {
  ArrowLeft,
  Loader2,
  NotebookPen,
  Pencil,
  Plus,
  RefreshCw,
  ShoppingCart,
  Search,
  UtensilsCrossed,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { PublishPlanDialog } from "@/components/modules/plans/PublishPlanDialog"
import { UnverifiedNotice } from "@/components/modules/plans/UnverifiedNotice"
import { GenerationMetrics } from "@/components/modules/plans/GenerationMetrics"
import { RecipeSummaryDialog } from "@/components/modules/plans/RecipeSummaryDialog"
import { PlanHeaderDialog } from "@/components/modules/plans/PlanHeaderDialog"
import { TextEditDialog } from "@/components/modules/plans/TextEditDialog"
import { useConfirm } from "@/components/common/ConfirmDialog"
import { review_summary, slot_key } from "@/utils/plan_review"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { mealPlansService } from "@/services/mealPlans.service"
import { recipesService } from "@/services/recipes.service"
import { ApiError } from "@/services/http"
import { DIAS_SEMANA, MOMENTOS_COMIDA } from "@/types/mealPlan"
import type {
  ListaCompra,
  PlanificacionDetalle,
  PlanificacionRecetaItem,
} from "@/types/mealPlan"
import type { RecetaListItem } from "@/types/recipe"

const SEARCH_DEBOUNCE_MS = 350
const SEARCH_LIMIT = 8

const ESTADO_LABEL: Record<PlanificacionDetalle["estado"], string> = {
  borrador: "Borrador",
  publicada: "Publicada",
  archivada: "Archivada",
}

export default function PlanEditor() {
  const { id } = useParams<{ id: string }>()
  const idPlan = Number(id)

  const [plan, setPlan] = useState<PlanificacionDetalle | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [load_error, set_load_error] = useState<string | null>(null)
  const [reload, set_reload] = useState(0)
  const [busy, set_busy] = useState(false)
  const [publish_open, set_publish_open] = useState(false)
  const busy_ref = useRef(false)
  const active_id = useRef(idPlan)
  // Un plan publicado se corrige sin republicarlo (KAL-131-08); sólo el
  // archivado es de sólo lectura.
  const read_only = !plan || plan.estado === "archivada"
  const publicado = plan?.estado === "publicada"
  const confirm = useConfirm()
  const edicion_confirmada = useRef(false)
  const [header_open, set_header_open] = useState(false)
  const [indicaciones_open, set_indicaciones_open] = useState(false)
  const [nota_abierta, set_nota_abierta] = useState<{
    dia: string
    momento: string
  } | null>(null)
  const [preview, set_preview] = useState<{
    item: PlanificacionRecetaItem
    dia: string
    momento: string
  } | null>(null)

  const [picker, setPicker] = useState<{ dia: string; momento: string } | null>(
    null
  )
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [results, setResults] = useState<RecetaListItem[]>([])
  const [searching, setSearching] = useState(false)
  const [search_error, set_search_error] = useState<string | null>(null)

  const [shoppingOpen, setShoppingOpen] = useState(false)
  const [shoppingList, setShoppingList] = useState<ListaCompra | null>(null)
  const [shoppingLoading, setShoppingLoading] = useState(false)
  const [generatingShopping, setGeneratingShopping] = useState(false)

  const loadPlan = async () => {
    const result = await mealPlansService.get(idPlan)
    if (active_id.current === idPlan) setPlan(result)
  }

  useEffect(() => {
    active_id.current = idPlan
    edicion_confirmada.current = false
    let cancelled = false
    void (async () => {
      setLoading(true)
      setPlan(null)
      setNotFound(false)
      set_load_error(null)
      setPicker(null)
      try {
        if (!Number.isSafeInteger(idPlan) || idPlan <= 0)
          throw new ApiError("Plan no encontrado", 404)
        const result = await mealPlansService.get(idPlan)
        if (!cancelled) setPlan(result)
      } catch (error) {
        if (!cancelled) {
          setNotFound(error instanceof ApiError && error.status === 404)
          set_load_error(
            error instanceof Error ? error.message : "No pudimos cargar el plan"
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, reload])

  useEffect(() => {
    const timeoutId = setTimeout(
      () => setDebouncedQuery(query),
      SEARCH_DEBOUNCE_MS
    )
    return () => clearTimeout(timeoutId)
  }, [query])

  useEffect(() => {
    let cancelled = false
    if (!picker || !debouncedQuery) {
      void (async () => {
        setResults([])
        setSearching(false)
        set_search_error(null)
      })()
      return
    }
    void (async () => {
      setSearching(true)
      set_search_error(null)
      try {
        const result = await recipesService.list({
          q: debouncedQuery,
          limit: SEARCH_LIMIT,
        })
        if (!cancelled) setResults(result.recetas)
      } catch (error) {
        if (!cancelled) {
          setResults([])
          set_search_error(
            error instanceof Error ? error.message : "No pudimos buscar recetas"
          )
        }
      } finally {
        if (!cancelled) setSearching(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [debouncedQuery, picker])

  const openPicker = (dia: string, momento: string) => {
    if (read_only || busy_ref.current) return
    setPicker({ dia, momento })
    setQuery("")
    setDebouncedQuery("")
    setResults([])
    set_search_error(null)
  }

  const mutate_plan = async (operation: () => Promise<void>) => {
    if (busy_ref.current || read_only) return
    // El paciente ya tiene este plan: el primer cambio se confirma.
    if (publicado && !edicion_confirmada.current) {
      const ok = await confirm({
        title: "¿Modificar un plan publicado?",
        description:
          "El paciente va a ver este cambio de inmediato, sin que vuelvas a publicar. Queda registrado quién y cuándo lo modificó.",
        confirmText: "Modificar",
      })
      if (!ok) return
      edicion_confirmada.current = true
    }
    busy_ref.current = true
    set_busy(true)
    try {
      await operation()
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No pudimos guardar el cambio. Intentá nuevamente."
      )
      if (error instanceof ApiError && error.status === 409)
        set_reload((value) => value + 1)
    } finally {
      busy_ref.current = false
      set_busy(false)
    }
  }

  const handle_publish = () => {
    if (!plan) return
    if (!plan.recetas.length) {
      toast.error(
        "El plan no tiene comidas. Agregá al menos una antes de publicar."
      )
      return
    }
    set_publish_open(true)
  }

  const confirm_publish = () =>
    mutate_plan(async () => {
      if (active_id.current !== idPlan) return
      const result = await mealPlansService.publish(idPlan)
      if (active_id.current === idPlan) {
        setPlan(result)
        set_publish_open(false)
      }
      toast.success("Plan aprobado y publicado")
    })

  const handleAddRecipe = async (receta: RecetaListItem) => {
    if (!picker) return
    await mutate_plan(async () => {
      const result = await mealPlansService.addRecipe(idPlan, {
        dia_semana: picker.dia,
        momento_comida: picker.momento,
        id_receta: receta.id_receta,
      })
      if (active_id.current === idPlan) {
        setPlan(result)
        setPicker(null)
      }
      toast.success("Receta agregada")
    })
  }

  const handleRemoveRecipe = async (idPlanificacionReceta: number) => {
    await mutate_plan(async () => {
      await mealPlansService.removeRecipe(idPlan, idPlanificacionReceta)
      if (active_id.current === idPlan)
        setPlan((current) =>
          current
            ? {
                ...current,
                recetas: current.recetas.filter(
                  (item) =>
                    item.id_planificacion_receta !== idPlanificacionReceta
                ),
                resumen_diario: [],
              }
            : null
        )
      await loadPlan()
      toast.success("Receta quitada")
    })
  }

  const openShoppingList = async () => {
    setShoppingOpen(true)
    setShoppingLoading(true)
    try {
      setShoppingList(await mealPlansService.getShoppingList(idPlan))
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        setShoppingList(null)
      } else {
        toast.error("No se pudo cargar la lista de compras")
      }
    } finally {
      setShoppingLoading(false)
    }
  }

  const handleGenerateShoppingList = async () => {
    setGeneratingShopping(true)
    try {
      setShoppingList(await mealPlansService.generateShoppingList(idPlan))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ocurrió un error")
    } finally {
      setGeneratingShopping(false)
    }
  }

  const handleToggleItem = async (idItem: number, comprado: boolean) => {
    try {
      setShoppingList(
        await mealPlansService.toggleShoppingItem(idPlan, idItem, comprado)
      )
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ocurrió un error")
    }
  }

  const grid = useMemo(() => {
    const map = new Map<string, PlanificacionRecetaItem[]>()
    for (const item of plan?.recetas ?? []) {
      const key = slot_key(item)
      if (!key) continue
      const arr = map.get(key) ?? []
      arr.push(item)
      map.set(key, arr)
    }
    return map
  }, [plan])

  // Los planes ya no cubren siempre las cuatro comidas. En sólo lectura se
  // muestran las que el plan usa, para no dejar casilleros vacíos de comidas
  // que este paciente no hace; en edición se muestran todas, para poder sumarlas.
  const momentos_usados = useMemo(
    () =>
      new Set(
        (plan?.recetas ?? [])
          .map((item) => slot_key(item)?.split("|")[1])
          .filter(Boolean) as string[]
      ),
    [plan]
  )

  if (loading) {
    return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
  }

  if (notFound || !plan) {
    return (
      <div className="space-y-4">
        <p role="alert" className="text-muted-foreground">
          {notFound
            ? "Plan no encontrado."
            : (load_error ?? "No pudimos cargar el plan.")}
        </p>
        {!notFound && (
          <Button onClick={() => set_reload((value) => value + 1)}>
            Reintentar
          </Button>
        )}
        <Button variant="outline" render={<Link to="/planificacion" />}>
          Volver a planificación
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PublishPlanDialog
        plan={plan}
        open={publish_open}
        busy={busy}
        onOpenChange={set_publish_open}
        onConfirm={confirm_publish}
      />
      <Button
        variant="ghost"
        size="sm"
        render={<Link to="/planificacion" />}
        className="gap-1.5 text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Planificación
      </Button>

      <div className="hero-gradient flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-primary/10 p-5 sm:p-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-brand-dark font-heading text-3xl font-bold">
              {plan.nombre}
            </h1>
            <Badge variant="secondary">{ESTADO_LABEL[plan.estado]}</Badge>
          </div>
          <p className="text-muted-foreground">
            {plan.nombre_paciente}
            {plan.descripcion ? ` · ${plan.descripcion}` : ""}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={openShoppingList}
          className="gap-1.5"
        >
          <ShoppingCart className="h-4 w-4" /> Lista de compras
        </Button>
        {!read_only && (
          <Button
            variant="outline"
            onClick={() => set_header_open(true)}
            disabled={busy}
            className="gap-1.5"
          >
            <Pencil className="h-4 w-4" /> Editar datos del plan
          </Button>
        )}
        {plan.estado === "borrador" && (
          <Button onClick={handle_publish} disabled={busy}>
            Aprobar y publicar
          </Button>
        )}
      </div>

      <UnverifiedNotice generacion={plan.generacion_ia} />
      <GenerationMetrics generacion={plan.generacion_ia} />

      <RecipeSummaryDialog
        receta={preview?.item.receta ?? null}
        dia={preview?.dia}
        momento={preview?.momento}
        onClose={() => set_preview(null)}
      />

      {header_open && (
        <PlanHeaderDialog
          plan={plan}
          busy={busy}
          onClose={() => set_header_open(false)}
          onSave={(cambios) =>
            void mutate_plan(async () => {
              const result = await mealPlansService.update(idPlan, cambios)
              if (active_id.current === idPlan) {
                setPlan(result)
                set_header_open(false)
              }
              toast.success("Datos del plan actualizados")
            })
          }
        />
      )}

      {indicaciones_open && (
        <TextEditDialog
          titulo="Indicaciones generales"
          etiqueta="Indicaciones para el paciente"
          ayuda="Hidratación, horarios, actividad, recomendaciones."
          inicial={plan.indicaciones_generales ?? ""}
          maximo={4000}
          busy={busy}
          onClose={() => set_indicaciones_open(false)}
          onSave={(texto) =>
            void mutate_plan(async () => {
              const result = await mealPlansService.update(idPlan, {
                indicaciones_generales: texto,
              })
              if (active_id.current === idPlan) {
                setPlan(result)
                set_indicaciones_open(false)
              }
              toast.success("Indicaciones guardadas")
            })
          }
        />
      )}
      {nota_abierta && (
        <TextEditDialog
          titulo={`Nota — ${nota_abierta.dia} / ${nota_abierta.momento}`}
          etiqueta="Nota para esta comida"
          ayuda="Por ejemplo: si no tenés tiempo, reemplazá por…"
          inicial={
            plan.notas_comidas?.[
              `${nota_abierta.dia}|${nota_abierta.momento}`
            ] ?? ""
          }
          maximo={500}
          busy={busy}
          onClose={() => set_nota_abierta(null)}
          onSave={(texto) =>
            void mutate_plan(async () => {
              const clave = `${nota_abierta.dia}|${nota_abierta.momento}`
              const result = await mealPlansService.update(idPlan, {
                notas_comidas: { [clave]: texto || null },
              })
              if (active_id.current === idPlan) {
                setPlan(result)
                set_nota_abierta(null)
              }
              toast.success(texto ? "Nota guardada" : "Nota borrada")
            })
          }
        />
      )}

      <Card className="space-y-2 p-4" aria-label="Indicaciones generales">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-sm font-medium">Indicaciones generales</h2>
          {!read_only && (
            <Button
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() => set_indicaciones_open(true)}
              className="h-7 gap-1 px-2 text-xs"
            >
              <Pencil className="h-3 w-3" />
              {plan.indicaciones_generales ? "Editar" : "Agregar"}
            </Button>
          )}
        </div>
        {plan.indicaciones_generales ? (
          <p className="text-sm whitespace-pre-line">
            {plan.indicaciones_generales}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Sin indicaciones. Agregá hidratación, horarios o recomendaciones
            para el paciente.
          </p>
        )}
      </Card>

      {read_only && (
        <p role="status" className="text-sm text-muted-foreground">
          Este plan está en modo de sólo lectura.
        </p>
      )}
      {publicado && (
        <p role="status" className="text-sm text-muted-foreground">
          Plan publicado: lo que cambies lo ve el paciente de inmediato.
          {plan.ultima_edicion &&
            ` Última modificación: ${new Date(plan.ultima_edicion.fecha).toLocaleString("es-AR")} por ${plan.ultima_edicion.usuario} (${plan.ediciones ?? 1} ${(plan.ediciones ?? 1) === 1 ? "cambio" : "cambios"} desde que se publicó).`}
        </p>
      )}
      {plan.estado === "borrador" &&
        review_summary(plan).missing.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {plan.recetas.length
              ? `${review_summary(plan).missing.length} momentos sin comidas. Revisalos antes de publicar.`
              : "El borrador todavía no tiene comidas."}
          </p>
        )}
      {review_summary(plan).outside.length > 0 && (
        <Card className="space-y-2 p-4">
          <h2>Comidas fuera de la grilla: requieren revisión</h2>
          {review_summary(plan).outside.map((item) => (
            <div key={item.id_planificacion_receta}>
              {item.receta.nombre} · {item.dia_semana || "Sin día"} /{" "}
              {item.momento_comida || "Sin momento"}
              {!read_only && (
                <Button
                  disabled={busy}
                  onClick={() =>
                    handleRemoveRecipe(item.id_planificacion_receta)
                  }
                >
                  Quitar
                </Button>
              )}
            </div>
          ))}
        </Card>
      )}

      {plan.objetivos_nutricionales && (
        <Card className="p-4 text-sm" aria-label="Objetivos del plan">
          <p>
            <span className="font-medium">Objetivos del plan:</span>{" "}
            {Math.round(plan.objetivos_nutricionales.get_objetivo_kcal)} kcal ·
            Proteínas {Math.round(plan.objetivos_nutricionales.proteinas_g)} g ·
            Carbohidratos{" "}
            {Math.round(plan.objetivos_nutricionales.carbohidratos_g)} g ·
            Grasas {Math.round(plan.objetivos_nutricionales.grasas_g)} g
          </p>
          {(plan.objetivos_nutricionales.ajustado_para_plan?.length ?? 0) >
            0 && (
            <p className="mt-1 text-xs text-muted-foreground">
              Ajustados para este plan; el perfil del paciente no cambió.
            </p>
          )}
        </Card>
      )}

      <div className="space-y-4">
        {DIAS_SEMANA.map((dia) => (
          <Card key={dia} className="p-4">
            <h2 className="mb-3 font-heading text-sm font-semibold">{dia}</h2>
            {plan.resumen_diario
              ?.filter((summary) => summary.dia_semana === dia)
              .map((summary) => (
                <p key={dia} className="mb-3 text-xs text-muted-foreground">
                  {summary.totales
                    ? `${Math.round(summary.totales.energia_kcal)} kcal · Proteínas ${Math.round(summary.totales.proteinas_g)} g · Carbohidratos ${Math.round(summary.totales.carbohidratos_g)} g · Grasas ${Math.round(summary.totales.grasas_totales_g)} g`
                    : "Faltan valores nutricionales para calcular el total."}
                  {summary.diferencia_objetivo &&
                    ` · Diferencia con el objetivo: ${Math.round(summary.diferencia_objetivo.energia_kcal)} kcal`}
                </p>
              ))}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {MOMENTOS_COMIDA.filter((momento) =>
                read_only ? momentos_usados.has(momento) : true
              ).map((momento) => {
                const items = grid.get(`${dia}|${momento}`) ?? []
                return (
                  <div
                    key={momento}
                    className="rounded-xl border border-border p-3"
                  >
                    <p className="mb-2 text-xs font-medium text-muted-foreground uppercase">
                      {momento}
                    </p>
                    <div className="mb-2 flex flex-col gap-1.5">
                      {items.map((item) => (
                        <div
                          key={item.id_planificacion_receta}
                          className="flex items-center gap-2 rounded-lg bg-secondary/60 p-1 pr-1.5"
                        >
                          <button
                            onClick={() => set_preview({ item, dia, momento })}
                            aria-label={`Ver ${item.receta.nombre}`}
                            className="flex min-w-0 flex-1 items-center gap-2 rounded-md text-left hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                          >
                            {item.receta.imagen_url ? (
                              <img
                                src={item.receta.imagen_url}
                                alt=""
                                loading="lazy"
                                className="h-10 w-10 shrink-0 rounded-md object-cover"
                              />
                            ) : (
                              <span
                                aria-hidden="true"
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted"
                              >
                                <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
                              </span>
                            )}
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-xs font-medium">
                                {item.receta.nombre}
                              </span>
                              {item.receta.calorias_por_porcion != null && (
                                <span className="block text-[11px] text-muted-foreground tabular-nums">
                                  {Math.round(item.receta.calorias_por_porcion)}{" "}
                                  kcal
                                </span>
                              )}
                            </span>
                          </button>
                          {!read_only && (
                            <button
                              disabled={busy}
                              aria-label={`Quitar ${item.receta.nombre} de ${dia} ${momento}`}
                              onClick={() =>
                                handleRemoveRecipe(item.id_planificacion_receta)
                              }
                              className="shrink-0 rounded-full p-1 hover:bg-secondary-foreground/10"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    {plan.notas_comidas?.[`${dia}|${momento}`] && (
                      <p className="mb-2 rounded-md bg-amber-50 px-2 py-1 text-xs whitespace-pre-line dark:bg-amber-950/30">
                        {plan.notas_comidas[`${dia}|${momento}`]}
                      </p>
                    )}
                    {!read_only && (
                      <div className="flex flex-wrap gap-1">
                        <Button
                          disabled={busy}
                          size="sm"
                          variant="ghost"
                          onClick={() => openPicker(dia, momento)}
                          className="h-7 gap-1 px-2 text-xs text-muted-foreground"
                        >
                          <Plus className="h-3 w-3" /> Agregar receta
                        </Button>
                        <Button
                          disabled={busy}
                          size="sm"
                          variant="ghost"
                          aria-label={`Nota de ${dia} ${momento}`}
                          onClick={() => set_nota_abierta({ dia, momento })}
                          className="h-7 gap-1 px-2 text-xs text-muted-foreground"
                        >
                          <NotebookPen className="h-3 w-3" /> Nota
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>
        ))}
      </div>

      <Dialog
        open={!!picker && !read_only}
        onOpenChange={(o) => !o && !busy && setPicker(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Agregar receta o alimento — {picker?.dia} / {picker?.momento}
            </DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              disabled={busy}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar recetas o alimentos…"
              className="rounded-xl pl-9"
              autoFocus
            />
          </div>
          <div className="max-h-72 space-y-1 overflow-y-auto">
            {search_error && <p role="alert">{search_error}</p>}
            {searching ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              results.map((r) => (
                <button
                  disabled={busy}
                  key={r.id_receta}
                  onClick={() => handleAddRecipe(r)}
                  className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-secondary"
                >
                  <span>{r.nombre}</span>
                  {r.tipo === "alimento" && (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      Alimento · {r.porcion_descripcion}
                    </span>
                  )}
                </button>
              ))
            )}
            {!searching &&
              !search_error &&
              debouncedQuery &&
              results.length === 0 && (
                <p className="px-2 py-1.5 text-sm text-muted-foreground">
                  No encontramos recetas para esa búsqueda.
                </p>
              )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={shoppingOpen} onOpenChange={setShoppingOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Lista de compras</DialogTitle>
          </DialogHeader>
          {shoppingLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : !shoppingList ? (
            <div className="space-y-3 text-center">
              <p className="text-sm text-muted-foreground">
                Todavía no generaste la lista de compras para este plan.
              </p>
              <Button
                onClick={handleGenerateShoppingList}
                disabled={generatingShopping}
                className="gap-1.5"
              >
                {generatingShopping ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShoppingCart className="h-4 w-4" />
                )}
                Generar
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="max-h-80 space-y-1 overflow-y-auto">
                {shoppingList.items.map((item) => (
                  <label
                    key={item.id_item}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-secondary"
                  >
                    <Checkbox
                      checked={item.comprado}
                      onCheckedChange={(checked) =>
                        handleToggleItem(item.id_item, checked === true)
                      }
                    />
                    <span
                      className={
                        item.comprado
                          ? "text-muted-foreground line-through"
                          : ""
                      }
                    >
                      {item.nombre}
                    </span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {item.cantidad ?? ""} {item.unidad ?? ""}
                    </span>
                  </label>
                ))}
                {shoppingList.items.length === 0 && (
                  <p className="p-2 text-center text-sm text-muted-foreground">
                    El plan todavía no tiene recetas con ingredientes.
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateShoppingList}
                disabled={generatingShopping}
                className="w-full gap-1.5"
              >
                <RefreshCw
                  className={`h-4 w-4 ${generatingShopping ? "animate-spin" : ""}`}
                />
                Regenerar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
