# MEMORY.md — Diario de Estudio
Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no
aporte.
## Estado actual
- v1 funcionando: registrar sesiones (fecha, tema, minutos), racha actual, mejor racha,
  total semanal y lista de sesiones.
- Datos en localStorage.
## Decisiones (y por qué)
- Sin backend ni dependencias: cualquiera debe poder abrirlo con doble clic.
- Fecha editable en el formulario: permite registrar días pasados y ver la racha crecer.
- El total semanal suma minutos de lunes a domingo en fecha local, incluidas sesiones
  futuras de esa semana.
- La interfaz usa una paleta rosada con texto oscuro para mantener el contraste.
- La mejor racha se calcula con días locales consecutivos únicos y excluye fechas futuras.
## Aprendizajes y errores a evitar
- (vacío por ahora)
## Próximos pasos
- (vacío por ahora) 
