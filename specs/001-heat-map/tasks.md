# Tareas del mapa de calor

Basadas en la especificación y el plan vigentes. Estado indicado por las casillas; esta lista no autoriza por sí sola su ejecución. Estimaciones por tarea: 15–30 minutos. Ejecutar en el orden indicado y respetar las dependencias explícitas.

Cada tarea que cambie comportamiento incluye sus pruebas pertinentes con `node --test` y comprobación en Chrome DevTools por `file://`, consola y vista móvil. No instalar dependencias ni usar datos reales. Las verificaciones finales amplían, no sustituyen, estas comprobaciones. Si una tarea supera 30 minutos, dividirla antes de continuar y conservar su trazabilidad.

## Preparación y aislamiento

- [x] **T01. Aislar la inicialización del navegador** — 25 min · RF-8, RF-10 · Depende de: ninguna.
  Mover consultas al DOM, carga y temporizadores a la inicialización; añadir exportación CommonJS protegida para tests sin cambiar reglas existentes.
  Hecho cuando: Node puede importar las funciones sin DOM, almacenamiento ni temporizadores y el diario sigue guardando y recargando por doble clic.
  Evidencia T01: tests escritos primero (2 fallos por `document` inexistente); tras aislar la inicialización, 2 pasan. Chrome aislado por `file://`: guardado/recarga correctos, consola sin mensajes y móvil sin desbordamiento. La continuación y su resultado se documentan al final.

- [x] **T02. Crear pruebas base de rachas** — 20 min · RF-8, RF-10 (no regresión) · Depende de: T01.
  Iniciar `tests/mapa-calor.test.cjs` con fechas controladas para ambas rachas.
  Hecho cuando: `node --test` comprueba hoy, ayer, huecos, duplicados, fechas futuras y registros retroactivos con resultados esperados explícitos.

- [x] **T03. Cubrir indicadores y fechas existentes** — 25 min · RF-3, RF-8 (no regresión) · Depende de: T02.
  Probar minutos semanales y días mensuales; eliminar la dependencia del reloj de la base de `convertirFecha`.
  Hecho cuando: pasan pruebas de semana/mes vacíos, cambios de año, fechas inválidas y años menores de 100 sin modificar fechas de entrada.

- [x] **T04. Preparar aislamiento de integración: almacenamiento y reloj** — 20 min · RF-8, RF-10 · Depende de: T01.
  Iniciar `tests/integracion.test.cjs` con contexto aislado, almacenamiento falso y reloj/temporizadores controlados.
  Hecho cuando: dos contextos no comparten datos y una prueba puede provocar una lectura fallida y avanzar el reloj sin esperas reales ni acceso al almacenamiento del usuario.

- [x] **T05. Añadir el DOM mínimo a las pruebas de integración** — 25 min · RF-7, RF-8, RF-10 · Depende de: T04.
  Incorporar solo las operaciones necesarias para inicializar el script actual, emitir eventos y observar cambios y foco.
  Hecho cuando: el script completo arranca en el contexto de prueba y una sesión válida se guarda mediante su manejador real, sin reproducir la lógica de la aplicación en el test.

## Modelo puro

- [x] **T06. Calcular el periodo con hoy explícito** — 20 min · RF-1, RF-2, RF-8 · Depende de: T03.
  Añadir `obtenerPeriodoMapa(hoy)` y sus pruebas.
  Hecho cuando: lunes, domingo y día intermedio devuelven el lunes de hace 11 semanas y el domingo actual sin cambiar `hoy`.

- [x] **T07. Validar el conjunto completo de sesiones** — 20 min · RF-10 · Depende de: T03.
  Añadir `validarSesionesMapa` reutilizando la validación existente.
  Hecho cuando: rechaza valores no array y cualquier sesión inválida, incluso exterior al periodo, sin filtrar ni modificar registros válidos.

- [x] **T08. Descomponer minutos decimales** — 25 min · RF-3, RF-4 · Depende de: T02.
  Añadir `descomponerMinutos` con coeficiente entero y escala, explicados brevemente.
  Hecho cuando: tests reconstruyen sin pérdida enteros, fracciones y números con exponentes positivos y negativos a partir de su representación guardada.

