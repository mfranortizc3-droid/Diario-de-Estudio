# Constitución del Diario de Estudio
1. Stack simple: solo HTML, CSS y JavaScript puros; ejecución por file://, sin dependencias ni build.
2. Spec y código coherentes: cada cambio responde a una especificación aprobada con criterios verificables; cualquier discrepancia se consulta antes de implementar.
3. Responsabilidades separadas: HTML estructura, CSS presenta y JavaScript gestiona datos; los cálculos no acceden al DOM ni a localStorage.
4. Tests sin instalaciones: verificar cada cambio funcional con Chrome DevTools, consola y vista móvil; probar cálculos con fechas locales controladas y casos límite.
5. Datos protegidos: conservar clave y sesiones existentes; cambios de formato requieren aprobación y compatibilidad; guardar antes de anunciar éxito y probar en almacenamiento aislado.
6. Español y claridad: textos, nombres propios del código y comentarios en español, descriptivos y comprensibles para principiantes; se exceptúan las API del navegador.
