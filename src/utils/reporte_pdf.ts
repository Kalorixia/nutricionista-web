import type { RowInput } from "jspdf-autotable"
import type { NutritionTotals } from "@/types/mealPlan"
import type { ReporteProgreso } from "@/types/progreso"
import {
  GRIS,
  MARGEN,
  VERDE,
  cargar_jspdf,
  formato_fecha,
  linea_profesional,
  nombre_archivo_pdf,
  numerar_paginas,
} from "@/utils/pdf_comun"

/**
 * El reporte de progreso en PDF (KAL-87-03). Este módulo arma el contenido
 * (`contenido_reporte`, puro, es lo que se prueba) y lo dibuja con jsPDF.
 * Mismo patrón que `plan_pdf.ts`. Nunca incluye observaciones clínicas.
 */

export const AVISO_REPORTE = "Este reporte no reemplaza una evaluación médica."
export const AVISO_SIN_REGISTROS =
  "No hay comidas registradas ni mediciones en este período."

export interface TablaReporte {
  cabecera: string[]
  filas: string[][]
}

export interface BloqueReporte {
  lineas: string[]
  tabla: TablaReporte | null
}

export interface SeccionReporte {
  titulo: string
  bloques: BloqueReporte[]
  /** Texto a mostrar cuando no hay datos; la sección no tiene bloques. */
  vacio: string | null
}

export interface ContenidoReporte {
  titulo: string
  aviso_sin_registros: string | null
  /** Las nueve secciones del reporte, en orden. */
  secciones: SeccionReporte[]
  pie: string
  nombre_archivo: string
}

const numero = (valor: number, decimales = 0) =>
  valor.toLocaleString("es-AR", {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  })

/** "+20" / "-3,0" / "0": solo `-` y `+` ASCII, que la helvética de jsPDF dibuja. */
function con_signo(valor: number, decimales = 0): string {
  const redondeado = Number(valor.toFixed(decimales))
  if (redondeado > 0) return `+${numero(redondeado, decimales)}`
  if (redondeado < 0) return `-${numero(Math.abs(redondeado), decimales)}`
  return numero(0, decimales)
}

const porcentaje = (valor: number | null) =>
  valor === null ? "—" : `${numero(valor, 1)} %`

const medida = (valor: number | null, unidad: string) =>
  valor === null
    ? "Sin dato"
    : `${numero(valor, Number.isInteger(valor) ? 0 : 1)} ${unidad}`

const bloque = (
  lineas: string[],
  tabla: TablaReporte | null = null
): BloqueReporte => ({ lineas, tabla })

const TIPO_RESTRICCION: Record<string, string> = {
  alergia: "Alergia",
  intolerancia: "Intolerancia",
  aversion: "Aversión",
}

function resumen_objetivo(o: NutritionTotals): string {
  return (
    `Objetivo diario: ${numero(o.energia_kcal)} kcal · ` +
    `proteínas ${numero(o.proteinas_g)} g · ` +
    `carbohidratos ${numero(o.carbohidratos_g)} g · ` +
    `grasas ${numero(o.grasas_totales_g)} g`
  )
}

interface Conteo {
  porcentaje_cumplimiento: number | null
  cumplidas: number
  con_cambios: number
  no_cumplidas: number
  sin_registro: number
}

function fila_conteo(etiqueta: string, c: Conteo): string[] {
  return [
    etiqueta,
    porcentaje(c.porcentaje_cumplimiento),
    String(c.cumplidas),
    String(c.con_cambios),
    String(c.no_cumplidas),
    String(c.sin_registro),
  ]
}

const CABECERA_CONTEO = [
  "Cumplimiento",
  "Cumplidas",
  "Con cambios",
  "No cumplidas",
  "Sin registro",
]

const rango = (inicio: string, fin: string) =>
  `${formato_fecha(inicio)} al ${formato_fecha(fin)}`