- [x] **T09. Sumar decimales exactamente** — 25 min · RF-3, RF-4, RF-10 · Depende de: T08.
  Añadir `sumarMinutosExactos` y detección de total no finito.
  Hecho cuando: 29,9 + 0,1, 59,9 + 0,1 y 119,9 + 0,1 dan 30, 60 y 120 en cualquier orden; una suma desbordada devuelve error sin limitarla.

- [x] **T10. Definir niveles y textos compartidos** — 20 min · RF-4, RF-5 · Depende de: T09.
  Añadir la tabla de intervalos y `obtenerNivelMapa` usando el total exacto.
  Hecho cuando: pasan los límites 0, 0,5, 29,5, 30, 59,5, 60, 119,5, 120 y superiores, y cambiar el máximo del periodo no cambia otros niveles.

- [x] **T11. Formatear totales sin redondearlos** — 20 min · RF-7 · Depende de: T09.
  Añadir `formatearMinutosMapa`, independiente del formato semanal.
  Hecho cuando: los tests verifican coma decimal, unidad «minutos», ausencia de ceros fraccionarios innecesarios y representación completa de valores pequeños y grandes sin exponentes.

- [x] **T12. Agrupar minutos por fecha visible** — 20 min · RF-3, RF-6, RF-9, RF-10 · Depende de: T06, T07, T09.
  Añadir `agruparMinutosPorFecha(sesiones, hoy)`.
  Hecho cuando: suma sesiones repetidas de distintos temas, incluye inicio y hoy, excluye anteriores y futuras, y no altera entradas desordenadas.

- [x] **T13. Construir los 84 días del mapa** — 25 min · RF-1, RF-2, RF-3, RF-4, RF-6, RF-9, RF-10 · Depende de: T10, T12.
  Añadir `construirMapa(sesiones, hoy)` y su estado vacío/error.
  Hecho cuando: devuelve 84 fechas únicas y cronológicas con semana/columna correctas, hoy identificado, futuras sin total ni nivel y vacío correcto incluso con sesiones solo futuras.

- [x] **T14. Verificar calendario en distintas zonas horarias** — 25 min · RF-1, RF-2, RF-3, RF-6, RF-8 · Depende de: T13.
  Ampliar los tests con procesos aislados y zonas con y sin horario estacional.
  Hecho cuando: pasan cambios de mes/año, año bisiesto y ambos cambios de horario sin omisiones, duplicados ni cambios en la zona horaria del equipo.

- [x] **T15. Generar la descripción de cada día** — 15 min · RF-2, RF-5, RF-6, RF-7 · Depende de: T11, T13.
  Añadir `obtenerConsultaDia` con fecha completa y textos compartidos.
  Hecho cuando: los tests distinguen cero, actividad y futuro, expresan el intervalo y no muestran minutos para una fecha futura.

## Lectura y guardado seguros

- [x] **T16. Distinguir éxito y errores de carga** — 25 min · RF-9, RF-10 · Depende de: T05, T07.
  Adaptar `cargarSesiones` y su consumidor para separar acceso, interpretación y vacío válido.
  Hecho cuando: clave inexistente permite usar un array vacío, pero texto vacío, contenido ilegible, valor no array y registros inválidos producen errores diferenciados sin escrituras.

- [x] **T17. Bloquear guardado ante lectura inválida** — 20 min · RF-10 · Depende de: T16.
  Mostrar el aviso junto al registro y bloquear tanto el botón como el envío real.
  Hecho cuando: un envío forzado tampoco escribe ni anuncia éxito y los datos originales permanecen idénticos; reabrir con datos válidos recupera el registro.

- [x] **T18. Probar el orden transaccional del guardado** — 25 min · RF-8, RF-10 · Depende de: T17.
  Ajustar solo lo necesario para conservar persistencia antes de memoria, formulario y aviso de éxito.
  Hecho cuando: un fallo de escritura conserva sesiones y formulario; un éxito mantiene clave, campos y orden de entradas, sin guardar totales ni valores BigInt.

