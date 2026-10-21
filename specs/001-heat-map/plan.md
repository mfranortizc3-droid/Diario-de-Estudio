# Plan técnico del mapa de calor

## Alcance y estado
Plan basado en la constitución y la especificación vigente. No implementa la funcionalidad ni crea todavía los archivos de pruebas previstos. Mantiene la aplicación en sus tres archivos, ejecutable por doble clic, sin servidor, dependencias, módulos ES ni compilación.

## 1. Archivos y responsabilidades

| Archivo | Acción prevista | Responsabilidad | Cobertura |
| --- | --- | --- | --- |
| `index.html` | Modificar | Sección entre resumen y contenido: título, periodo, días de la semana, contenedor de fechas, leyenda, mensaje de vacío/error y consulta con Cerrar. Mantener script clásico diferido. | RF-1, RF-2, RF-5, RF-7, RF-9, RF-10 |
| `styles.css` | Modificar | Calendario de 7 columnas (lunes a domingo) y 12 filas semanales, cinco niveles, futuro y hoy, foco, consulta, desplazamiento interno y adaptación móvil. Selectores propios del mapa. | RF-2, RF-4 a RF-7, RF-9, RF-10 |
| `app.js` | Modificar | Funciones puras, adaptación de almacenamiento, representación, eventos y actualización. Separar estos bloques con nombres claros, sin crear otra capa de archivos. Conservar los cálculos existentes. | RF-1 a RF-10 |
| `tests/mapa-calor.test.cjs` | Crear al implementar | Pruebas de lógica y regresión con fechas controladas, sin navegador ni almacenamiento. | RF-1 a RF-6, RF-8 a RF-10 |
| `tests/integracion.test.cjs` | Crear al implementar | Pruebas de carga, guardado, actualización y estado de consulta con sustitutos mínimos de las API del navegador. No simular un motor de diseño ni afirmar que reemplazan la prueba visual. | RF-7 a RF-10 |
| `specs/001-heat-map/plan.md` | Crear ahora | Decisiones, pseudocódigo, trazabilidad y verificación previstos. | RF-1 a RF-10 |
| `MEMORY.md` | Actualizar | Registrar el plan y después los resultados reales; no confundir planificación con verificación realizada. | RF-1 a RF-10 |

No modificar la constitución ni la especificación para acomodar una implementación. No crear un manifiesto de paquetes. Los archivos de pruebas no forman parte de la aplicación distribuida.

## 2. Funciones puras y contratos

Toda función que dependa del calendario recibe `hoy` explícitamente. Las auxiliares aritméticas o de presentación no reciben una fecha que no usan. Ninguna accede al DOM, al almacenamiento, a temporizadores ni al reloj actual; tampoco modifica los argumentos.

| Función propuesta | Entrada y resultado | Cobertura |
| --- | --- | --- |
| `obtenerPeriodoMapa(hoy)` | Copia de fecha local a mediodía; devuelve primer lunes de las 12 semanas y último domingo de la actual. | RF-1, RF-2, RF-8 |
| `validarSesionesMapa(sesiones)` | Comprueba array y todos sus registros, incluso exteriores al periodo; devuelve validez o error de interpretación, sin filtrar ni reparar. Reutiliza `sesionValida`. | RF-10 |
| `descomponerMinutos(minutos)` | Convierte la representación decimal del número guardado, incluida notación exponencial, en coeficiente entero y escala decimal. | RF-3, RF-4 |
| `sumarMinutosExactos(valores)` | Suma coeficientes ajustados a una escala común; devuelve total decimal exacto normalizado o error de total no finito. | RF-3, RF-4, RF-10 |
| `agruparMinutosPorFecha(sesiones, hoy)` | Tras validar el conjunto, agrupa únicamente las sesiones entre el primer lunes visible y hoy; devuelve totales exactos por fecha o error de total. | RF-3, RF-6, RF-9, RF-10 |
| `obtenerNivelMapa(total)` | Compara el total decimal exacto con 0, 30, 60 y 120; devuelve nivel 0 a 4. | RF-4, RF-5 |
| `formatearMinutosMapa(total)` | Devuelve el decimal completo con coma, sin ceros fraccionarios finales ni notación exponencial, seguido de «minutos». No reutiliza el formato semanal en horas. | RF-7 |
| `construirMapa(sesiones, hoy)` | Devuelve periodo, 84 días cronológicos y estado vacío, o error. Cada día contiene fecha, semana (fila visual), columna (día de lunes a domingo), indicador de hoy, estado futuro y, solo hasta hoy, total y nivel. | RF-1 a RF-6, RF-8 a RF-10 |
| `obtenerConsultaDia(dia)` | Devuelve fecha completa y descripción de total/nivel o estado futuro, para texto visible y nombre accesible coherentes. | RF-6, RF-7 |
| `resolverEstadoConsulta(estado, evento, fechasVisibles)` | Devuelve siguiente estado, día activo y destino de foco solicitado; sin ejecutar cambios de foco. Distingue cursor, foco, selección por toque y cierre explícito. | RF-7, RF-8 |

