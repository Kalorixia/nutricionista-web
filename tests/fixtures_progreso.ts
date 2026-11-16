import type { HistorialProgreso, ReporteProgreso } from "@/types/progreso"

/** Datos ficticios del progreso para los tests del historial y del reporte. */

const conteo = (
  esperadas: number,
  cumplidas: number,
  con_cambios: number,
  no_cumplidas: number,
  sin_registro: number
) => ({
  esperadas,
  cumplidas,
  con_cambios,
  no_cumplidas,
  sin_registro,
  porcentaje_cumplimiento: esperadas
    ? Math.round((cumplidas / esperadas) * 1000) / 10
    : null,
})

const medicion = (
  id_medicion: number,
  peso_kg: number | null,
  fecha_medicion: string
) => ({
  id_medicion,
  peso_kg,
  altura_cm: 168,
  fecha_medicion,
  created_at: `${fecha_medicion}T13:00:00Z`,
  cargada_por: "paciente" as const,
})

export const HISTORIAL: HistorialProgreso = {
  total: 6,
  limit: 4,
  offset: 0,
  objetivo: { id: 1, codigo: "bajar_peso", nombre: "Bajar de peso" },
  objetivo_personalizado: null,
  planes: [
    {
      id_planificacion: 12,
      nombre: "Plan noviembre",
      estado: "publicada",
      desde: "2026-11-02",
      hasta: "2026-11-15",
      nombre_nutricionista: "Ana Gómez",
    },
    {
      id_planificacion: 9,
      nombre: "Plan octubre",
      estado: "archivada",
      desde: "2026-10-01",
      hasta: "2026-11-01",
      nombre_nutricionista: "Luis Ríos",
    },
  ],
  mediciones: [
    medicion(20, 74, "2026-09-15"),
    medicion(31, 72.4, "2026-10-20"),
    medicion(32, 70.9, "2026-11-10"),
  ],
  semanas: [
    {
      inicio: "2026-11-09",
      fin: "2026-11-15",
      adherencia: conteo(8, 4, 2, 1, 1),
      por_plan: [
        { id_planificacion: 12, conteo: conteo(6, 3, 2, 0, 1) },
        { id_planificacion: 9, conteo: conteo(2, 1, 0, 1, 0) },
      ],
      recetas_preparadas: [
        { id_receta: 40, nombre: "Avena con frutas", veces: 3 },
      ],
      dias: [
        {
          fecha: "2026-11-15",
          dia_semana: "Domingo",
          comidas: [
            {
              momento_comida: "Almuerzo",
              id_planificacion: 12,
              estado: "con_cambios",
              comentario: "Cambié el arroz por papa",
              items: [{ id_receta: 12, nombre: "Lentejas guisadas" }],
              preparadas: [],
              no_me_gustaron: [],
            },
            {
              momento_comida: "Cena",
              id_planificacion: 9,
              estado: "cumplida",
              comentario: null,
              items: [{ id_receta: 40, nombre: "Avena con frutas" }],
              preparadas: [{ id_receta: 40, nombre: "Avena con frutas" }],
              no_me_gustaron: [],
            },
          ],
        },
      ],
    },
    {
      inicio: "2026-11-02",
      fin: "2026-11-08",
      adherencia: conteo(4, 2, 0, 1, 1),
      por_plan: [{ id_planificacion: 12, conteo: conteo(4, 2, 0, 1, 1) }],
      recetas_preparadas: [],
      dias: [
        {
          fecha: "2026-11-08",
          dia_semana: "Domingo",
          comidas: [
            {
              momento_comida: "Desayuno",
              id_planificacion: 12,
              estado: null,
              comentario: null,
              items: [{ id_receta: 41, nombre: "Tostadas" }],
              preparadas: [],
              no_me_gustaron: [],
            },
          ],
        },
      ],
    },
  ],
}

const totales = (kcal: number) => ({
  energia_kcal: kcal,
  proteinas_g: 100,
  carbohidratos_g: 200,
  grasas_totales_g: 60,
})