## Representación

- [x] **T19. Añadir la estructura del mapa** — 20 min · RF-1, RF-2, RF-5, RF-7, RF-9, RF-10 · Depende de: T15, T17.
  Añadir en `index.html` la sección, título enfocable por programa, periodo, referencias, contenedores, estados y panel con Cerrar.
  Hecho cuando: está entre resumen y contenido, conserva los identificadores anteriores y no cambia el script clásico diferido.

- [x] **T20. Pintar fechas y referencias temporales** — 25 min · RF-1, RF-2, RF-3, RF-6 · Depende de: T13, T15, T19.
  Crear los botones cronológicos y nombres accesibles a partir del modelo puro.
  Hecho cuando: hay exactamente 84 botones con fechas únicas, inicio/final completos, referencias de lunes a domingo y hoy reconocible mediante texto además de estilo.

- [x] **T21. Añadir cuadrícula y estilos acotados** — 25 min · RF-2, RF-4, RF-6, RF-7 · Depende de: T20.
  Distribuir por filas semanales y siete columnas de lunes a domingo; neutralizar estilos globales de botones solo dentro del mapa.
  Hecho cuando: las 12 filas mantienen su orden de arriba abajo, cada celda mide al menos 44 × 44 píxeles CSS y Guardar sesión conserva su aspecto anterior.

- [x] **T22. Pintar niveles y leyenda** — 20 min · RF-4, RF-5, RF-6 · Depende de: T10, T21.
  Aplicar los cinco niveles y leyenda compartida; diferenciar futuro sin asignarle nivel cero.
  Hecho cuando: cada intervalo tiene su texto y una intensidad creciente comprobable; futuro y cero se distinguen también sin interpretar el color.

- [x] **T23. Representar vacío y errores sin resultados parciales** — 25 min · RF-9, RF-10 · Depende de: T16, T17, T20, T22.
  Conectar los estados del modelo y de lectura a los avisos.
  Hecho cuando: vacío válido mantiene consultas y leyenda; cualquier error deja solo título y aviso; error exclusivo de total no bloquea registro ni las demás vistas.

- [x] **T24. Adaptar el desplazamiento y el panel a móvil** — 25 min · RF-2, RF-6, RF-7 · Depende de: T21, T23.
  Limitar el desplazamiento horizontal al mapa y situar la consulta en flujo normal fuera de él.
  Hecho cuando: a 375 px y texto al 200 % se alcanzan las 84 fechas, los totales largos y Cerrar sin recortes ni desbordamiento horizontal de la página.

## Consulta e interacción

- [x] **T25. Modelar aperturas y sustitución de consulta** — 20 min · RF-6, RF-7 · Depende de: T15.
  Iniciar `resolverEstadoConsulta` para cursor, foco y selección por toque.
  Hecho cuando: tests de eventos puros abren fechas pasadas y futuras, sustituyen la anterior y conservan apertura cuando persiste una causa válida.

- [x] **T26. Modelar cierres y supresión de reapertura** — 25 min · RF-7, RF-8 · Depende de: T25.
  Añadir salida conjunta, toque exterior, Escape, Cerrar y fecha expulsada del periodo.
  Hecho cuando: los tests comprueban cierre sin reapertura por el foco restaurado, reapertura por nueva acción y destino de foco solo cuando corresponde.

- [x] **T27. Conectar cursor, panel y cambio de día** — 25 min · RF-6, RF-7 · Depende de: T23, T24, T26.
  Aplicar el estado puro a texto y visibilidad con los manejadores reales.
  Hecho cuando: pasar del día a su información o a Cerrar no cierra prematuramente; salir de ambos sin otra causa sí cierra, y otro día sustituye la información.

- [x] **T28. Conectar teclado y restauración de foco** — 25 min · RF-2, RF-7 · Depende de: T27.
  Añadir apertura por foco, acceso a Cerrar, Escape y desplazamiento de la fecha enfocada.
  Hecho cuando: las 84 fechas se recorren cronológicamente sin trampas; Enter/Espacio permite llegar a Cerrar y su cierre devuelve foco sin reabrir la consulta.

