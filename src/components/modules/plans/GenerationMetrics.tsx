import { Gauge } from "lucide-react"
import type { GeneracionIA } from "@/types/mealPlan"

const CORRECCION: Record<string, string> = {
  aplicada: "Se aplicó una ronda de corrección con los totales reales.",
  descartada:
    "Se intentó una corrección, pero no mejoraba el ajuste: quedó el primer borrador.",
  fallida: "La ronda de corrección falló: quedó el primer borrador.",
  no_necesaria: "No hizo falta corregir: todos los días estaban cerca.",
  deshabilitada: "La ronda de corrección está desactivada.",
  sin_objetivo: "El plan no tiene objetivo energético contra el cual medir.",
}

const porcentaje = (valor: number) => `${Math.round(valor * 100)} %`

/**
 * Medición del Copiloto (KAL-131-04): cuánto se aparta el borrador de los
 * objetivos del plan y, una vez publicado, cuánto lo cambió el profesional.
 * Es información para el nutricionista; el paciente nunca la ve.
 */
export function GenerationMetrics({
  generacion,
}: {
  generacion?: GeneracionIA | null
}) {
  const desviacion = generacion?.desviacion
  const revision = generacion?.revision_profesional
  if (!desviacion && !revision) return null
  const final = desviacion?.despues ?? desviacion?.antes ?? null
  const aplicada = desviacion?.correccion === "aplicada"

  return (
    <section
      aria-label="Medición del Copiloto"
      className="flex items-start gap-2.5 rounded-xl border border-border bg-secondary/30 p-3 text-sm"
    >
      <Gauge
        aria-hidden="true"
        className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
      />
      <div className="space-y-1">
        {final && (
          <p>
            Desvío promedio de energía por día:{" "}
            <span className="font-medium">{porcentaje(final.energia)}</span>
            {aplicada && desviacion?.antes && (
              <span className="text-muted-foreground">
                {" "}
                (antes de corregir: {porcentaje(desviacion.antes.energia)})
              </span>
            )}
            {final.proteinas != null && (
              <> · proteínas: {porcentaje(final.proteinas)}</>
            )}
          </p>
        )}
        {desviacion && (
          <p className="text-xs text-muted-foreground">
            {CORRECCION[desviacion.correccion] ?? ""}
          </p>
        )}
        {revision && (
          <p className="text-xs text-muted-foreground">
            Cambios antes de publicar: {revision.cambiados} reemplazos,{" "}
            {revision.agregados} agregados, {revision.quitados} quitados.
          </p>
        )}
      </div>
    </section>
  )
}
