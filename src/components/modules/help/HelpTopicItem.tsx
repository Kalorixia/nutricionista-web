import { ChevronDown, Lightbulb, TriangleAlert } from "lucide-react"
import type { HelpTopic } from "@/types/help"

export default function HelpTopicItem({ topic }: { topic: HelpTopic }) {
  return (
    <details
      id={topic.id}
      className="group rounded-xl border border-border bg-card text-card-foreground"
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0 flex-1">
          <h3 className="font-heading font-semibold">{topic.titulo}</h3>
          <p className="text-sm text-muted-foreground">{topic.resumen}</p>
        </div>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className="space-y-3 px-4 pb-4">
        <ol className="list-decimal space-y-1.5 pl-5 text-sm marker:text-muted-foreground">
          {topic.pasos.map((paso, index) => (
            <li key={index}>{paso}</li>
          ))}
        </ol>
        {topic.notas.map((nota, index) => {
          const advertencia = nota.tipo === "advertencia"
          const Icon = advertencia ? TriangleAlert : Lightbulb
          return (
            <div
              key={index}
              className={`flex gap-2 rounded-lg border p-3 text-sm ${
                advertencia
                  ? "border-destructive/30 bg-destructive/10"
                  : "border-primary/30 bg-primary/10"
              }`}
            >
              <Icon
                aria-hidden="true"
                className={`mt-0.5 h-4 w-4 shrink-0 ${
                  advertencia ? "text-destructive" : "text-primary"
                }`}
              />
              <p>
                <span className="font-medium">
                  {advertencia ? "Importante: " : "Consejo: "}
                </span>
                {nota.texto}
              </p>
            </div>
          )
        })}
      </div>
    </details>
  )
}