- [x] **T29. Conectar selección y cierre por toque** — 25 min · RF-6, RF-7 · Depende de: T28.
  Gestionar selección persistente y descartar hover sintetizado como nueva apertura.
  Hecho cuando: emulación táctil permite cambiar de día, tocar fuera y usar Cerrar sin que el foco automático ni eventos sintetizados reabran la consulta.

## Actualización sin pérdidas de estado

- [x] **T30. Actualizar tras guardar preservando nodos** — 25 min · RF-3, RF-7, RF-8, RF-9 · Depende de: T18, T23, T29.
  Conectar el éxito del guardado al modelo y actualizar botones por fecha sin sustituir los que siguen visibles.
  Hecho cuando: guardar en el día consultado actualiza total/nivel/texto sin perder foco, retira el mensaje vacío cuando corresponde y no exige recarga.

- [x] **T31. Comprobar guardado fallido con consulta abierta** — 15 min · RF-7, RF-8, RF-10 · Depende de: T30.
  Ampliar integración con un fallo de escritura durante una consulta.
  Hecho cuando: permanecen idénticos el día activo, total, nivel, foco, sesiones y formulario, sin aviso de éxito.

- [x] **T32. Ampliar la actualización periódica existente** — 25 min · RF-8, RF-9 · Depende de: T30.
  Compartir una referencia local de hoy por actualización y revisar fecha/zona horaria cada 30 segundos mientras la página sea visible.
  Hecho cuando: pruebas con reloj controlado cubren avances, retrocesos y cambios de zona; un futuro que llega a hoy incorpora sus minutos y el estado vacío se actualiza en ambos sentidos.

- [x] **T33. Actualizar al volver y antes de consultar** — 20 min · RF-7, RF-8 · Depende de: T32.
  Integrar retorno de suspensión y comprobación previa al manejo de consultas.
  Hecho cuando: tras ocultar y avanzar la fecha, la primera consulta usa el periodo vigente; no muestra datos antiguos y no crea otro temporizador independiente.

- [x] **T34. Resolver consultas al cambiar el periodo** — 20 min · RF-7, RF-8 · Depende de: T26, T33.
  Aplicar actualización de consulta y destino de foco al día retenido o expulsado.
  Hecho cuando: cambiar al lunes conserva una consulta aún visible y cierra una expulsada; el título recibe foco solo si antes estaba en el día expulsado o su panel.

## Verificación final y evidencias

- [x] **T35. Ejecutar la matriz automatizada completa** — 25 min · RF-1 a RF-10 · Depende de: T14, T31, T34.
  Ejecutar `node --test` y `node --check app.js`; contrastar sus casos con la matriz del plan.
  Hecho cuando: ambas comprobaciones pasan, cada grupo de la matriz tiene tests identificables y ninguna prueba usa datos reales ni cambia la zona del equipo.

- [x] **T36. Verificar periodos, estados e intensidades en Chrome** — 25 min · RF-1 a RF-6, RF-9, RF-10 · Depende de: T35.
  Abrir por `file://` en contexto aislado con sesiones de prueba y probar vacío, actividad, futuro y cada error.
  Hecho cuando: ubicación, 84 fechas, límites, cinco niveles, leyenda y avisos coinciden con la spec, y se registra consola y vista móvil sin errores nuevos.

- [ ] **T37. Verificar interacciones reales y lectura asistida** — 30 min · RF-2, RF-6, RF-7, RF-8 · Depende de: T36.
  Recorrer fechas con teclado, probar cursor/toque/cierres y escuchar fechas, intervalos y futuros con lector de pantalla.
  Hecho cuando: se documentan resultados de cada medio, sin trampas ni reaperturas; si falta lector de pantalla, la tarea permanece pendiente con el bloqueo registrado.
  Estado: teclado y ratón reales verificados en Chrome; eventos táctiles simulados en contexto móvil. Árbol accesible revisado. Pendiente escuchar un lector de pantalla real: el entorno no ofrece control ni salida de audio verificable. No se sustituye esta prueba por el árbol accesible.

