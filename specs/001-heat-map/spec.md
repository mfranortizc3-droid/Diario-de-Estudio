# Mapa de calor de estudio

## Contexto y objetivo
El Diario de Estudio permite registrar sesiones y consultar rachas, minutos semanales e historial. Falta una visión conjunta de cómo se distribuye el estudio entre los días.
El mapa mostrará la constancia y el tiempo diario de las últimas 12 semanas mediante intensidades de color comparables entre semanas, sin sustituir los indicadores existentes.

## Usuarios
Personas que registran sus sesiones de estudio y quieren reconocer periodos de continuidad, pausas y diferencias de dedicación diaria, tanto en ordenador como en móvil.

## Historias de usuario
- Como estudiante, quiero ver los días estudiados de las últimas 12 semanas para reconocer mi constancia.
- Como estudiante, quiero distinguir niveles fijos de minutos para comparar mi dedicación entre días y semanas.
- Como estudiante, quiero consultar la fecha y los minutos de un día para entender su intensidad sin depender solo del color.
- Como estudiante, quiero distinguir ausencia de estudio, días futuros y errores de lectura para no interpretar información incorrecta.

## Requisitos funcionales y criterios de aceptación

Los requisitos RF-1 a RF-9 se aplican cuando la lectura y la interpretación de las sesiones son correctas. Ante un error prevalece RF-10; no se interpretará la indisponibilidad como ausencia de estudio.

### RF-1. Ubicación y periodo
- Cuando se muestre la pantalla principal con los datos disponibles, el sistema deberá presentar el mapa debajo del resumen de estadísticas y antes del registro y del historial.
- Cuando se determine el periodo visible, el sistema deberá incluir 12 semanas de lunes a domingo: la semana actual y las 11 anteriores, según la fecha local del usuario.

### RF-2. Distribución temporal
- Mientras se muestre el mapa, el sistema deberá representar los días de lunes a domingo en siete columnas de izquierda a derecha, con una cabecera superior, y las 12 semanas en filas de arriba abajo, de la más antigua a la actual, para facilitar la lectura como calendario.
- Cuando se complete el periodo visible, el sistema deberá representar sus 84 fechas una sola vez, incluidos los días futuros de la semana actual.
- Mientras se muestre el mapa, el sistema deberá identificar con fechas completas el inicio y el final del periodo, indicar los días de la semana y distinguir hoy sin depender únicamente del color.

### RF-3. Minutos por día
- Cuando existan varias sesiones en una fecha visible hasta hoy, el sistema deberá sumar sus minutos y representar un único total diario, sin agrupar por tema.
- Cuando una fecha visible hasta hoy no tenga sesiones, el sistema deberá asignarle un total de cero minutos.
- Cuando una sesión quede fuera del periodo visible, el sistema deberá excluirla del mapa sin modificarla.
- Cuando se sumen minutos decimales, el sistema deberá conservar el resultado de la suma decimal de los valores guardados, sin desviaciones que cambien el nivel; por ejemplo, 29,9 más 0,1 deberá sumar 30 minutos.

### RF-4. Intensidades fijas
- Cuando se represente un total diario, el sistema deberá asignarle uno de cinco niveles: cero; más de cero y menos de 30; desde 30 y menos de 60; desde 60 y menos de 120; 120 minutos o más.
- Mientras se comparen días con datos disponibles, el sistema deberá mostrar mayor intensidad para un nivel superior y la misma intensidad para totales del mismo nivel, independientemente del máximo del periodo.
- Cuando haya minutos decimales, el sistema deberá determinar el nivel con el total sin redondearlo previamente.

### RF-5. Leyenda
- Mientras se muestre el mapa con datos disponibles, el sistema deberá mostrar una leyenda que identifique los cinco intervalos de minutos y el sentido de menor a mayor intensidad.

### RF-6. Días futuros
- Cuando una fecha visible sea posterior a hoy, el sistema deberá distinguirla de los días sin estudio y no atribuirle intensidad de actividad, aunque existan sesiones guardadas para esa fecha.
- Cuando se consulte un día futuro, el sistema deberá mostrar su fecha y señalar que es un día futuro, sin presentarlo como cero minutos estudiados.

### RF-7. Consulta de días
- Cuando el usuario pase el cursor, enfoque con el teclado o toque cualquier día visible, el sistema deberá abrir su consulta: fecha completa, minutos y nombre del intervalo de intensidad para fechas hasta hoy; fecha y estado futuro para las posteriores.
- Cuando se muestre un total, el sistema deberá usar coma decimal y la unidad minutos, omitir decimales innecesarios y conservar las cifras necesarias sin redondear el valor ni contradecir su intervalo.
- Mientras el cursor permanezca sobre el día o su información, el sistema deberá mantener abierta la consulta; cuando abandone ambos y no haya foco de teclado ni selección por toque, deberá cerrarla.
- Mientras el foco permanezca en el día o su consulta, el sistema deberá mantenerla abierta; cuando el foco salga de ambos, deberá cerrarla salvo que exista una selección por toque.
- Cuando el usuario toque un día, el sistema deberá mantenerlo seleccionado hasta que toque otro día, toque fuera del día y de su consulta o active el control Cerrar.
- Cuando el usuario active Cerrar o pulse Escape, el sistema deberá cerrar la consulta sin reabrirla automáticamente hasta una nueva acción sobre un día y sin perder el foco de teclado.
- Cuando se consulte otro día, el sistema deberá sustituir la información anterior por la del día consultado, sin alterar las sesiones.

