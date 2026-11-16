/** Lo común a los PDF que arma el cliente (plan, reporte de progreso). */

export const VERDE: [number, number, number] = [22, 101, 52]
export const GRIS: [number, number, number] = [100, 100, 100]
export const MARGEN = 15

export const formato_fecha = (iso: string) =>
  new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString("es-AR")

/** "Ana Pérez 2026" → "ana-perez-2026.pdf", sin acentos ni símbolos. */
export function nombre_archivo_pdf(texto: string, por_defecto: string): string {
  const base = texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()
  return `${base || por_defecto}.pdf`
}

export function linea_profesional(
  nombre: string,
  matricula: string | null
): string {
  return `Profesional: ${nombre}${matricula ? ` · Matrícula ${matricula}` : ""}`
}

/** jsPDF y autotable se cargan recién cuando hace falta. */
export async function cargar_jspdf() {
  const [{ jsPDF }, { autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ])
  return { jsPDF, autoTable }
}

type Documento = Awaited<ReturnType<typeof cargar_jspdf>>["jsPDF"]["prototype"]

/** Pie en cada página: el texto a la izquierda y "n / total" a la derecha. */
export function numerar_paginas(doc: Documento, pie: string) {
  const ancho = doc.internal.pageSize.getWidth()
  const alto = doc.internal.pageSize.getHeight()
  const paginas = doc.getNumberOfPages()
  for (let pagina = 1; pagina <= paginas; pagina += 1) {
    doc.setPage(pagina)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.setTextColor(...GRIS)
    doc.text(pie, MARGEN, alto - 8)
    doc.text(`${pagina} / ${paginas}`, ancho - MARGEN, alto - 8, {
      align: "right",
    })
  }
}