- [ ] **T38. Verificar móvil, ampliación y contraste** — 25 min · RF-2, RF-4, RF-5, RF-6, RF-7 · Depende de: T37.
  Revisar las cuatro esquinas y números largos a 375 px y texto al 200 %; medir contrastes.
  Hecho cuando: hay capturas, todas las fechas y Cerrar son alcanzables, la página no desborda horizontalmente, el texto alcanza 4,5:1 y el foco 3:1.
  Evidencias visuales recogidas, sin cerrar la dependencia T37: capturas a 375 px y texto al 200 %, cuatro esquinas y total de 309 cifras alcanzables; contraste mínimo de texto del mapa 5,81:1 y foco sobre papel 13,33:1. Ver rutas al final.

- [ ] **T39. Verificar actualización y protección en navegador** — 30 min · RF-3, RF-7, RF-8, RF-9, RF-10 · Depende de: T38.
  Probar guardado retroactivo, fallo con consulta abierta, recarga, lectura inválida, error de total y cambios de fecha controlados; medir la cadencia visible real.
  Hecho cuando: actualización visible no supera 60 segundos, retorno usa datos vigentes, bloqueo/reapertura son correctos y las sesiones de prueba ilegibles permanecen literalmente intactas.
  Evidencias técnicas recogidas, sin cerrar las dependencias anteriores: temporizador real a 30053,6 ms desde la navegación y actualización 20749 ms después del cambio de fecha simulado; foco al título al expulsar el día consultado. Retroceso, retorno simulado, primera consulta y fallo de escritura comprobados. Datos ilegibles intactos.

- [ ] **T40. Verificar ausencia de regresiones y uso sin conexión** — 25 min · RF-1, RF-8, RF-10 (no regresión) · Depende de: T39.
  Comprobar registro, rachas, indicadores, orden del historial, persistencia y consola; repetir la consulta sin conexión.
  Hecho cuando: no hay nuevas solicitudes externas ni errores, se mantiene el contrato guardado y funcionan las vistas anteriores salvo el bloqueo protector previsto.
  Evidencias técnicas recogidas, sin cerrar las dependencias anteriores: recarga sin conexión por file://, seis sesiones de prueba persistentes, racha actual y mejor racha 3, orden del historial conservado, consola sin mensajes y cero solicitudes HTTP/HTTPS.

- [ ] **T41. Cerrar trazabilidad y actualizar memoria** — 20 min · RF-1 a RF-10 · Depende de: T40.
  Añadir resultados y referencias a pruebas/capturas bajo estas tareas y actualizar `MEMORY.md`, sin crear otro archivo de informe.
  Hecho cuando: cada criterio de RF-1 a RF-10 y requisito no funcional tiene evidencia, no quedan verificaciones pendientes ni fallos abiertos, y la memoria distingue lo implementado de lo previsto.
  Estado: memoria y trazabilidad actualizadas; cierre formal pendiente de T37 y sus tareas dependientes. No declarar terminada toda la verificación.

## Evidencias de implementación y pruebas

- Tests escritos antes de cada bloque: primer recorrido de lógica, 5 pasan y 11 fallan por funciones ausentes y fechas; primer recorrido de integración, 17 pasan y 10 fallan por protección/interfaz ausentes. Resultado final de `node --test`: **30 tests, 30 pasan, 0 fallan, 0 omitidos**. `node --check app.js`: correcto.
- Se añadieron regresiones antes de corregir dos fallos de interacción: reapertura por clic tras Escape y pérdida de foco al retirar un botón (el navegador dispara focusout). Los eventos de ratón posteriores a un toque no sustituyen la selección táctil.
- Pruebas de lógica en `tests/mapa-calor.test.cjs`; rutas reales de inicialización, envío, eventos y actualización en `tests/integracion.test.cjs`. Solo herramientas incluidas en Node; no se añadieron dependencias.
- Verificación por file:// en contextos Chrome aislados `mapa-verificacion-completa` y `mapa-errores-aislados`. No se modificaron las sesiones del usuario.