### RF-8. Actualización
- Cuando se guarde correctamente una sesión de una fecha visible hasta hoy, el sistema deberá actualizar su total y nivel sin exigir recargar la página.
- Cuando cambie la fecha local o la zona horaria con la página visible, el sistema deberá actualizar el periodo, las fechas futuras, los totales y los niveles en un máximo de 60 segundos, sin exigir recarga; esta regla también se aplica si el reloj se ajusta hacia atrás.
- Cuando la página vuelva a estar visible tras permanecer oculta o suspendida, el sistema deberá actualizar esos datos antes de permitir una nueva consulta.
- Cuando un día futuro pase a ser hoy, el sistema deberá incorporar sus sesiones guardadas al total y asignarle el nivel correspondiente.
- Cuando se actualice un día consultado que continúe visible, el sistema deberá actualizar también su consulta; si sale del periodo, deberá cerrarla y, si el foco estaba en ese día o su consulta, situarlo en el título del mapa.
- Si falla el guardado de una sesión, el sistema deberá conservar el mapa y la consulta con los últimos datos guardados correctamente, sin añadir los minutos del intento fallido ni anunciar éxito.
- Cuando se vuelva a abrir el diario, el sistema deberá representar el mapa a partir de las sesiones conservadas y la fecha local vigente.

### RF-9. Ausencia de sesiones
- Si no existen sesiones entre el inicio del periodo y hoy y la lectura es correcta, el sistema deberá mostrar los días hasta hoy con nivel cero, mantener la distinción de días futuros y explicar que aún no hay estudio registrado en ese periodo, incluso si existen sesiones futuras guardadas.
- Mientras se muestre ese estado, el sistema deberá permitir seguir registrando sesiones y consultar las fechas visibles.
- Cuando aparezca actividad entre el inicio del periodo y hoy, el sistema deberá retirar el mensaje de periodo vacío; cuando desaparezca toda la actividad de ese intervalo por un cambio de periodo o fecha local, deberá volver a mostrarlo.

### RF-10. Error de lectura
- Si la lectura falla, el conjunto guardado es ilegible o alguna sesión contiene una fecha inválida, un tema vacío o minutos no numéricos, no finitos o no positivos, el sistema deberá tratar el conjunto como no disponible, sin presentar resultados parciales ni descartar registros.
- Si un total diario no puede representarse como un número finito positivo pese a partir de sesiones válidas, el sistema deberá declarar el mapa no disponible, sin limitar ni sustituir el total y sin modificar los datos.
- Mientras el mapa no esté disponible, el sistema deberá conservar su título y mostrar únicamente un aviso en lugar de la cuadrícula, la leyenda y las consultas; el aviso deberá explicar si falla el acceso, la interpretación de sesiones o el cálculo de totales e indicar que se revise el acceso o los datos, según corresponda, y se vuelva a abrir el diario.
- Mientras haya un error de lectura o interpretación de las sesiones, el sistema no deberá permitir guardar nuevas sesiones sobre ese conjunto ni anunciar éxito; deberá explicar que el guardado está bloqueado para proteger las sesiones existentes. Esta es la excepción explícita al comportamiento habitual del registro.
- Mientras el error afecte únicamente al cálculo de un total del mapa y las sesiones puedan leerse correctamente, el sistema deberá conservar el funcionamiento habitual del registro y del resto del diario.
- Cuando se vuelva a abrir el diario y la lectura sea correcta, el sistema deberá mostrar el mapa con los datos recuperados.

## Requisitos no funcionales
- La interfaz y sus mensajes deberán estar en español, con términos claros para una persona sin conocimientos técnicos.
- El periodo y los días de la semana deberán tener referencias textuales; cada consulta deberá expresar su nivel o estado con texto. Un lector de pantalla deberá anunciar la fecha, los minutos y el intervalo o, si corresponde, el estado futuro.
- Las 84 fechas deberán poder recorrerse con teclado en orden cronológico, sin trampas de foco; cada consulta y su cierre deberán funcionar también con ratón y toque. El foco deberá distinguirse con un contraste mínimo de 3:1 respecto al fondo adyacente.
- Los textos deberán alcanzar un contraste mínimo de 4,5:1 respecto a su fondo.
- A 375 px de ancho y con el texto ampliado al 200 %, todas las fechas y sus consultas deberán ser alcanzables, sin texto cortado, superpuesto ni desbordamiento horizontal de la página. Se permite desplazamiento horizontal dentro del mapa, sin cambiar el periodo ni el orden de semanas.
- Las consultas, incluidas las de los bordes del mapa, deberán permanecer dentro del área visible o ser alcanzables por desplazamiento vertical, sin ocultar su control de cierre.
- La consulta del mapa no deberá alterar las sesiones ni cambiar el comportamiento de rachas, registro, indicadores e historial existentes, salvo el bloqueo protector del guardado definido en RF-10.
- El mapa deberá poder consultarse sin conexión y no deberá enviar las sesiones a terceros.
- Las verificaciones deberán usar datos de prueba aislados, sin modificar los datos reales del usuario.

