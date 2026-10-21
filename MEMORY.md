# MEMORY.md — Diario de Estudio
Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no
aporte.

## Estado actual
- Registro de sesiones (fecha, tema, minutos), racha actual, mejor racha histórica y lista
de sesiones. Ambas rachas se actualizan al guardar y al cambiar de día con la página abierta.
- Total de minutos estudiados esta semana (lunes a hoy), en tarjeta propia.
- Días estudiados este mes (día 1 a hoy), junto a las rachas. Solo se muestran días, no minutos.
- Diseño de cuaderno: papel rosado, tinta ciruela y racha destacada con línea de margen.
- Resumen arriba; formulario e historial en dos columnas, una en móvil (hasta 760 px).
- Fuentes locales: Trebuchet MS en títulos y cifras, Segoe UI en textos; sin descargas.
- Datos en localStorage.
- Mapa de 12 semanas implementado: cinco niveles fijos y consulta por ratón, teclado y toque.
- Orientación aprobada: siete columnas de lunes a domingo y 12 filas semanales, antigua arriba.
- Futuro diferenciado; fechas locales, sumas decimales exactas y actualización cada 30 s.

## Decisiones (y por qué)
- Sin backend ni dependencias: cualquiera debe poder abrirlo con doble clic.
- Fecha editable en el formulario: permite registrar días pasados y ver la racha crecer.
- El récord se deriva de las sesiones para reflejar registros retroactivos, sin duplicar datos.
- Las fechas futuras quedan fuera de ambas rachas hasta que llegue su día local.
- La semana empieza en lunes; el total se muestra como `X min` o `X h Y min`.
- Mejor racha y días del mes comparten fila; minutos debajo. A 360 px se apilan.
- Sin emojis ni títulos en mayúsculas: jerarquía por tamaño, espacio y contraste.
- Tres archivos de aplicación; lógica exportada a Node con CommonJS protegido, sin módulos ES.
- Totales exactos con BigInt solo en memoria; nunca se guardan ni se cambia el contrato de sesiones.
- Lectura inválida bloquea guardado para evitar sobrescrituras; error solo de total no lo bloquea.

## Aprendizajes y errores a evitar
- La clave real es `diario-de-estudio-sesiones` y los campos son `fecha`, `tema`, `minutos`;
se corrigió la documentación para coincidir con el código, sin migrar los datos.

## Próximos pasos
- Spec, plan y checklist en specs/001-heat-map/; T01–T36 completadas.
- T37 pendiente de lector de pantalla real: árbol accesible y teclado no sustituyen escucharlo.
- T38–T40 tienen evidencias técnicas recogidas, pero no se cierran por dependencia de T37;
  T41 pendiente de cierre formal. Funcionalidad implementada, QA aún no totalmente cerrado.
- Cambio de orientación con tests primero: node --test pasa 31/31; sintaxis correcta.
- Dos archivos de tests .cjs, sin dependencias; incluyen calendario en tres zonas y regresiones.
- Chrome aislado: 84 fechas en orden por Tab, datos persistentes, errores protegidos,
  sin conexión, consola limpia, móvil 375 px y texto 200 % sin desbordamiento de página.
- Nueva orientación comprobada en Chrome a 375/1200 px; siete días caben a 375 px.
- Cabecera y fechas comparten desplazamiento al ampliar texto; sesiones y consultas intactas.
- Temporizador real de 30 s verificado: actualización en 20,749 s tras cambiar el día simulado.
- Capturas y matriz por RF registradas al final de tasks.md; datos reales intactos.
- Error a evitar: retirar un botón enfocado dispara focusout; resolver el foco antes de retirarlo.
- Proponer corregir en AGENTS.md la frase «No hay tests automáticos»: ahora sí hay pruebas Node.
