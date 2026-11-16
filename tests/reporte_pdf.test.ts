import { describe, expect, it } from "vitest"
import {
  AVISO_REPORTE,
  AVISO_SIN_REGISTROS,
  contenido_reporte,
  generar_reporte_pdf,
} from "@/utils/reporte_pdf"
import { REPORTE, REPORTE_VACIO } from "./fixtures_progreso"

const texto = (seccion: ReturnType<typeof contenido_reporte>["secciones"][0]) =>
  [
    seccion.vacio ?? "",
    ...seccion.bloques.flatMap((b) => [
      ...b.lineas,
      ...(b.tabla ? [b.tabla.cabecera, ...b.tabla.filas].flat() : []),
    ]),
  ].join("\n")

describe("contenido del reporte de progreso", () => {
  it("arma las nueve secciones en orden", () => {
    const contenido = contenido_reporte(REPORTE)
    expect(contenido.secciones.map((s) => s.titulo)).toEqual([
      "Encabezado",
      "Perfil del paciente",
      "Restricciones y condiciones",
      "Requerimientos nutricionales",
      "Plan del período",
      "Frecuencia de consumo por receta",
      "Adherencia",
      "Evolución de mediciones",
      "Aviso",
    ])
    expect(contenido.aviso_sin_registros).toBeNull()
  })

  it("el encabezado lleva paciente, período, matrícula y la emisión del servidor", () => {
    const [encabezado] = contenido_reporte(REPORTE).secciones
    expect(encabezado.bloques[0].lineas).toEqual([
      "Paciente: Ana Pérez",
      "Período: del 1/10/2026 al 15/11/2026",
      "Profesional: Luis Ríos · Matrícula MN 1234",
      "Emitido el 15/11/2026",
    ])
  })

  it("sin vinculación activa lo dice", () => {
    const [encabezado] = contenido_reporte(REPORTE_VACIO).secciones
    expect(encabezado.bloques[0].lineas).toContain(
      "Profesional: sin vinculación activa"
    )
  })

  it("el plan trae el total del día con su diferencia y marca el día incompleto", () => {
    const plan = texto(contenido_reporte(REPORTE).secciones[4])
    expect(plan).toContain(
      "Plan octubre · Luis Ríos · del 1/10/2026 al 1/11/2026"
    )
    expect(plan).toContain("Objetivo diario: 2.044 kcal")
    expect(plan).toContain("Avena con frutas (1 bowl (250 g))")
    expect(plan).toContain("Total del día")
    expect(plan).toContain("Diferencia con el objetivo: -64 kcal")
    expect(plan).toContain("Datos nutricionales incompletos")
    expect(plan).toContain("Sin comidas")
  })

  it("adherencia: resumen, semanas, tabla por plan y lo que no le gustó", () => {
    const adherencia = texto(contenido_reporte(REPORTE).secciones[6])
    expect(adherencia).toContain(
      "56,1 % de 180 comidas cumplidas · 30 con cambios · 9 no cumplidas · 40 sin registro"
    )
    expect(adherencia).toContain("9/11/2026 al 15/11/2026")
    expect(adherencia).toContain("Plan noviembre")
    expect(adherencia).toContain("No le gustó: Lentejas guisadas (3 veces)")
  })

  it("mediciones: objetivo sin veredicto y diferencia contra la anterior al período", () => {
    const mediciones = contenido_reporte(REPORTE).secciones[7].bloques
    expect(mediciones[0].lineas).toEqual([
      "Objetivo: Bajar de peso",
      "Medición anterior al período: 74,0 kg (15/9/2026)",
    ])
    expect(mediciones[1].tabla?.filas.map((f) => f[3])).toEqual([
      "-1,6 kg",
      "-1,5 kg",
    ])
  })

  it("el pie y el nombre del archivo son fijos y sin datos de más", () => {
    const contenido = contenido_reporte(REPORTE)
    expect(contenido.pie).toBe(
      `${AVISO_REPORTE} Generado el 15/11/2026 con Kalorixia`
    )
    expect(contenido.secciones[8].bloques[0].lineas).toEqual([AVISO_REPORTE])
    expect(contenido.nombre_archivo).toBe(
      "reporte-ana-perez-2026-10-01-2026-11-15.pdf"
    )
  })

  it("un período sin registros lo dice y el resto sale con sus textos vacíos", () => {
    const contenido = contenido_reporte(REPORTE_VACIO)
    expect(contenido.aviso_sin_registros).toBe(AVISO_SIN_REGISTROS)
    expect(contenido.secciones).toHaveLength(9)
    const [
      ,
      perfil,
      restricciones,
      requerimientos,
      plan,
      frecuencia,
      adherencia,
      mediciones,
    ] = contenido.secciones
    expect(texto(perfil)).toContain("Edad: Sin dato")
    expect(texto(perfil)).toContain("Objetivo: Sin dato")
    expect(texto(restricciones)).toContain("Sin restricciones registradas")
    expect(texto(restricciones)).toContain("Sin condiciones registradas")
    expect(requerimientos.vacio).toBe("Sin requerimiento calculado")
    expect(plan.vacio).toBe("No hubo un plan vigente en el período.")
    expect(frecuencia.vacio).toBe(
      "No hay recetas preparadas registradas en el período."
    )
    expect(adherencia.vacio).toBe("No hubo comidas esperadas en el período.")
    expect(texto(mediciones)).toContain("No hay mediciones en el período.")
    expect(texto(mediciones)).toContain("Objetivo: Sin objetivo cargado")
  })
})

describe("generar_reporte_pdf", () => {
  it("genera un A4 con los textos clave", async () => {
    const doc = await generar_reporte_pdf(contenido_reporte(REPORTE_VACIO))
    expect(Math.round(doc.internal.pageSize.getWidth())).toBe(210)
    const crudo = doc.output()
    for (const t of [
      "Reporte de progreso",
      "No hay comidas registradas ni mediciones",
      "no reemplaza una evaluaci",
    ])
      expect(crudo).toContain(t)
  })

  it("con datos incluye la matrícula y el plan", async () => {
    const doc = await generar_reporte_pdf(contenido_reporte(REPORTE))
    const crudo = doc.output()
    expect(crudo).toContain("MN 1234")
    expect(crudo).toContain("Plan octubre")
  })
})