## Casos límite
- Varias sesiones el mismo día: sumar todas, sin duplicar la fecha.
- Límites de intensidad: comprobar 0; 0,5; 29,5; 30; 59,5; 60; 119,5; 120 y valores superiores a 120 minutos.
- Periodo vacío y diario sin sesiones: nivel cero solo hasta hoy; días futuros diferenciados.
- Sesiones únicamente anteriores al periodo: mostrar el periodo vacío sin borrar el historial anterior.
- Fechas del primer lunes y último domingo visibles: incluirlas; excluir las inmediatamente exteriores.
- Sesiones futuras guardadas: no mostrar actividad hasta que llegue su fecha local.
- Registro retroactivo: actualizar el día correspondiente si está en el periodo.
- Cambios de semana, mes, año, año bisiesto y horario estacional: conservar fechas locales consecutivas sin omisiones ni duplicados.
- Error de lectura o datos ilegibles: aviso de indisponibilidad, nunca un mapa vacío engañoso.
- Sumas decimales en los umbrales: 29,9 + 0,1; 59,9 + 0,1; 119,9 + 0,1 deberán dar 30, 60 y 120 respectivamente, sin cambiar el resultado según el orden de sesiones.
- Totales grandes pero representables: mantener el total completo y el nivel máximo, con texto legible y sin recortes; totales no finitos: indisponibilidad del mapa sin alterar las sesiones.
- Una sesión inválida entre otras válidas, incluso fuera del periodo: error del conjunto, sin resultados parciales ni guardado que lo sobrescriba.
- Guardado fallido con consulta abierta: conservar total, nivel y consulta anteriores.
- Sesiones solo futuras dentro del periodo: mensaje de periodo vacío; al llegar su día, incluir actividad y retirar el mensaje.
- Cambio de lunes con consulta abierta sobre la semana que sale: cerrar la consulta y conservar un destino de foco válido.
- Ajuste manual del reloj hacia adelante o atrás, cambio de zona horaria y regreso tras suspensión: aplicar RF-8 sin duplicar ni omitir fechas.
- Paso de mapa vacío a activo y vuelta a vacío por cambio de periodo: mensaje coherente con las fechas hasta hoy.
- Consulta en las cuatro esquinas, texto al 200 %, lectura asistida, recorrido completo con teclado y cierre por Escape y por toque: contenido accesible sin bloqueo del foco.

## Fuera de alcance
- Navegar a periodos anteriores, elegir otro intervalo o cambiar las 12 semanas visibles.
- Filtrar por tema, cambiar los umbrales o adaptar la escala al máximo del periodo.
- Crear, editar o eliminar sesiones desde el mapa.
- Añadir objetivos, comparaciones entre personas, exportaciones o nuevas estadísticas.
- Cambiar las reglas de las rachas o el formato de las sesiones guardadas; se incluye únicamente el bloqueo protector del guardado descrito en RF-10.
- Recuperar, reparar o eliminar automáticamente sesiones inválidas y sincronizar cambios entre varias ventanas abiertas.

## Criterios de finalización
- Todos los criterios RF-1 a RF-10 y los requisitos no funcionales están verificados con resultados documentados.
- La verificación funcional se ha realizado con Chrome DevTools, revisión de consola y vista móvil; los cálculos se han comprobado con fechas locales controladas. No se han instalado dependencias para las pruebas.
- Se han comprobado los casos límite, incluidos los intervalos de minutos, las fechas locales y los estados vacío y de error.
- La consulta funciona con ratón, teclado y toque; la vista de 375 px se ha revisado visualmente.
- Las sesiones se conservan al reabrir el diario y las funciones existentes no presentan regresiones, verificando expresamente el bloqueo protector de RF-10 y su desaparición al reabrir con datos legibles y válidos.
- No aparecen errores nuevos durante la consulta ni la actualización del mapa.
- La verificación no ha modificado datos reales del usuario.

## Dudas abiertas
Los hallazgos de la revisión QA quedan resueltos mediante las decisiones recogidas en esta revisión. No se mantienen dudas abiertas conocidas. Cualquier ambigüedad nueva se registrará como [NECESITA ACLARACIÓN] antes de implementar el comportamiento afectado.
