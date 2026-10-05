import { DIAS_SEMANA, MOMENTOS_COMIDA } from "@/types/mealPlan"
import type { PlanificacionDetalle } from "@/types/mealPlan"
import type { RowInput } from "jspdf-autotable"

/**
 * El plan en PDF (KAL-132-04). Este módulo arma el contenido; `dibujar` lo
 * pasa a jsPDF. Separados para poder probar qué se imprime sin generar el
 * archivo.
 */

export interface Profesional {
  nombre: string
  matricula: string | null
}

export interface OpcionesPdf {
  /** Calorías y macros: objetivo diario, kcal por ítem y total del día. */
  incluir_nutricion: boolean
}

export interface ComidaPdf {
  momento: string
  items: { nombre: string; kcal: number | null }[]
  nota: string | null
}

export interface DiaPdf {
  dia: string
  comidas: ComidaPdf[]
  total_kcal: number | null
}

export interface ContenidoPdf {
  titulo: string
  borrador: boolean
  lineas_encabezado: string[]
  objetivo: string | null
  indicaciones: string | null
  dias: DiaPdf[]
  incluir_nutricion: boolean
  nombre_archivo: string
}

const formato_fecha = (iso: string) =>
  new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString("es-AR")

function periodo(plan: PlanificacionDetalle): string | null {
  if (plan.fecha_inicio && plan.fecha_fin)
    return `Del ${formato_fecha(plan.fecha_inicio)} al ${formato_fecha(plan.fecha_fin)}`
  if (plan.fecha_inicio) return `Desde el ${formato_fecha(plan.fecha_inicio)}`
  if (plan.fecha_fin) return `Hasta el ${formato_fecha(plan.fecha_fin)}`
  return null
}

function nombre_archivo(plan: PlanificacionDetalle): string {
  const base =
    `${plan.nombre} ${plan.es_plantilla ? "plantilla" : plan.nombre_paciente}`
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase()
  return `${base || "plan"}.pdf`
}

export function contenido_pdf(
  plan: PlanificacionDetalle,
  profesional: Profesional,
  opciones: OpcionesPdf
): ContenidoPdf {
  const nutricion = opciones.incluir_nutricion
  const notas = plan.notas_comidas ?? {}
  const ordenados = [...plan.recetas].sort(
    (a, b) => (a.orden ?? 0) - (b.orden ?? 0)
  )
  const dias: DiaPdf[] = []
  for (const dia of DIAS_SEMANA) {
    const comidas: ComidaPdf[] = []
    for (const momento of MOMENTOS_COMIDA) {
      const items = ordenados
        .filter(
          (item) => item.dia_semana === dia && item.momento_comida === momento
        )
        .map((item) => ({
          nombre: item.receta.nombre,
          kcal:
            nutricion && item.receta.calorias_por_porcion != null
              ? Math.round(item.receta.calorias_por_porcion)
              : null,
        }))
      const nota = notas[`${dia}|${momento}`] || null
      if (items.length || nota) comidas.push({ momento, items, nota })
    }
    if (!comidas.length) continue
    const totales = plan.resumen_diario?.find(
      (resumen) => resumen.dia_semana === dia
    )?.totales
    dias.push({
      dia,
      comidas,
      total_kcal:
        nutricion && totales ? Math.round(totales.energia_kcal) : null,
    })
  }

  const objetivos = plan.objetivos_nutricionales
  const lineas = [
    `Profesional: ${profesional.nombre}${profesional.matricula ? ` · Matrícula ${profesional.matricula}` : ""}`,
    plan.es_plantilla
      ? "Plantilla (sin paciente)"
      : `Paciente: ${plan.nombre_paciente}`,
    periodo(plan),
  ].filter((linea): linea is string => Boolean(linea))

  return {
    titulo: plan.nombre,
    borrador: plan.estado === "borrador",
    lineas_encabezado: lineas,
    objetivo:
      nutricion && objetivos
        ? `Objetivo diario: ${Math.round(objetivos.get_objetivo_kcal)} kcal · ` +
          `proteínas ${Math.round(objetivos.proteinas_g)} g · ` +
          `carbohidratos ${Math.round(objetivos.carbohidratos_g)} g · ` +
          `grasas ${Math.round(objetivos.grasas_g)} g`
        : null,
    indicaciones: plan.indicaciones_generales?.trim() || null,
    dias,
    incluir_nutricion: nutricion,
    nombre_archivo: nombre_archivo(plan),
  }
}

const VERDE: [number, number, number] = [22, 101, 52]
const GRIS: [number, number, number] = [100, 100, 100]
const MARGEN = 15