Reutilizar `fechaLocal` y `convertirFecha`. Esta última actualmente consulta el reloj para crear la fecha base: sustituir solo esa base por una fecha local fija a mediodía y conservar la asignación explícita del año, mes y día. Verificar años menores de 100 y la validación de fechas por recorrido de ida y vuelta. No introducir semántica UTC ni restas de milisegundos.

Los niveles y sus textos se definen una sola vez en una tabla sencilla compartida por leyenda y consultas. Los estados de error se distinguen como acceso, interpretación o total; el array vacío solo significa lectura correcta sin sesiones. [RF-3 a RF-7, RF-9, RF-10]

## 3. Algoritmo del mapa en pseudocódigo

Pseudocódigo descriptivo, no código ejecutable. [RF-1 a RF-6, RF-8 a RF-10]

1. Recibir sesiones y hoy; validar el conjunto completo antes de excluir fechas.
2. Si hay algún registro inválido, devolver error de interpretación sin resultados parciales.
3. Copiar hoy a mediodía local y obtener su lunes retrocediendo días del calendario.
4. Desde ese lunes, retroceder 11 semanas para obtener el inicio; avanzar hasta el domingo actual para obtener el final.
5. Agrupar las sesiones entre inicio y hoy por su fecha, sin separar temas.
6. Para cada grupo, sumar exactamente sus valores decimales guardados:
   - Obtener coeficiente y escala, expandiendo también exponentes positivos o negativos.
   - Igualar escalas y sumar coeficientes enteros; quitar únicamente ceros decimales finales.
   - Comprobar que la conversión numérica del total sigue siendo finita y positiva; si no, devolver error de total sin cuadrícula parcial.
   - Mantener el decimal exacto para comparar umbrales y mostrarlo, no la conversión aproximada de comprobación.
7. Recorrer exactamente 84 días desde inicio, avanzando con el calendario local:
   - Asignar semana (fila) y día de la semana (columna) a partir de la posición del día.
   - Marcar hoy comparando las fechas locales.
   - Si es posterior a hoy, marcar futuro, sin total ni nivel de actividad.
   - En otro caso, usar su suma exacta o cero y obtener el intervalo correspondiente.
8. Marcar periodo vacío si no hay actividad entre inicio y hoy; las sesiones futuras no desactivan este mensaje.
9. Devolver el modelo completo; ninguna operación anterior escribe datos ni modifica sesiones.

## 4. Almacenamiento e integración

### Lectura y protección [RF-9, RF-10]
- Cambiar el contrato interno de `cargarSesiones`: devolver un resultado que distinga éxito, error de acceso y error de interpretación. Actualmente devuelve una lista vacía tras cualquier error, lo que permitiría sobrescribir datos ilegibles al guardar.
- Interpretar clave inexistente como array vacío válido. Tratar texto vacío, contenido ilegible, valor distinto de array o cualquier registro inválido como error de interpretación.
- Mantener exactamente la clave `diario-de-estudio-sesiones` y los campos `fecha`, `tema`, `minutos`; no serializar totales, niveles ni estados del mapa.
- Ante lectura inválida, mostrar aviso en el mapa y junto al registro, desactivar Guardar y comprobar también el bloqueo dentro del manejador de envío. No escribir, limpiar ni reparar los datos originales.
- Ante error únicamente de total, ocultar el contenido del mapa pero no bloquear registro, historial ni indicadores existentes.
- Recuperar tras reabrir con acceso y datos válidos; no incorporar reparaciones automáticas ni sincronización entre ventanas.

