export type HelpNote = {
  tipo: "consejo" | "advertencia"
  texto: string
}

export type HelpTopic = {
  id: string
  titulo: string
  resumen: string
  pasos: string[]
  notas: HelpNote[]
  palabras_clave: string[]
}

export type HelpFaq = {
  pregunta: string
  respuesta: string
}

export type HelpManual = {
  introduccion: string
  temas: HelpTopic[]
  preguntas_frecuentes: HelpFaq[]
}