/** Dibuja el contenido en un A4. jsPDF se carga recién acá. */
export async function generar_pdf(contenido: ContenidoPdf) {
  const [{ jsPDF }, { autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ])
  const doc = new jsPDF({ format: "a4", unit: "mm" })
  const ancho = doc.internal.pageSize.getWidth()
  const util = ancho - MARGEN * 2
  let y = MARGEN

  if (contenido.borrador) {
    doc.setFillColor(254, 243, 199)
    doc.rect(MARGEN, y, util, 8, "F")
    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)
    doc.setTextColor(146, 64, 14)
    doc.text("BORRADOR — no publicado, puede cambiar", ancho / 2, y + 5.3, {
      align: "center",
    })
    y += 13
  }

  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)
  doc.setTextColor(...VERDE)
  const titulo = doc.splitTextToSize(contenido.titulo, util) as string[]
  doc.text(titulo, MARGEN, y + 5)
  y += 5 + titulo.length * 7

  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.setTextColor(40, 40, 40)
  for (const linea of contenido.lineas_encabezado) {
    doc.text(linea, MARGEN, y)
    y += 5
  }
  if (contenido.objetivo) {
    doc.setTextColor(...GRIS)
    const lineas = doc.splitTextToSize(contenido.objetivo, util) as string[]
    doc.text(lineas, MARGEN, y)
    y += lineas.length * 5
  }

  if (contenido.indicaciones) {
    y += 3
    doc.setFont("helvetica", "bold")
    doc.setFontSize(11)
    doc.setTextColor(...VERDE)
    doc.text("Indicaciones generales", MARGEN, y)
    y += 5
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.setTextColor(40, 40, 40)
    const lineas = doc.splitTextToSize(contenido.indicaciones, util) as string[]
    for (const linea of lineas) {
      if (y > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage()
        y = MARGEN
      }
      doc.text(linea, MARGEN, y)
      y += 4.6
    }
  }

  const final_y = () =>
    (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable
      ?.finalY ?? y

  for (const dia of contenido.dias) {
    const filas: RowInput[] = dia.comidas.flatMap((comida): RowInput[] => {
      const items = comida.items.length
        ? comida.items.map((item) => `• ${item.nombre}`).join("\n")
        : "—"
      const kcal = comida.items
        .map((item) => (item.kcal != null ? `${item.kcal}` : ""))
        .join("\n")
      const fila = contenido.incluir_nutricion
        ? [comida.momento, items, kcal]
        : [comida.momento, items]
      return comida.nota
        ? [
            fila,
            [
              {
                content: `Nota: ${comida.nota}`,
                colSpan: fila.length,
                styles: { fontStyle: "italic", textColor: GRIS },
              },
            ],
          ]
        : [fila]
    })
    if (dia.total_kcal != null)
      filas.push([
        {
          content: "Total del día",
          colSpan: 2,
          styles: { fontStyle: "bold", halign: "right" },
        },
        {
          content: `${dia.total_kcal}`,
          styles: { fontStyle: "bold" },
        },
      ])
    // Que el encabezado de un día no quede solo al pie de la página.
    if (y + 6 + 32 > doc.internal.pageSize.getHeight() - 15) {
      doc.addPage()
      y = MARGEN - 6
    }
    autoTable(doc, {
      startY: y + 6,
      margin: { left: MARGEN, right: MARGEN },
      head: [
        contenido.incluir_nutricion
          ? [dia.dia, "Qué comer", "kcal"]
          : [dia.dia, "Qué comer"],
      ],
      body: filas,
      theme: "grid",
      rowPageBreak: "avoid",
      styles: { fontSize: 9.5, cellPadding: 2, valign: "top", textColor: 30 },
      headStyles: { fillColor: VERDE, textColor: 255, fontStyle: "bold" },
      columnStyles: contenido.incluir_nutricion
        ? {
            0: { cellWidth: 32, fontStyle: "bold" },
            2: { cellWidth: 16, halign: "right" },
          }
        : { 0: { cellWidth: 32, fontStyle: "bold" } },
    })
    y = final_y()
  }

  const paginas = doc.getNumberOfPages()
  const alto = doc.internal.pageSize.getHeight()
  for (let pagina = 1; pagina <= paginas; pagina += 1) {
    doc.setPage(pagina)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.setTextColor(...GRIS)
    const pie = `${contenido.borrador ? "BORRADOR · " : ""}Generado el ${new Date().toLocaleDateString("es-AR")} con Kalorixia`
    doc.text(pie, MARGEN, alto - 8)
    doc.text(`${pagina} / ${paginas}`, ancho - MARGEN, alto - 8, {
      align: "right",
    })
  }

  return doc
}

export async function descargar_pdf(contenido: ContenidoPdf): Promise<void> {
  const doc = await generar_pdf(contenido)
  doc.save(contenido.nombre_archivo)
}
