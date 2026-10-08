---
name: local-dates
description: Usala siempre que escribas, modifiques o revises codigo que trabaje con
fechas, dias, semanas o rachas en el Diario de Estudio.
---
# Fechas locales en el Diario de Estudio
Las fechas son la mayor fuente de bugs de este proyecto. Sigue esta guia siempre que
toques codigo con fechas.
## Reglas
- Las fechas se guardan como texto "AAAA-MM-DD" en la zona horaria local del usuario.
- Para obtener el dia de hoy, construye el texto con getFullYear(), getMonth() + 1 y
getDate(), rellenando con ceros.
- Para convertir "AAAA-MM-DD" en fecha, usa new Date(ano, mes - 1, dia). Nunca new
Date("AAAA-MM-DD"): se interpreta en UTC.
- Nunca uses toISOString() para obtener el dia: devuelve la fecha en UTC.
- Para sumar o restar dias, usa setDate(getDate() ± n), nunca milisegundos (24 h no
siempre es un dia por los cambios de hora).
- Reutiliza las funciones de fechas que ya existan en app.js antes de crear otras nuevas.
## Checklist de revision
- [ ] ¿Algun toISOString() o new Date("AAAA-MM-DD")?
- [ ] ¿Algun calculo con 86400000 milisegundos?
- [ ] ¿Que pasa con una sesion registrada a las 00:30?
- [ ] ¿Que pasa el dia del cambio de hora (ultimo domingo de marzo y de octubre)?
- [ ] ¿Se ignoran las fechas futuras donde corresponde?
## Al terminar
Indica que puntos del checklist has comprobado y como. 