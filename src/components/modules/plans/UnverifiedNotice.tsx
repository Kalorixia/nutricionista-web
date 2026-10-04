import { ShieldAlert } from "lucide-react"
import { Card } from "@/components/ui/card"
import type { GeneracionIA } from "@/types/mealPlan"

/**
 * Lo que el sistema no verificó en un borrador del Copiloto.
 *
 * El backend filtra el catálogo con las condiciones y restricciones que puede
 * comprobar contra sus datos. Lo que queda afuera —una condición cargada a mano
 * por el paciente, un detalle clínico escrito libre— no bloquea la generación,
 * pero tiene que llegar a quien aprueba. Se separan a propósito las dos listas:
 * una es lo que el sistema admite no haber comprobado, la otra es lo que el
 * modelo dice haber revisado, que es una observación y no una garantía.
 */
export function UnverifiedNotice({
  generacion,
}: {
  generacion?: GeneracionIA | null
}) {
  const pendientes = generacion?.sin_verificar ?? []
  const advertencias = generacion?.advertencias ?? []
  const medidas = generacion?.advertencias_sistema ?? []
  if (!pendientes.length && !advertencias.length && !medidas.length) return null

  return (
    <Card
      role="region"
      aria-label="Puntos sin verificar del borrador"
      className="space-y-4 border-amber-500/40 bg-amber-50/60 p-4 dark:bg-amber-950/20"
    >
      <div className="flex items-start gap-2.5">
        <ShieldAlert
          aria-hidden="true"
          className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-500"
        />
        <div className="space-y-1">
          <h2 className="leading-none font-medium">
            Revisá esto antes de aprobar
          </h2>
          <p className="text-sm text-muted-foreground">
            Lo que el sistema midió sobre el borrador y lo que no pudo comprobar
            con los datos del catálogo.
          </p>
        </div>
      </div>

      {medidas.length > 0 && (
        <div className="space-y-1.5 pl-8">
          <p className="text-sm font-medium">
            Ajuste del borrador{" "}
            <span className="font-normal text-muted-foreground">
              (calculado por el sistema)
            </span>
          </p>
          <ul className="space-y-1.5 text-sm">
            {medidas.map((item) => (
              <li key={item} className="list-disc">
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {pendientes.length > 0 && (
        <ul className="space-y-1.5 pl-8 text-sm">
          {pendientes.map((item) => (
            <li key={item} className="list-disc">
              {item}
            </li>
          ))}
        </ul>
      )}

      {advertencias.length > 0 && (
        <div className="space-y-1.5 pl-8">
          <p className="text-sm font-medium">
            Lo que revisó el Copiloto{" "}
            <span className="font-normal text-muted-foreground">
              (sin verificar por el sistema)
            </span>
          </p>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            {advertencias.map((item) => (
              <li key={item} className="list-disc">
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  )
}