export const REPORTE: ReporteProgreso = {
  sin_registros: false,
  encabezado: {
    paciente: { nombre: "Ana", apellido: "Pérez" },
    desde: "2026-10-01",
    hasta: "2026-11-15",
    nutricionista: { nombre: "Luis", apellido: "Ríos", matricula: "MN 1234" },
    fecha_emision: "2026-11-15",
  },
  perfil: {
    edad: 30,
    sexo_biologico: "femenino",
    peso_kg: 72.4,
    altura_cm: 168,
    nivel_actividad: { id: 2, nombre: "moderado" },
    objetivo: { id: 1, codigo: "bajar_peso", nombre: "Bajar de peso" },
    objetivo_personalizado: null,
  },
  restricciones: {
    restricciones_alimentarias: [
      {
        id_restriccion: 3,
        id_ingrediente: null,
        tipo: "alergia",
        nombre: "Maní",
        detalle: null,
      },
    ],
    condiciones_medicas: [
      { id_condicion: 1, nombre: "Diabetes", detalle: "Tipo 2" },
    ],
  },
  requerimiento: {
    vigente_desde: "2026-09-15T13:42:00Z",
    resultado: {
      version: "mifflin-v1",
      edad: 30,
      tmb_kcal: 1500,
      get_kcal: 2200,
      get_objetivo_kcal: 2044.45,
      proteinas_g: 140,
      grasas_g: 56.8,
      carbohidratos_g: 243.3,
      hidratacion_ml: 2450,
    },
  },
  planes: [
    {
      id_planificacion: 9,
      nombre: "Plan octubre",
      nombre_nutricionista: "Luis Ríos",
      desde: "2026-10-01",
      hasta: "2026-11-01",
      objetivo_diario: totales(2044.45),
      dias: [
        {
          dia_semana: "Lunes",
          completos: true,
          totales: totales(1980),
          diferencia_objetivo: totales(-64.45),
          comidas: [
            {
              momento_comida: "Desayuno",
              items: [
                {
                  id_receta: 40,
                  nombre: "Avena con frutas",
                  porcion_descripcion: "1 bowl (250 g)",
                  calorias_por_porcion: 420,
                },
              ],
            },
          ],
        },
        {
          dia_semana: "Martes",
          completos: false,
          totales: null,
          diferencia_objetivo: null,
          comidas: [
            {
              momento_comida: "Almuerzo",
              items: [
                {
                  id_receta: 41,
                  nombre: "Ensalada",
                  porcion_descripcion: null,
                  calorias_por_porcion: null,
                },
              ],
            },
          ],
        },
        {
          dia_semana: "Miércoles",
          completos: true,
          totales: null,
          diferencia_objetivo: null,
          comidas: [],
        },
      ],
    },
    {
      id_planificacion: 12,
      nombre: "Plan noviembre",
      nombre_nutricionista: "Ana Gómez",
      desde: "2026-11-02",
      hasta: "2026-11-15",
      objetivo_diario: null,
      dias: [],
    },
  ],
  frecuencia_consumo: [
    { id_receta: 40, nombre: "Avena con frutas", veces: 18 },
  ],
  adherencia: {
    resumen: conteo(180, 101, 30, 9, 40),
    semanas: [
      { inicio: "2026-11-09", fin: "2026-11-15", ...conteo(26, 14, 4, 2, 6) },
    ],
    por_plan: [
      {
        id_planificacion: 9,
        nombre: "Plan octubre",
        conteo: conteo(120, 80, 20, 5, 15),
      },
      {
        id_planificacion: 12,
        nombre: "Plan noviembre",
        conteo: conteo(60, 21, 10, 4, 25),
      },
    ],
    no_me_gustaron: [{ id_receta: 12, nombre: "Lentejas guisadas", veces: 3 }],
  },
  mediciones: {
    anterior: medicion(20, 74, "2026-09-15"),
    del_periodo: [
      medicion(31, 72.4, "2026-10-20"),
      medicion(32, 70.9, "2026-11-10"),
    ],
  },
}

export const REPORTE_VACIO: ReporteProgreso = {
  sin_registros: true,
  encabezado: { ...REPORTE.encabezado, nutricionista: null },
  perfil: {
    edad: null,
    sexo_biologico: null,
    peso_kg: null,
    altura_cm: null,
    nivel_actividad: null,
    objetivo: null,
    objetivo_personalizado: null,
  },
  restricciones: { restricciones_alimentarias: [], condiciones_medicas: [] },
  requerimiento: null,
  planes: [],
  frecuencia_consumo: [],
  adherencia: {
    resumen: conteo(0, 0, 0, 0, 0),
    semanas: [],
    por_plan: [],
    no_me_gustaron: [],
  },
  mediciones: { anterior: null, del_periodo: [] },
}
