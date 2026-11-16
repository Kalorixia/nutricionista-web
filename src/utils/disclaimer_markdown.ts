export interface Segment {
  text: string
  bold: boolean
}

export type DisclaimerBlock =
  | { type: "paragraph"; segments: Segment[] }
  | { type: "list"; items: Segment[][] }

/** Pares de `**`; un `**` sin cierre queda como texto literal. */
function parseInline(text: string): Segment[] {
  const parts = text.split("**")
  // Cantidad par de partes = cantidad impar de `**`: el último no tiene cierre.
  const pairedUntil = parts.length % 2 === 1 ? parts.length : parts.length - 1
  const segments: Segment[] = []
  const push = (value: string, bold: boolean) => {
    if (!value) return
    const last = segments[segments.length - 1]
    if (last && last.bold === bold) last.text += value
    else segments.push({ text: value, bold })
  }
  for (let i = 0; i < pairedUntil; i++) push(parts[i], i % 2 === 1)
  if (pairedUntil < parts.length) {
    push("**" + parts.slice(pairedUntil).join("**"), false)
  }
  return segments
}

/**
 * Markdown mínimo del contrato del disclaimer: bloques separados por línea en
 * blanco, listas de `* ` y `**negrita**`. Nada más.
 */
export function parseDisclaimerBody(cuerpo: string): DisclaimerBlock[] {
  return cuerpo
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0)
    .map((block): DisclaimerBlock => {
      const lines = block.split("\n")
      if (lines.every((line) => line.startsWith("* "))) {
        return {
          type: "list",
          items: lines.map((line) => parseInline(line.slice(2))),
        }
      }
      return { type: "paragraph", segments: parseInline(lines.join(" ")) }
    })
}
