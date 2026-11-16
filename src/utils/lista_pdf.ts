import type { RowInput } from "jspdf-autotable"
import type { ListaRecetaDetalle } from "@/types/recipe"
import { localDateIso } from "@/utils/format"
import {
  GRIS,
  MARGEN,
  VERDE,
  cargar_jspdf,
  formato_fecha,
  nombre_archivo_pdf,
  numerar_paginas,
} from "@/utils/pdf_comun"

/**
 * Una lista de recetas en PDF (KAL-153-02). `contenido_lista` es puro y es lo
 * que se prueba; `generar_lista_pdf` lo dibuja. Mismo patrón que `reporte_pdf.ts`.
 * Solo usa lo que la lista ya trae: no lleva ingredientes ni pasos.
 */

export const LISTA_VACIA = "Esta lista no tiene recetas."

export const CABECERA_LISTA = [
  "Receta",
  "Tiempo",
  "Porciones",
  "Dificultad",
  "kcal por porción",
]

export interface ContenidoLista {
  titulo: string
  lineas: string[]
  tabla: { cabecera: string[]; filas: string[][] } | null
  vacio: string | null
  pie: string
  nombre_archivo: string
}

export function contenido_lista(
  lista: ListaRecetaDetalle,
  emision_iso: string = localDateIso(new Date())
): ContenidoLista {
  const cantidad = lista.recetas.length
  const filas = lista.recetas.map((r) => [
    r.descripcion ? `${r.nombre}\n${r.descripcion}` : r.nombre,
    r.tiempo_preparacion ? `${r.tiempo_preparacion} min` : "—",
    String(r.porciones),
    r.dificultad ?? "—",
    r.calorias_por_porcion === null
      ? "—"
      : Math.round(r.calorias_por_porcion).toLocaleString("es-AR"),
  ])
  return {
    titulo: lista.nombre,
    lineas: [
      `Creada el ${formato_fecha(lista.created_at)}`,
      `${cantidad} ${cantidad === 1 ? "receta" : "recetas"}`,
    ],
    tabla: cantidad ? { cabecera: CABECERA_LISTA, filas } : null,
    vacio: cantidad ? null : LISTA_VACIA,
    pie: `Generado el ${formato_fecha(emision_iso)} con Kalorixia`,
    nombre_archivo: nombre_archivo_pdf(`lista ${lista.nombre}`, "lista"),
  }
}

/** Dibuja el contenido en un A4. jsPDF se carga recién acá. */
export async function generar_lista_pdf(contenido: ContenidoLista) {
  const { jsPDF, autoTable } = await cargar_jspdf()
  const doc = new jsPDF({ format: "a4", unit: "mm" })
  const ancho = doc.internal.pageSize.getWidth()
  const util = ancho - MARGEN * 2
  let y = MARGEN

  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)
  doc.setTextColor(...VERDE)
  const titulo = doc.splitTextToSize(contenido.titulo, util) as string[]
  for (const parte of titulo) {
    doc.text(parte, MARGEN, y + 5)
    y += 8
  }
  y += 4

  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.setTextColor(...GRIS)
  for (const linea of contenido.lineas) {
    doc.text(linea, MARGEN, y)
    y += 4.8
  }
  y += 3

  if (contenido.tabla) {
    const cuerpo: RowInput[] = contenido.tabla.filas
    autoTable(doc, {
      startY: y,
      margin: { left: MARGEN, right: MARGEN },
      head: [contenido.tabla.cabecera],
      body: cuerpo,
      theme: "grid",
      rowPageBreak: "avoid",
      styles: { fontSize: 9, cellPadding: 1.8, valign: "top", textColor: 30 },
      headStyles: { fillColor: VERDE, textColor: 255, fontStyle: "bold" },
    })
  } else if (contenido.vacio) {
    doc.text(contenido.vacio, MARGEN, y)
  }

  numerar_paginas(doc, contenido.pie)
  return doc
}

export async function descargar_lista_pdf(
  contenido: ContenidoLista
): Promise<void> {
  const doc = await generar_lista_pdf(contenido)
  doc.save(contenido.nombre_archivo)
}
