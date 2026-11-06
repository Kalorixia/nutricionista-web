import type { HelpManual } from "@/types/help"

export const MANUAL_NUTRICIONISTA: HelpManual = {
  introduccion:
    "Encontrá el paso a paso para gestionar pacientes, crear planes alimentarios y usar el Copiloto en el portal.",
  temas: [
    {
      id: "ingresar",
      titulo: "Ingresar a Kalorixia",
      resumen: "Entrá al portal con tu cuenta profesional.",
      pasos: [
        "Abrí la dirección web del portal de Kalorixia.",
        "Escribí tu “Email” y tu “Contraseña”.",
        "Tocá “Ingresar”.",
        "Si todavía no tenés cuenta, tocá “Registrate como nutricionista”, completá el formulario y tocá “Crear cuenta”. Hasta que un administrador apruebe tu matrícula vas a ver “Tu cuenta está en revisión”.",
      ],
      notas: [
        {
          tipo: "consejo",
          texto:
            "No compartas tus credenciales. Si usás un equipo compartido, cerrá sesión al terminar.",
        },
      ],
      palabras_clave: [
        "ingresar",
        "inicio de sesion",
        "login",
        "acceso",
        "registro",
      ],
    },
    {
      id: "cuenta-matricula",
      titulo: "Consultar mi cuenta y el estado de mi matrícula",
      resumen: "Revisá tus datos y si tu matrícula está aprobada.",
      pasos: [
        "Al pie del menú lateral, tocá tu nombre para abrir el menú y elegí “Mi cuenta”.",
        "Ahí ves tu “Nombre”, tu “Email”, tu “Matrícula” y su “Estado”.",
        "Mientras la matrícula no esté aprobada, el portal te muestra la pantalla “Tu cuenta está en revisión”. Cuando un administrador la apruebe, tocá “Ya me aprobaron, verificar ahora” para entrar.",
        "Si la rechazaron, la pantalla dice “Tu solicitud fue rechazada” y muestra el “Motivo”.",
      ],
      notas: [],
      palabras_clave: [
        "perfil",
        "matricula",
        "estado",
        "aprobada",
        "rechazada",
        "pendiente",
      ],
    },
    {
      id: "pacientes",
      titulo: "Buscar y gestionar pacientes",
      resumen: "Encontrá a tus pacientes vinculados y abrí su ficha.",
      pasos: [
        "Entrá a “Pacientes” desde el menú lateral.",
        "En “Pacientes vinculados”, escribí en “Buscar por nombre…”. El buscador solo encuentra a los pacientes que ya están vinculados con vos.",
        "Tocá “Ver perfil” para abrir la ficha: ahí ves edad, sexo biológico, peso, altura, objetivo y nivel de actividad, además de “Seguimiento del plan”, “Condiciones médicas”, “Restricciones alimentarias” y “Planes de alimentación”.",
        "Para corregir los datos físicos, las condiciones o las restricciones, tocá “Editar datos” en “Perfil clínico”. Para actualizar los gustos y hábitos que el paciente contó, tocá “Editar preferencias” en “Preferencias”.",
        "Para armarle un plan, tocá “Crear plan”.",
        "Para cortar el vínculo, tocá “Desvincular” (en la lista o en la ficha) y confirmá en “¿Desvincular paciente?”.",
      ],
      notas: [
        {
          tipo: "consejo",
          texto:
            "Consultá solo la información necesaria y tratá los datos de tus pacientes con confidencialidad.",
        },
      ],
      palabras_clave: [
        "pacientes",
        "buscar",
        "ficha",
        "perfil clinico",
        "desvincular",
        "preferencias",
      ],
    },
    {
      id: "vincular-codigo",
      titulo: "Vincular un paciente con un código",
      resumen: "Generá un código para que el paciente se vincule a tu perfil.",
      pasos: [
        "Entrá a “Pacientes” y tocá “Generar código”.",
        "Se abre “Código de vinculación” con un código QR, el código para cargarlo a mano (“O cargalo a mano”) y la fecha de vencimiento (“Vence el …”).",
        "Pasale el QR o el código al paciente. Con “Copiar código” lo copiás para enviárselo.",
        "El paciente escanea el QR o escribe el código en su app y queda vinculado al instante: aparece en “Pacientes vinculados”.",
        "En “Códigos activos” están los códigos que todavía no se usaron. Con “Ver QR” volvés a mostrar el QR, con “Copiar” copiás el código y con “Revocar” lo anulás (confirmás en “¿Revocar este código?”).",
        "“Ver historial de códigos” muestra los códigos Usado, Expirado o Revocado.",
      ],
      notas: [
        {
          tipo: "advertencia",
          texto:
            "Compartí cada código solo con el paciente que querés vincular. Si se filtró o lo mandaste a la persona equivocada, tocá “Revocar”.",
        },
      ],
      palabras_clave: [
        "vinculacion",
        "vincular",
        "codigo",
        "qr",
        "generar",
        "revocar",
        "paciente nuevo",
      ],
    },
    {
      id: "planes",
      titulo: "Crear y publicar un plan alimentario",
      resumen: "Armá un plan para un paciente y publicalo para que lo vea.",
      pasos: [
        "Entrá a “Planificación” y tocá “Nuevo plan”. También podés tocar “Crear plan” en la ficha del paciente: abre Planificación con el paciente ya elegido.",
        "En “Nuevo plan de alimentación” elegí el paciente, escribí el nombre del plan, revisá los objetivos y las comidas del día, y tocá “Crear manual”.",
        "En el editor, tocá “Agregar receta” en el día y el momento que corresponda, y buscá la receta o el alimento.",
        "En “Indicaciones generales” escribí lo que querés que lea el paciente (hidratación, horarios, actividad).",
        "Revisá cantidades y recomendaciones, y tocá “Aprobar y publicar”. Confirmá en “¿Aprobar y publicar este plan?”.",
        "En la lista de Planificación, cada plan figura como Borrador, Publicada o Archivada. Un Borrador tiene “Revisar y publicar” y uno Publicada se puede “Archivar”.",
        "Si editás un plan Publicada, el portal te pregunta “¿Modificar un plan publicado?”: el paciente ve el cambio de inmediato, sin que vuelvas a publicar.",
      ],
      notas: [
        {
          tipo: "consejo",
          texto:
            "Antes de publicar, confirmá que estás en el plan del paciente correcto, que responde a sus necesidades y que las indicaciones no incluyen notas internas, porque las ve el paciente.",
        },
      ],
      palabras_clave: [
        "plan",
        "plan alimentario",
        "planificacion",
        "publicar",
        "borrador",
        "editor",
        "menu",
        "comidas",
        "archivar",
      ],
    },
    {
      id: "recetas",
      titulo: "Consultar y organizar recetas",
      resumen:
        "Buscá recetas y alimentos del catálogo y guardalos en tus listas.",
      pasos: [
        "Entrá a “Recetas” desde el menú lateral.",
        "Buscá en “Buscar por nombre o categoría…” y filtrá con “Todo”, “Recetas” o “Alimentos”.",
        "Tocá una receta para ver el detalle: las calorías por porción (cuando están cargadas), los “Ingredientes” y la “Preparación”.",
        "Tocá “Agregar a lista” para sumarla a una de tus listas.",
        "Para usarla en un plan, abrí el plan en “Planificación” y tocá “Agregar receta” en el día y el momento que corresponda.",
      ],
      notas: [
        {
          tipo: "advertencia",
          texto:
            "Antes de recomendar una receta, revisá alergias, intolerancias, preferencias y necesidades clínicas del paciente. El catálogo no sustituye tu evaluación profesional.",
        },
      ],
      palabras_clave: [
        "recetas",
        "catalogo",
        "alimentos",
        "ingredientes",
        "preparacion",
        "alergias",
        "buscar",
      ],
    },
    {
      id: "listas",
      titulo: "Armar listas de recetas",
      resumen: "Organizá tus recetas en colecciones propias.",
      pasos: [
        "Entrá a “Listas” desde el menú lateral y tocá “Nueva lista”.",
        "Escribí el nombre de la lista y tocá “Crear”.",
        "En la tarjeta de la lista tocá “Abrir”. Ahí, “Agregar recetas” abre un buscador (“Buscar por nombre…”) para sumar recetas.",
        "Para sacar una receta, tocá “Quitar de la lista”. Para borrar la lista completa, tocá “Eliminar lista” (o “Eliminar” en su tarjeta).",
        "También podés sumar una receta a una lista desde su detalle, con “Agregar a lista”.",
      ],
      notas: [
        {
          tipo: "advertencia",
          texto:
            "Las listas son privadas: son una herramienta tuya para organizar recetas y tus pacientes no las ven. Lo que ve el paciente son los planes que publicás.",
        },
      ],
      palabras_clave: [
        "listas",
        "colecciones",
        "recetas",
        "organizar",
        "nueva lista",
      ],
    },
    {
      id: "copiloto",
      titulo: "Usar el Copiloto",
      resumen:
        "Pedile al Copiloto un borrador de plan y revisalo antes de publicar.",
      pasos: [
        "Entrá a “Planificación”, tocá “Nuevo plan” y completá el paciente, el nombre, los objetivos y las comidas del día.",
        "Si querés, escribí tus pedidos en “Indicaciones para el Copiloto” (por ejemplo, cenas livianas). Es un campo opcional.",
        "Tocá “Generar con Copiloto”. El portal avisa “Lo estoy generando. Te aviso cuando esté listo.”.",
        "Mientras se arma, el plan aparece en “En preparación”, en Planificación, y arriba en el portal se ve “Generando …”. Podés seguir usando el portal. Si la generación falla, figura como “Falló” y podés tocar “Descartar”.",
        "Cuando termina, el Copiloto deja un borrador privado en Planificación. Abrilo y revisalo: cantidades, recetas y lo que indica “Revisá esto antes de aprobar”.",
        "Ajustalo en el editor y, cuando esté bien, tocá “Aprobar y publicar”.",
      ],
      notas: [
        {
          tipo: "advertencia",
          texto:
            "Tu criterio profesional va primero. Verificá datos, cantidades, alérgenos y que el plan coincida con los objetivos del paciente. No publiques sin revisar.",
        },
      ],
      palabras_clave: [
        "copiloto",
        "inteligencia artificial",
        "ia",
        "generar",
        "borrador",
        "en preparacion",
        "indicaciones",
      ],
    },
    {
      id: "seguridad",
      titulo: "Cuidar mi cuenta y la información clínica",
      resumen:
        "Cambiá tu contraseña, cerrá sesión y protegé los datos de tus pacientes.",
      pasos: [
        "Al pie del menú lateral, tocá tu nombre y elegí “Mi cuenta”.",
        "En “Cambiar contraseña”, escribí la “Contraseña actual” y la “Contraseña nueva” y tocá “Actualizar contraseña”.",
        "Para salir, tocá “Cerrar sesión” en el menú de tu nombre o “Salir” arriba a la derecha, y confirmá en “¿Cerrar sesión?”.",
      ],
      notas: [
        {
          tipo: "consejo",
          texto:
            "Usá una contraseña segura y no la compartas. Si sospechás que alguien entró a tu cuenta, cambiá la contraseña enseguida.",
        },
        {
          tipo: "advertencia",
          texto:
            "Tratá la información de tus pacientes con confidencialidad y de acuerdo con tus obligaciones profesionales.",
        },
      ],
      palabras_clave: [
        "seguridad",
        "contrasena",
        "cerrar sesion",
        "salir",
        "privacidad",
        "confidencialidad",
        "datos",
      ],
    },
  ],
  preguntas_frecuentes: [
    {
      pregunta: "No puedo ingresar",
      respuesta:
        "Revisá que el email y la contraseña estén bien escritos y sin espacios de más, y probá de nuevo.",
    },
    {
      pregunta: "No encuentro a un paciente",
      respuesta:
        "En “Pacientes” solo aparecen los pacientes vinculados con vos. Si todavía no lo está, tocá “Generar código” y pasale el código para que se vincule.",
    },
    {
      pregunta: "No puedo publicar un plan",
      respuesta:
        "El plan tiene que tener al menos una comida cargada. Agregá recetas con “Agregar receta” y volvé a tocar “Aprobar y publicar”.",
    },
    {
      pregunta: "El paciente no ve el plan",
      respuesta:
        "Verificá que el plan figure como Publicada en Planificación y que el paciente siga vinculado con vos.",
    },
    {
      pregunta: "Una función no responde",
      respuesta:
        "Actualizá la página y volvé a intentarlo. Si el mensaje de error sigue apareciendo, cerrá sesión y volvé a ingresar.",
    },
  ],
}
