import type { HelpTopic } from "@/types/help"

export function normalize_help_text(text: string): string {
  return text.toLocaleLowerCase("es").normalize("NFD").replace(/[̀-ͯ]/g, "")
}

function topic_text(topic: HelpTopic): string {
  return normalize_help_text(
    [
      topic.titulo,
      topic.resumen,
      ...topic.pasos,
      ...topic.notas.map((nota) => nota.texto),
      ...topic.palabras_clave,
    ].join(" ")
  )
}

export function search_help_topics(
  topics: HelpTopic[],
  query: string
): HelpTopic[] {
  const words = normalize_help_text(query).split(/\s+/).filter(Boolean)
  if (words.length === 0) return topics
  return topics.filter((topic) => {
    const text = topic_text(topic)
    return words.every((word) => text.includes(word))
  })
}