export function contenido_reporte(reporte: ReporteProgreso): ContenidoReporte {
  const { encabezado, perfil } = reporte
  const emision = formato_fecha(encabezado.fecha_emision)
  const profesional = encabezado.nutricionista
  const nombre_paciente =
    `${encabezado.paciente.nombre} ${encabezado.paciente.apellido}`.trim()
  const objetivo_texto =
    perfil.objetivo?.nombre ?? perfil.objetivo_personalizado ?? null

  const secciones: SeccionReporte[] = []

  // 1. Encabezado
  secciones.push({
    titulo: "Encabezado",
    vacio: null,
    bloques: [
      bloque([
        `Paciente: ${nombre_paciente}`,
        `Período: del ${rango(encabezado.desde, encabezado.hasta)}`,
        profesional
          ? linea_profesional(
              `${profesional.nombre} ${profesional.apellido}`.trim(),
              profesional.matricula
            )
          : "Profesional: sin vinculación activa",
        `Emitido el ${emision}`,
      ]),
    ],
  })

  // 2. Perfil
  secciones.push({
    titulo: "Perfil del paciente",
    vacio: null,
    bloques: [
      bloque([
        `Edad: ${perfil.edad === null ? "Sin dato" : `${perfil.edad} años`}`,
        `Sexo: ${perfil.sexo_biologico ?? "Sin dato"}`,
        `Peso: ${medida(perfil.peso_kg, "kg")}`,
        `Altura: ${medida(perfil.altura_cm, "cm")}`,
        `Nivel de actividad: ${perfil.nivel_actividad?.nombre ?? "Sin dato"}`,
        `Objetivo: ${objetivo_texto ?? "Sin dato"}`,
      ]),
    ],
  })

  // 3. Restricciones y condiciones
  const { restricciones_alimentarias: restricciones, condiciones_medicas } =
    reporte.restricciones
  secciones.push({
    titulo: "Restricciones y condiciones",
    vacio: null,
    bloques: [
      restricciones.length
        ? bloque([], {
            cabecera: ["Tipo", "Restricción", "Detalle"],
            filas: restricciones.map((r) => [
              TIPO_RESTRICCION[r.tipo] ?? r.tipo,
              r.nombre,
              r.detalle || "—",
            ]),
          })
        : bloque(["Sin restricciones registradas"]),
      condiciones_medicas.length
        ? bloque([], {
            cabecera: ["Condición", "Detalle"],
            filas: condiciones_medicas.map((c) => [c.nombre, c.detalle || "—"]),
          })
        : bloque(["Sin condiciones registradas"]),
    ],
  })

  // 4. Requerimientos
  const req = reporte.requerimiento
  secciones.push({
    titulo: "Requerimientos nutricionales",
    vacio: req ? null : "Sin requerimiento calculado",
    bloques: req
      ? [
          bloque([
            `Calorías objetivo: ${numero(req.resultado.get_objetivo_kcal)} kcal`,
            `Proteínas: ${numero(req.resultado.proteinas_g)} g`,
            `Carbohidratos: ${numero(req.resultado.carbohidratos_g)} g`,
            `Grasas: ${numero(req.resultado.grasas_g)} g`,
            `Hidratación: ${numero(req.resultado.hidratacion_ml)} ml`,
            `Vigente desde ${formato_fecha(req.vigente_desde)}`,
          ]),
        ]
      : [],
  })

  // 5. Plan del período
  secciones.push({
    titulo: "Plan del período",
    vacio: reporte.planes.length
      ? null
      : "No hubo un plan vigente en el período.",
    bloques: reporte.planes.map((plan) => {
      const filas: string[][] = []
      for (const dia of plan.dias) {
        if (!dia.comidas.length) {
          filas.push([dia.dia_semana, "Sin comidas", "", ""])
          continue
        }
        dia.comidas.forEach((comida, i) => {
          filas.push([
            i === 0 ? dia.dia_semana : "",
            comida.momento_comida,
            comida.items
              .map(
                (item) =>
                  `${item.nombre}${item.porcion_descripcion ? ` (${item.porcion_descripcion})` : ""}`
              )
              .join("\n"),
            comida.items
              .map((item) =>
                item.calorias_por_porcion === null
                  ? "—"
                  : numero(item.calorias_por_porcion)
              )
              .join("\n"),
          ])
        })
        if (!dia.completos || !dia.totales) {
          filas.push(["", "Datos nutricionales incompletos", "", ""])
        } else {
          const dif = dia.diferencia_objetivo
          filas.push([
            "",
            "Total del día",
            dif
              ? `Diferencia con el objetivo: ${con_signo(dif.energia_kcal)} kcal`
              : "",
            numero(dia.totales.energia_kcal),
          ])
        }
      }
      return bloque(
        [
          `${plan.nombre} · ${plan.nombre_nutricionista} · del ${rango(plan.desde, plan.hasta)}`,
          ...(plan.objetivo_diario
            ? [resumen_objetivo(plan.objetivo_diario)]
            : []),
        ],
        { cabecera: ["Día", "Comida", "Qué comer", "kcal"], filas }
      )
    }),
  })

  // 6. Frecuencia de consumo por receta
  secciones.push({
    titulo: "Frecuencia de consumo por receta",
    vacio: reporte.frecuencia_consumo.length
      ? null
      : "No hay recetas preparadas registradas en el período.",
    bloques: reporte.frecuencia_consumo.length
      ? [
          bloque([], {
            cabecera: ["Receta", "Veces"],
            filas: reporte.frecuencia_consumo.map((r) => [
              r.nombre,
              String(r.veces),
            ]),
          }),
        ]
      : [],
  })

  // 7. Adherencia
  const { adherencia } = reporte
  const resumen = adherencia.resumen
  const bloques_adherencia: BloqueReporte[] = [
    bloque([
      `${porcentaje(resumen.porcentaje_cumplimiento)} de ${resumen.esperadas} comidas cumplidas · ${resumen.con_cambios} con cambios · ${resumen.no_cumplidas} no cumplidas · ${resumen.sin_registro} sin registro`,
    ]),
    bloque([], {
      cabecera: ["Semana", ...CABECERA_CONTEO],
      filas: adherencia.semanas.map((s) =>
        fila_conteo(rango(s.inicio, s.fin), s)
      ),
    }),
  ]
  if (adherencia.por_plan.length > 1)
    bloques_adherencia.push(
      bloque([], {
        cabecera: ["Plan", ...CABECERA_CONTEO],
        filas: adherencia.por_plan.map((p) => fila_conteo(p.nombre, p.conteo)),
      })
    )
  if (adherencia.no_me_gustaron.length)
    bloques_adherencia.push(
      bloque([
        `No le gustó: ${adherencia.no_me_gustaron
          .map(
            (i) => `${i.nombre} (${i.veces} ${i.veces === 1 ? "vez" : "veces"})`
          )
          .join(", ")}`,
      ])
    )
  secciones.push({
    titulo: "Adherencia",
    vacio: adherencia.semanas.length
      ? null
      : "No hubo comidas esperadas en el período.",
    bloques: adherencia.semanas.length ? bloques_adherencia : [],
  })

  // 8. Evolución de mediciones (C4: el objetivo, sin veredicto de meta)
  const { anterior, del_periodo } = reporte.mediciones
  const lineas_mediciones = [
    `Objetivo: ${objetivo_texto ?? "Sin objetivo cargado"}`,
  ]
  if (anterior)
    lineas_mediciones.push(
      `Medición anterior al período: ${anterior.peso_kg === null ? "sin peso" : `${numero(anterior.peso_kg, 1)} kg`} (${formato_fecha(anterior.fecha_medicion)})`
    )
  let previo = anterior?.peso_kg ?? null
  const filas_mediciones = del_periodo.map((m) => {
    const diferencia =
      m.peso_kg !== null && previo !== null
        ? `${con_signo(m.peso_kg - previo, 1)} kg`
        : "—"
    if (m.peso_kg !== null) previo = m.peso_kg
    return [
      formato_fecha(m.fecha_medicion),
      m.peso_kg === null ? "—" : `${numero(m.peso_kg, 1)} kg`,
      m.altura_cm === null ? "—" : medida(m.altura_cm, "cm"),
      diferencia,
    ]
  })
  secciones.push({
    titulo: "Evolución de mediciones",
    vacio: null,
    bloques: [
      bloque(lineas_mediciones),
      del_periodo.length
        ? bloque([], {
            cabecera: ["Fecha", "Peso", "Altura", "Diferencia"],
            filas: filas_mediciones,
          })
        : bloque(["No hay mediciones en el período."]),
    ],
  })

  // 9. Aviso (también va como pie de cada página)
  secciones.push({
    titulo: "Aviso",
    vacio: null,
    bloques: [bloque([AVISO_REPORTE])],
  })

  return {
    titulo: "Reporte de progreso",
    aviso_sin_registros: reporte.sin_registros ? AVISO_SIN_REGISTROS : null,
    secciones,
    pie: `${AVISO_REPORTE} Generado el ${emision} con Kalorixia`,
    nombre_archivo: nombre_archivo_pdf(
      `reporte ${nombre_paciente} ${encabezado.desde} ${encabezado.hasta}`,
      "reporte"
    ),
  }
}

