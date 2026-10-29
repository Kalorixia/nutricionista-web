import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import HelpTopicItem from "@/components/modules/help/HelpTopicItem"
import { MANUAL_NUTRICIONISTA } from "@/content/manual_nutricionista"
import { search_help_topics } from "@/utils/help_search"

export default function Help() {
  const [query, setQuery] = useState("")
  const topics = useMemo(
    () => search_help_topics(MANUAL_NUTRICIONISTA.temas, query),
    [query]
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-brand-dark font-heading text-3xl font-bold">
          Ayuda
        </h1>
        <p className="text-muted-foreground">
          {MANUAL_NUTRICIONISTA.introduccion}
        </p>
      </div>

      <div className="relative max-w-xl">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscá “paciente”, “plan” o “receta”…"
          aria-label="Buscar en la ayuda"
          className="pl-9"
        />
      </div>

      <section className="space-y-3" aria-label="Temas de ayuda">
        {topics.map((topic) => (
          <HelpTopicItem key={topic.id} topic={topic} />
        ))}
        {topics.length === 0 && (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No encontramos temas con esa búsqueda. Probá con “paciente” o
            “plan”.
          </p>
        )}
      </section>

      <section className="space-y-3" aria-label="Problemas frecuentes">
        <h2 className="font-heading text-xl font-semibold">
          Problemas frecuentes
        </h2>
        <dl className="space-y-3">
          {MANUAL_NUTRICIONISTA.preguntas_frecuentes.map((faq) => (
            <div
              key={faq.pregunta}
              className="rounded-xl border border-border bg-card p-4 text-card-foreground"
            >
              <dt className="font-medium">{faq.pregunta}</dt>
              <dd className="mt-1 text-sm text-muted-foreground">
                {faq.respuesta}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  )
}