### Guardado y actualización [RF-3, RF-8, RF-9, RF-10]
- Conservar el orden actual: validar, intentar persistir y, solo tras éxito, cambiar sesiones en memoria, limpiar formulario, actualizar vistas y anunciar éxito.
- Un guardado fallido no reconstruye el mapa ni modifica la consulta activa.
- Tras guardar, reconstruir el modelo con una única referencia local de hoy para toda la actualización; si cambia un día consultado, actualizar sus textos sin robar el foco.
- Ampliar el temporizador existente, sin añadir otro independiente, para revisar las vistas cada 30 segundos mientras la página esté visible. Este margen reduce el riesgo de superar el límite de 60 segundos; comprobarlo en navegador activo.
- En `visibilitychange`, al volver, actualizar antes de admitir eventos de consulta. Verificar de nuevo fecha local y zona horaria al entrar en un manejador de consulta, como protección adicional.
- Detectar tanto cambio de fecha como de zona horaria; contemplar retroceso del reloj. Si el día consultado sale del periodo, cerrar y enfocar el título solo si el foco estaba dentro del día o de su consulta.

## 5. Representación e interacción

### Estructura y estilos [RF-1, RF-2, RF-4 a RF-6, RF-9, RF-10]
- Insertar la sección después de `.resumen` y antes de `.contenido`, conservando las demás secciones e identificadores existentes.
- Representar los días con botones nativos, creados en orden cronológico y colocados por filas de siete días mediante CSS Grid; 12 filas desde la semana más antigua hasta la actual. No usar el rol de cuadrícula interactiva, que exigiría otro patrón de navegación.
- Mostrar lunes a domingo como cabecera de las siete columnas y el intervalo completo con fechas españolas. Cabecera y fechas comparten desplazamiento para mantener su alineación. Hoy tiene contorno y texto accesible, no solo un color distinto.
- Aplicar clases de nivel 0 a 4; futuro tiene un patrón o borde distintivo y texto «Día futuro», no nivel cero. Leyenda textual con los cinco intervalos.
- Encapsular las reglas en clases del mapa: los estilos globales actuales de `button` impondrían ancho completo, fondo y márgenes a cada día y a Cerrar. Sobrescribirlos explícitamente con selectores acotados.
- Mantener celdas pulsables de al menos 44 × 44 píxeles CSS. A 375 px las siete columnas caben sin desplazamiento horizontal; al ampliar texto o en pantallas más estrechas, permitir desplazamiento solo dentro del mapa. No reducir el tamaño pulsable.
- Colocar la consulta fuera del contenedor desplazable, en flujo normal debajo de la cuadrícula. Permitir ajuste de línea incluso para números muy largos; no usar alturas fijas ni cortar contenido. Así también se consultan las cuatro esquinas sin desbordamiento de la página.
- En error, conservar título y sustituir cuadrícula, leyenda, mensaje vacío y consulta por un único aviso específico. Ante vacío válido, mantener cuadrícula y consultas, con el mensaje de ausencia de estudio.

### Consulta y foco [RF-6, RF-7, RF-8]
- Cada botón anuncia fecha completa, hoy si corresponde y total e intervalo o estado futuro. La información visible y accesible procede de la misma descripción.
- No depender del atributo `title`. Usar un panel de consulta no modal con botón Cerrar; no asignarle rol de tooltip porque contiene un control interactivo.
- Enfocar un día abre la consulta sin trasladar automáticamente el foco. Enter o Espacio permite acceder a Cerrar; también es accesible por tabulación. Escape cierra desde el día o el panel.
- El orden entre botones de fechas sigue la cronología; al enfocarse una fecha fuera del área visible, desplazar únicamente el contenedor lo necesario para mostrarla.
- Registrar por separado día bajo cursor, foco en día/panel y selección por toque. Un nuevo día sustituye al anterior. Salir con cursor o foco solo cierra cuando no persiste ninguna causa de apertura aplicable.
- En dispositivos de toque, ignorar el hover sintetizado y mantener selección hasta otro día, toque fuera o Cerrar. El enfoque automático causado por toque no anula el cierre por toque exterior.
- Tratar día y panel como una zona conjunta al mover cursor o foco entre ambos. Comprobar el destino del movimiento antes de cerrar; no cerrar al intentar llegar a Cerrar.
- Un cierre explícito cancela las causas de apertura anteriores. Si el foco estaba en Cerrar, devolverlo al día sin reabrir; si estaba en el día, conservarlo. Reabrir solo con nueva entrada de cursor/foco, activación de teclado o toque.
- La función de estado decide; los manejadores aplican texto, visibilidad y foco. No guardar selección ni estado de consulta entre recargas.

## 6. Decisiones y alternativas descartadas