/** Dibuja el contenido en un A4. jsPDF se carga recién acá. */
export async function generar_reporte_pdf(contenido: ContenidoReporte) {
  const { jsPDF, autoTable } = await cargar_jspdf()
  const doc = new jsPDF({ format: "a4", unit: "mm" })
  const ancho = doc.internal.pageSize.getWidth()
  const alto = doc.internal.pageSize.getHeight()
  const util = ancho - MARGEN * 2
  const limite = alto - 20
  let y = MARGEN

  const final_y = () =>
    (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable
      ?.finalY ?? y

  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)
  doc.setTextColor(...VERDE)
  doc.text(contenido.titulo, MARGEN, y + 5)
  y += 12

  if (contenido.aviso_sin_registros) {
    doc.setFillColor(254, 243, 199)
    doc.rect(MARGEN, y, util, 8, "F")
    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)
    doc.setTextColor(146, 64, 14)
    doc.text(contenido.aviso_sin_registros, ancho / 2, y + 5.3, {
      align: "center",
    })
    y += 13
  }

  const lineas = (textos: string[], gris = false) => {
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    if (gris) doc.setTextColor(...GRIS)
    else doc.setTextColor(40, 40, 40)
    for (const texto of textos) {
      const partes = doc.splitTextToSize(texto, util) as string[]
      for (const parte of partes) {
        if (y > limite) {
          doc.addPage()
          y = MARGEN
        }
        doc.text(parte, MARGEN, y)
        y += 4.8
      }
    }
  }

  contenido.secciones.forEach((seccion, indice) => {
    // Los títulos no quedan solos al pie de la página.
    if (y + 30 > limite) {
      doc.addPage()
      y = MARGEN
    }
    if (indice > 0) {
      y += 4
      doc.setFont("helvetica", "bold")
      doc.setFontSize(12)
      doc.setTextColor(...VERDE)
      doc.text(seccion.titulo, MARGEN, y)
      y += 6
    }
    if (seccion.vacio) lineas([seccion.vacio], true)
    for (const parte of seccion.bloques) {
      lineas(parte.lineas)
      if (parte.tabla) {
        const cuerpo: RowInput[] = parte.tabla.filas
        autoTable(doc, {
          startY: y + 1,
          margin: { left: MARGEN, right: MARGEN },
          head: [parte.tabla.cabecera],
          body: cuerpo,
          theme: "grid",
          rowPageBreak: "avoid",
          styles: {
            fontSize: 9,
            cellPadding: 1.8,
            valign: "top",
            textColor: 30,
          },
          headStyles: { fillColor: VERDE, textColor: 255, fontStyle: "bold" },
        })
        y = final_y() + 3
      }
    }
  })

  numerar_paginas(doc, contenido.pie)
  return doc
}

export async function descargar_reporte_pdf(
  contenido: ContenidoReporte
): Promise<void> {
  const doc = await generar_reporte_pdf(contenido)
  doc.save(contenido.nombre_archivo)
}