| Requisito | Evidencia automatizada | Evidencia Chrome |
| --- | --- | --- |
| RF-1 | T06 y T12/T13 | Ubicación entre resumen y registro; periodo 03/08/2026–25/10/2026. |
| RF-2 | T06, T12/T13, T14 y test de calendario horizontal | 84 botones, siete columnas y 12 filas tras el cambio aprobado; cabecera alineada. El orden cronológico de Tab se conserva. |
| RF-3 | T09, T12/T13 y T27/T31 | 29,9 + 0,1 actualiza a 30 sin recargar ni perder foco; otros temas se suman. |
| RF-4 | T10/T11 y T13 | Cinco niveles presentes; contraste de cifras por nivel entre 6,25:1 y 13,33:1. |
| RF-5 | T10/T11 y T20/T23 | Cinco intervalos textuales y colores compartidos con los días. |
| RF-6 | T12/T13 y T15 | Fecha futura con sesiones muestra «Día futuro», sin minutos ni nivel de actividad. |
| RF-7 | T15, T25/T26 y T27/T31 | Ratón, Tab, Enter, Espacio, Escape, Cerrar; selección por eventos táctiles, cierre exterior y sin reapertura; foco conservado. Lectura asistida real pendiente como RNF. |
| RF-8 | T27/T31 y T32/T34 y T33 | Guardado/recarga, fallos con formulario y consulta intactos, actualización periódica medida, foco al título, retroceso y retorno simulado. |
| RF-9 | T13, T18/T23 y T32/T34 | Vacío válido permite registrar; solo futuras sigue vacío hasta su fecha; mensaje se retira al añadir actividad. |
| RF-10 | T07, T13, T16/T17, T18/T23 y T27/T31 | Acceso denegado, texto vacío, ilegible, no array y registro inválido: bloqueo incluso al forzar envío y datos idénticos. Total no finito: solo mapa no disponible, registro permitido. Reapertura válida recupera el acceso. |

Requisitos no funcionales: interfaz en español, ejecución local sin conexión ni recursos externos, pruebas aisladas, contraste medido, foco y secuencia de teclado comprobados. A 375 px la página mide 375 px, incluso con texto al 200 %; el desplazamiento horizontal pertenece solo al mapa. Se revisaron las cuatro esquinas y números largos. **La escucha de un lector de pantalla y el cierre formal de QA siguen pendientes.**

Capturas revisadas (artefactos temporales, no archivos de la aplicación):
- `C:/Users/FRAN/AppData/Local/Temp/opencode/diario-mapa-375.png` (375 × 2650).
- `C:/Users/FRAN/AppData/Local/Temp/opencode/diario-mapa-375-texto-200.png` (375 px de ancho, texto al 200 %).
- `C:/Users/FRAN/AppData/Local/Temp/opencode/diario-mapa-escritorio.png` (1200 px de ancho).

## Revisión aprobada: días en horizontal
- Petición del usuario: lectura como calendario, lunes a domingo de izquierda a derecha y 12 semanas de arriba abajo. RF-2 y plan actualizados; no cambian datos, cálculos, colores ni consultas.
- Tests primero: 2 fallos esperados al exigir el nuevo modelo y estructura; después `node --test`: **31 pasan, 0 fallan**; `node --check app.js` correcto.
- Chrome aislado `mapa-horizontal`: 84 fechas en siete columnas y 12 filas, cabecera alineada. A 375 px caben las siete columnas sin desplazamiento horizontal; celdas de 44,14 px de ancho. Con texto al 200 %, solo se desplaza el calendario y la cabecera lo acompaña, sin desbordar la página.
- Guardado de cuatro sesiones de prueba, consulta y recarga correctos; racha 4 conservada. Escritorio de 1200 px comprobado y consola sin mensajes. Captura móvil revisada en la conversación; las capturas temporales anteriores corresponden a la orientación previa.
- No se modifica el estado pendiente de lector de pantalla y cierre de QA.