| Decisión y motivo | Alternativa descartada y motivo | Cobertura |
| --- | --- | --- |
| Tres archivos de aplicación, con bloques funcionales claros en `app.js`. | Extraer un módulo de navegador: añade archivo y cambia el contrato didáctico y de ejecución actual. | RF-1 a RF-10; constitución 1 y 3 |
| Inicialización del navegador en una función separada; ejecutar solo cuando exista `document`. Exponer funciones a Node mediante exportación CommonJS protegida por comprobación de entorno. No se ejecuta en el navegador. | Copiar lógica a los tests o extraerla analizando fragmentos de texto: probaría duplicados o dependería de la posición del código. Importar módulos ES en la página rompe las restricciones. | RF-1 a RF-10; constitución 1, 3 y 4 |
| Aritmética decimal exacta aislada en auxiliares pequeñas, con `BigInt` para coeficientes; explicar coeficiente/escala con ejemplos. Interpretar la representación decimal canónica del número que ya está guardado, no recuperar dígitos perdidos antes del guardado. | Suma binaria directa, tolerancias o redondeo a dos decimales: pueden desplazar umbrales o perder minutos válidos; librería decimal: prohibida. | RF-3, RF-4, RF-7, RF-10 |
| Mantener `BigInt` y totales exactos solo en memoria; mostrar cadenas decimales completas y comprobar finitud sin usarlas para clasificar. | Cambiar el formato de sesiones o persistir `BigInt`: innecesario e incompatible con los datos existentes. | RF-3, RF-4, RF-7, RF-10; constitución 5 |
| Reconstruir un modelo de 84 días y actualizar nodos existentes por fecha, preservando foco y consulta. | Borrar y recrear todos los botones cada 30 segundos: pierde foco; actualizaciones incrementales complejas de totales: mayor dificultad didáctica. | RF-2, RF-3, RF-8, RF-9 |
| Botones nativos y consulta en flujo normal, con desplazamiento interno móvil. | Canvas, librería de gráficos o ventana flotante posicionada: más complejidad, peor acceso textual o recortes en bordes. | RF-2, RF-4 a RF-7 |
| Distinguir lectura fallida de cero sesiones y bloquear escritura solo por lectura/interpretación inválida. | Sustituir silenciosamente por array vacío o bloquear por error exclusivo de total: incumple protección o restringe registro sin necesidad. | RF-9, RF-10 |
| Fechas locales a mediodía y recorrido con `setDate`, reutilizando auxiliares. | Fechas UTC y semanas calculadas con milisegundos fijos: errores de día y horario estacional. | RF-1 a RF-3, RF-6, RF-8 |

## 7. Estrategia de tests con Node

Ejecutar `node --test` desde la raíz. Usar únicamente `node:test`, `node:assert/strict` y, para aislar integración, `node:vm` y utilidades incluidas en Node. No instalar nada ni añadir un servidor. Los tests se crearán durante la implementación, no en esta tarea.

### Carga de código y aislamiento
- Importar `app.js` desde las pruebas puras mediante la exportación CommonJS protegida. Mover todas las consultas al DOM, lecturas y temporizadores actuales dentro de la inicialización; importar no debe producir efectos secundarios.
- Para integración, ejecutar el script completo en un contexto nuevo con `node:vm`, un DOM mínimo, almacenamiento falso, reloj controlado y temporizadores capturados. Probar las rutas reales de lectura, envío y actualización, sin duplicar su lógica en los tests.
- Los sustitutos solo implementan operaciones utilizadas. No convertirlos en una librería DOM propia: las limitaciones de foco, puntero, lector de pantalla y diseño se verifican en Chrome.
- No tocar el almacenamiento del navegador real; cada prueba recibe su propia lista, fecha y estado. Comprobar que las funciones no modifican fechas ni arrays recibidos.
- Ejecutar también `node --check app.js` para sintaxis; no confundirlo con prueba funcional.

### Matriz automatizada

| Grupo | Casos y resultado esperado | Cobertura |
| --- | --- | --- |
| Periodo | Hoy lunes, domingo y día intermedio; primer lunes correcto, último domingo correcto, 84 fechas distintas y cronológicas, índices de fila/columna. | RF-1, RF-2 |
| Calendario | Año bisiesto, cambio de mes/año y cambios de horario en zonas con y sin horario estacional; fechas construidas localmente con hoy explícito. Ejecutar procesos aislados con distintas zonas horarias, sin cambiar la zona del equipo. | RF-1 a RF-3, RF-6, RF-8 |
| Agregación | Duplicados, temas distintos, datos desordenados, extremos incluidos y fechas exteriores excluidas; no modificar entradas. | RF-3 |
| Decimales | 29,9 + 0,1; 59,9 + 0,1; 119,9 + 0,1, con permutaciones; valores muy pequeños y exponenciales; coma y cifras completas, sin redondeo. | RF-3, RF-4, RF-7 |
| Niveles y leyenda | 0; 0,5; 29,5; 30; 59,5; 60; 119,5; 120 y superiores; textos compartidos; mismo nivel aunque cambie el máximo del periodo. | RF-4, RF-5 |
| Futuro y vacío | Sin sesiones, solo anteriores, solo futuras; futuro sin total ni nivel; hoy sin sesiones; vacío a activo y vuelta a vacío al avanzar periodo. | RF-6, RF-9 |
| Consulta | Eventos de cursor, foco y toque, cambio de día, salida parcial, Escape, Cerrar y supresión de reapertura; fecha futura y descripciones. Verificar decisiones puras, no geometría. | RF-6, RF-7 |
| Actualización | Guardar retroactivamente; reloj adelante/atrás; futuro que pasa a hoy; lunes que expulsa fecha seleccionada; actualización de consulta; regreso de suspensión antes de consultar. | RF-8, RF-9 |
| Lectura inválida | Acceso que lanza error, texto vacío o ilegible, valor que no es array, registro inválido dentro o fuera del periodo. Aviso correcto, cero escrituras, guardado bloqueado y ninguna vista parcial del mapa. | RF-10 |
| Totales extremos | Total grande finito mostrado completo; suma no finita declara error solo del mapa y permite seguir guardando con datos válidos. | RF-3, RF-7, RF-10 |
| Persistencia | Escritura fallida no cambia sesiones, formulario, mapa ni consulta y no anuncia éxito. Escritura correcta precede a la actualización. Reapertura válida recupera vista y desbloquea registro. | RF-8, RF-10 |
| Regresión | Racha hoy/ayer, huecos, duplicados, futuras, mejor racha retroactiva, minutos semanales y días mensuales; conservar orden del historial y contrato de datos. | RF-8, RF-10; no regresión |

### Verificación obligatoria en Chrome DevTools
- Abrir `index.html` por `file://` en contexto aislado; comprobar ubicación, periodo, referencias, cinco niveles, hoy, futuro, leyenda, vacío y errores. [RF-1 a RF-6, RF-9, RF-10]
- Probar las 84 fechas con teclado en orden, lector de pantalla, foco y cierre; cursor entre día/panel, dispositivos de toque y sus eventos sintetizados, cuatro esquinas y números largos. [RF-6, RF-7]
- Capturar a 375 px y revisar además texto al 200 %: desplazamiento interno, ausencia de desbordamiento de página, acceso a todos los días y Cerrar; medir contraste de texto 4,5:1 y foco 3:1. [RF-2, RF-4 a RF-7]
- Probar guardado y fallo de guardado con consulta abierta; recarga y persistencia, actualización de fecha local y suspensión/retorno, sin esperar a medianoche para los escenarios controlados. Medir también la cadencia real de actualización en página visible. [RF-8 a RF-10]
- Simular acceso denegado, datos inválidos y total no finito solo en el contexto aislado; verificar diferencias de bloqueo, aviso y conservación literal de los datos originales. [RF-10]
- Revisar consola y funcionamiento sin conexión; no realizar solicitudes externas. Documentar resultado por RF, capturas y límites de la prueba de lectura asistida. No considerar un árbol de accesibilidad por sí solo equivalente a una prueba con lector de pantalla. [RF-1 a RF-10]

## 8. Orden de implementación y finalización
1. Incorporar inicialización aislable y tests de regresión, sin cambiar reglas existentes. [RF-8, RF-10]
2. Implementar y probar validación, decimales, periodo y modelo puro. [RF-1 a RF-6, RF-9, RF-10]
3. Integrar lectura segura y transacción de guardado. [RF-8 a RF-10]
4. Añadir representación, consulta accesible y actualización preservando foco. [RF-1, RF-2, RF-4 a RF-9]
5. Ejecutar toda la matriz automatizada y manual, registrar evidencias por RF y actualizar memoria. [RF-1 a RF-10]

El plan no modifica el alcance funcional. Solo se dará por terminada la implementación cuando se cumplan los criterios de finalización de la especificación; tener tests de Node correctos no sustituye la comprobación en navegador.
