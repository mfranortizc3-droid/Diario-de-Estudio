const CLAVE_SESIONES = "diario-de-estudio-sesiones";

// Construimos la fecha con valores locales, sin convertirla a UTC.
function fechaLocal(fecha = new Date()) {
  const anio = String(fecha.getFullYear()).padStart(4, "0");
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

function convertirFecha(texto) {
  const [anio, mes, dia] = texto.split("-").map(Number);
  const fecha = new Date(2000, 0, 1, 12);
  fecha.setFullYear(anio, mes - 1, dia);
  return fecha;
}

function sesionValida(sesion) {
  return sesion && typeof sesion.fecha === "string"
    && /^\d{4}-\d{2}-\d{2}$/.test(sesion.fecha)
    && fechaLocal(convertirFecha(sesion.fecha)) === sesion.fecha
    && typeof sesion.tema === "string" && sesion.tema.trim().length > 0
    && Number.isFinite(sesion.minutos) && sesion.minutos > 0;
}

function calcularRacha(sesiones, hoy = new Date()) {
  const diasConSesion = new Set(sesiones.map(sesion => sesion.fecha));
  const dia = new Date(hoy);
  dia.setHours(12, 0, 0, 0);

  // Si hoy no hay sesión, empezamos por ayer: la racha sigue viva.
  if (!diasConSesion.has(fechaLocal(dia))) {
    dia.setDate(dia.getDate() - 1);
  }

  let racha = 0;
  while (diasConSesion.has(fechaLocal(dia))) {
    racha += 1;
    // Restar días del calendario también funciona al cambiar la hora.
    dia.setDate(dia.getDate() - 1);
  }
  return racha;
}

function calcularMejorRacha(sesiones, hoy = new Date()) {
  const fechaHoy = fechaLocal(hoy);
  const fechas = [...new Set(sesiones.map(sesion => sesion.fecha))]
    .filter(fecha => fecha <= fechaHoy)
    .sort();
  let mejorRacha = 0;
  let racha = 0;
  let siguienteFecha = "";

  for (const fecha of fechas) {
    racha = fecha === siguienteFecha ? racha + 1 : 1;
    mejorRacha = Math.max(mejorRacha, racha);

    // Avanzamos un día local, incluso al cambiar de mes, año u horario.
    const siguienteDia = convertirFecha(fecha);
    siguienteDia.setDate(siguienteDia.getDate() + 1);
    siguienteFecha = fechaLocal(siguienteDia);
  }
  return mejorRacha;
}

function calcularMinutosSemana(sesiones, hoy = new Date()) {
  const dia = new Date(hoy);
  dia.setHours(12, 0, 0, 0);
  // getDay(): 0=domingo, 1=lunes, ..., 6=sábado. Restamos hasta el lunes.
  const diasDesdeLunes = (dia.getDay() + 6) % 7;
  dia.setDate(dia.getDate() - diasDesdeLunes);
  const inicioSemana = fechaLocal(dia);
  const fechaHoy = fechaLocal(hoy);

  return sesiones
    .filter(sesion => sesion.fecha >= inicioSemana && sesion.fecha <= fechaHoy)
    .reduce((total, sesion) => total + sesion.minutos, 0);
}

function calcularDiasMes(sesiones, hoy = new Date()) {
  const fechaHoy = fechaLocal(hoy);
  const prefijoMes = fechaHoy.slice(0, 7);

  return new Set(
    sesiones
      .map(sesion => sesion.fecha)
      .filter(fecha => fecha.startsWith(prefijoMes) && fecha <= fechaHoy)
  ).size;
}

function formatearMinutos(total) {
  if (total < 60) return `${total} min`;
  const horas = Math.floor(total / 60);
  const minutos = total % 60;
  return minutos === 0 ? `${horas} h` : `${horas} h ${minutos} min`;
}

const NIVELES_MAPA = [
  "Sin estudio", "Más de 0 a menos de 30 minutos", "30 a menos de 60 minutos",
  "60 a menos de 120 minutos", "120 minutos o más"
];

function obtenerPeriodoMapa(hoy) {
  const lunes = new Date(hoy);
  lunes.setHours(12, 0, 0, 0);
  lunes.setDate(lunes.getDate() - (lunes.getDay() + 6) % 7);
  const domingo = new Date(lunes);
  domingo.setDate(domingo.getDate() + 6);
  lunes.setDate(lunes.getDate() - 77);
  return { inicio: fechaLocal(lunes), fin: fechaLocal(domingo) };
}

function validarSesionesMapa(sesiones) {
  return Array.isArray(sesiones) && sesiones.every(sesionValida);
}

// Ejemplo: 29,9 se representa con coeficiente 299 y escala 1 (299 / 10).
// Los enteros grandes evitan que 29,9 + 0,1 quede por debajo del umbral 30.
function descomponerMinutos(minutos) {
  const [mantisa, exponente = "0"] = String(minutos).toLowerCase().split("e");
  const [entero, fraccion = ""] = mantisa.split(".");
  let coeficiente = BigInt(entero + fraccion);
  let escala = fraccion.length - Number(exponente);
  if (escala < 0) {
    coeficiente *= 10n ** BigInt(-escala);
    escala = 0;
  }
  return { coeficiente, escala };
}

function textoDecimal(total) {
  const cifras = String(total.coeficiente).padStart(total.escala + 1, "0");
  if (total.escala === 0) return cifras;
  return `${cifras.slice(0, -total.escala)}.${cifras.slice(-total.escala)}`;
}

function sumarMinutosExactos(valores) {
  const partes = valores.map(descomponerMinutos);
  let escala = partes.reduce((maximo, parte) => Math.max(maximo, parte.escala), 0);
  let coeficiente = partes.reduce((suma, parte) =>
    suma + parte.coeficiente * 10n ** BigInt(escala - parte.escala), 0n);
  while (escala > 0 && coeficiente % 10n === 0n) {
    coeficiente /= 10n;
    escala -= 1;
  }
  const total = { coeficiente, escala };
  if (!Number.isFinite(Number(textoDecimal(total)))) return { error: "total" };
  return { total };
}

function obtenerNivelMapa(total) {
  if (total.coeficiente === 0n) return 0;
  const unidad = 10n ** BigInt(total.escala);
  if (total.coeficiente < 30n * unidad) return 1;
  if (total.coeficiente < 60n * unidad) return 2;
  if (total.coeficiente < 120n * unidad) return 3;
  return 4;
}

function formatearMinutosMapa(total) {
  return `${textoDecimal(total).replace(".", ",")} minutos`;
}

function agruparMinutosPorFecha(sesiones, hoy) {
  if (!validarSesionesMapa(sesiones)) return { error: "interpretacion" };
  const { inicio } = obtenerPeriodoMapa(hoy);
  const fechaHoy = fechaLocal(hoy);
  const grupos = new Map();
  for (const sesion of sesiones) {
    if (sesion.fecha < inicio || sesion.fecha > fechaHoy) continue;
    if (!grupos.has(sesion.fecha)) grupos.set(sesion.fecha, []);
    grupos.get(sesion.fecha).push(sesion.minutos);
  }
  const totales = new Map();
  for (const [fecha, valores] of grupos) {
    const resultado = sumarMinutosExactos(valores);
    if (resultado.error) return resultado;
    totales.set(fecha, resultado.total);
  }
  return { totales };
}

function construirMapa(sesiones, hoy) {
  const resultado = agruparMinutosPorFecha(sesiones, hoy);
  if (resultado.error) return resultado;
  const periodo = obtenerPeriodoMapa(hoy);
  const dia = convertirFecha(periodo.inicio);
  const fechaHoy = fechaLocal(hoy);
  const dias = [];
  for (let indice = 0; indice < 84; indice += 1) {
    const fecha = fechaLocal(dia);
    const datos = { fecha, semana: Math.floor(indice / 7), columna: indice % 7,
      esHoy: fecha === fechaHoy, futuro: fecha > fechaHoy };
    if (!datos.futuro) {
      datos.total = resultado.totales.get(fecha) || { coeficiente: 0n, escala: 0 };
      datos.nivel = obtenerNivelMapa(datos.total);
    }
    dias.push(datos);
    dia.setDate(dia.getDate() + 1);
  }
  return { ...periodo, dias, vacio: resultado.totales.size === 0 };
}

function fechaCompleta(texto) {
  return convertirFecha(texto).toLocaleDateString("es", {
    day: "numeric", month: "long", year: "numeric"
  });
}

function obtenerConsultaDia(dia) {
  const fecha = `${fechaCompleta(dia.fecha)}${dia.esHoy ? ". Hoy" : ""}`;
  if (dia.futuro) return `${fecha}. Día futuro`;
  return `${fecha}. ${formatearMinutosMapa(dia.total)}. ${NIVELES_MAPA[dia.nivel]}`;
}

function resolverEstadoConsulta(estado, evento, fechasVisibles) {
  const siguiente = { fecha: null, cursor: false, foco: false, toque: false,
    ...estado, destinoFoco: null };
  if (evento.tipo === "abrir" && fechasVisibles.includes(evento.fecha)) {
    if (siguiente.fecha !== evento.fecha) {
      siguiente.cursor = false;
      siguiente.foco = false;
      siguiente.toque = false;
    }
    siguiente.fecha = evento.fecha;
    siguiente[evento.fuente] = true;
  }
  if (evento.tipo === "salir") {
    siguiente[evento.fuente] = false;
    if (!siguiente.cursor && !siguiente.foco && !siguiente.toque) siguiente.fecha = null;
  }
  const expulsado = siguiente.fecha && !fechasVisibles.includes(siguiente.fecha);
  if (evento.tipo === "cerrar" || expulsado) {
    siguiente.destinoFoco = expulsado ? (evento.focoDentro ? "titulo" : null)
      : (evento.devolverFoco ? siguiente.fecha : null);
    siguiente.fecha = null;
    siguiente.cursor = false;
    siguiente.foco = false;
    siguiente.toque = false;
  }
  return siguiente;
}

function iniciarAplicacion() {
  const formulario = document.querySelector("#formulario");
  const campoFecha = document.querySelector("#fecha");
  const campoTema = document.querySelector("#tema");
  const campoMinutos = document.querySelector("#minutos");
  const lista = document.querySelector("#sesiones");
  const mensaje = document.querySelector("#mensaje");
  const botonGuardar = document.querySelector("#guardar-sesion");
  const tituloMapa = document.querySelector("#titulo-mapa");
  const contenidoMapa = document.querySelector("#mapa-contenido");
  const errorMapa = document.querySelector("#mapa-error");
  const diasMapa = document.querySelector("#mapa-dias");
  const consultaMapa = document.querySelector("#mapa-consulta");
  const textoConsulta = document.querySelector("#mapa-consulta-texto");
  const cerrarConsulta = document.querySelector("#mapa-cerrar");
  const desplazamientoMapa = document.querySelector("#mapa-desplazamiento");
  const botonesMapa = new Map();
  let modeloMapa = { dias: [] };
  let estadoConsulta = {};
  let restaurandoFoco = false;
  let cierreCursor;
  let ultimaFecha = "";
  let ultimaZona = "";

  function avisoError(tipo) {
    if (tipo === "acceso") return "No se puede mostrar el mapa porque falla el acceso a tus sesiones. Revisa el acceso a los datos guardados y vuelve a abrir el diario.";
    if (tipo === "interpretacion") return "No se puede mostrar el mapa porque no se pueden interpretar tus sesiones. Revisa los datos guardados y vuelve a abrir el diario. No se ha eliminado ningún registro.";
    return "No se puede mostrar el mapa porque un total de minutos es demasiado grande. Revisa los minutos guardados y vuelve a abrir el diario. Tus sesiones se conservan y puedes seguir registrando sesiones.";
  }

  function pintarConsulta() {
    const dia = modeloMapa.dias?.find(dia => dia.fecha === estadoConsulta.fecha);
    consultaMapa.hidden = !dia;
    if (dia) textoConsulta.textContent = obtenerConsultaDia(dia);
    for (const [fecha, boton] of botonesMapa) {
      boton.setAttribute("aria-expanded", String(fecha === estadoConsulta.fecha));
    }
  }

  function cambiarConsulta(evento) {
    estadoConsulta = resolverEstadoConsulta(estadoConsulta, evento,
      (modeloMapa.dias || []).map(dia => dia.fecha));
    // El foco restaurado por Cerrar no es una nueva petición de apertura.
    const destino = estadoConsulta.destinoFoco;
    if (destino) {
      restaurandoFoco = true;
      (destino === "titulo" ? tituloMapa : botonesMapa.get(destino))?.focus({ preventScroll: true });
      restaurandoFoco = false;
    }
    pintarConsulta();
  }

  function mostrarMapa(hoy) {
    const focoDentro = consultaMapa.contains(document.activeElement)
      || diasMapa.contains(document.activeElement);
    modeloMapa = carga.error ? { error: carga.error } : construirMapa(sesiones, hoy);
    contenidoMapa.hidden = Boolean(modeloMapa.error);
    errorMapa.hidden = !modeloMapa.error;
    if (modeloMapa.error) {
      errorMapa.textContent = avisoError(modeloMapa.error);
      cambiarConsulta({ tipo: "actualizar", focoDentro });
      diasMapa.replaceChildren();
      botonesMapa.clear();
      return;
    }
    document.querySelector("#mapa-periodo").textContent =
      `Del ${fechaCompleta(modeloMapa.inicio)} al ${fechaCompleta(modeloMapa.fin)}`;
    // Resolver el foco antes de retirar un botón: retirarlo dispara focusout.
    cambiarConsulta({ tipo: "actualizar", focoDentro });
    const fechas = new Set(modeloMapa.dias.map(dia => dia.fecha));
    for (const [fecha, boton] of botonesMapa) {
      if (!fechas.has(fecha)) {
        boton.remove();
        botonesMapa.delete(fecha);
      }
    }
    modeloMapa.dias.forEach((dia, indice) => {
      let boton = botonesMapa.get(dia.fecha);
      if (!boton) {
        boton = document.createElement("button");
        boton.type = "button";
        boton.dataset.fecha = dia.fecha;
        boton.setAttribute("aria-controls", "mapa-consulta");
        botonesMapa.set(dia.fecha, boton);
      }
      boton.className = `mapa-dia ${dia.futuro ? "mapa-futuro" : `nivel-${dia.nivel}`}${dia.esHoy ? " mapa-hoy" : ""}`;
      boton.textContent = String(convertirFecha(dia.fecha).getDate());
      boton.setAttribute("aria-label", obtenerConsultaDia(dia));
      if (dia.esHoy) boton.setAttribute("aria-current", "date");
      else boton.removeAttribute("aria-current");
      // No mover los nodos que ya están en su lugar: preserva el foco.
      const actual = diasMapa.children[indice];
      if (actual !== boton) {
        if (actual) diasMapa.insertBefore(boton, actual);
        else diasMapa.append(boton);
      }
    });
    document.querySelector("#mapa-vacio").hidden = !modeloMapa.vacio;
    pintarConsulta();
  }

  function actualizarVistas() {
    const hoy = new Date();
    ultimaFecha = fechaLocal(hoy);
    ultimaZona = `${hoy.getTimezoneOffset()}:${Intl.DateTimeFormat().resolvedOptions().timeZone}`;
    mostrarRachas(hoy);
    mostrarMapa(hoy);
  }

  function comprobarCalendario() {
    const hoy = new Date();
    const zona = `${hoy.getTimezoneOffset()}:${Intl.DateTimeFormat().resolvedOptions().timeZone}`;
    if (fechaLocal(hoy) !== ultimaFecha || zona !== ultimaZona) actualizarVistas();
  }

  function botonDia(elemento) {
    return elemento?.closest?.(".mapa-dia") || null;
  }

  function dentroConsulta(elemento) {
    return consultaMapa.contains(elemento)
      || botonDia(elemento)?.dataset.fecha === estadoConsulta.fecha;
  }

  function abrirDia(boton, fuente) {
    clearTimeout(cierreCursor);
    comprobarCalendario();
    cambiarConsulta({ tipo: "abrir", fuente, fecha: boton.dataset.fecha });
  }

  function mostrarDiaEnPantalla(boton) {
    const limites = desplazamientoMapa.getBoundingClientRect();
    const celda = boton.getBoundingClientRect();
    if (celda.left < limites.left) desplazamientoMapa.scrollLeft += celda.left - limites.left - 4;
    if (celda.right > limites.right) desplazamientoMapa.scrollLeft += celda.right - limites.right + 4;
  }

  function mostrarMensaje(texto) {
    mensaje.textContent = texto;
    mensaje.hidden = false;
  }

  function cargarSesiones() {
    let texto;
    try {
      texto = localStorage.getItem(CLAVE_SESIONES);
    } catch {
      return { error: "acceso" };
    }
    try {
      const guardadas = texto === null ? [] : JSON.parse(texto);
      if (!validarSesionesMapa(guardadas)) return { error: "interpretacion" };
      return { sesiones: guardadas };
    } catch {
      return { error: "interpretacion" };
    }
  }

  function mostrarRachas(hoy) {
    const racha = calcularRacha(sesiones, hoy);
    const mejorRacha = calcularMejorRacha(sesiones, hoy);
    const minutosSemana = calcularMinutosSemana(sesiones, hoy);
    const diasMes = calcularDiasMes(sesiones, hoy);
    document.querySelector("#racha").textContent = racha;
    document.querySelector("#racha-unidad").textContent = racha === 1 ? "día seguido" : "días seguidos";
    document.querySelector("#mejor-racha").textContent = mejorRacha;
    document.querySelector("#mejor-racha-unidad").textContent = mejorRacha === 1 ? "día seguido" : "días seguidos";
    document.querySelector("#minutos-semana").textContent = formatearMinutos(minutosSemana);
    document.querySelector("#dias-mes").textContent = diasMes;
    document.querySelector("#dias-mes-unidad").textContent = diasMes === 1 ? "día" : "días";
  }

  function mostrarSesiones() {
    lista.replaceChildren();
    document.querySelector("#sin-sesiones").hidden = sesiones.length > 0;

    // Las nuevas sesiones van primero cuando comparten fecha.
    const ordenadas = [...sesiones].sort((a, b) => b.fecha.localeCompare(a.fecha));
    for (const sesion of ordenadas) {
      const elemento = document.createElement("li");
      elemento.className = "sesion";
      const detalle = document.createElement("div");
      detalle.className = "sesion-detalle";
      const tema = document.createElement("span");
      tema.className = "sesion-tema";
      tema.textContent = sesion.tema;
      const fecha = document.createElement("time");
      fecha.className = "sesion-fecha";
      fecha.dateTime = sesion.fecha;
      fecha.textContent = convertirFecha(sesion.fecha).toLocaleDateString("es", {
        day: "numeric", month: "long", year: "numeric"
      });
      const minutos = document.createElement("span");
      minutos.className = "sesion-minutos";
      minutos.textContent = `${sesion.minutos.toLocaleString("es")} min`;
      detalle.append(tema, fecha);
      elemento.append(detalle, minutos);
      lista.append(elemento);
    }
    actualizarVistas();
  }

  const carga = cargarSesiones();
  let sesiones = carga.sesiones || [];
  botonGuardar.disabled = Boolean(carga.error);
  if (carga.error) mostrarMensaje(`${avisoError(carga.error)} El guardado está bloqueado para proteger tus sesiones.`);

  const leyenda = document.querySelector("#mapa-leyenda");
  NIVELES_MAPA.forEach((texto, nivel) => {
    const elemento = document.createElement("li");
    const muestra = document.createElement("span");
    muestra.className = `mapa-muestra nivel-${nivel}`;
    muestra.setAttribute("aria-hidden", "true");
    const descripcion = document.createElement("span");
    descripcion.textContent = nivel === 0 ? "0 minutos" : texto;
    elemento.append(muestra, descripcion);
    leyenda.append(elemento);
  });
  campoFecha.value = fechaLocal();
  mostrarSesiones();

  campoTema.addEventListener("input", () => campoTema.setCustomValidity(""));
  campoMinutos.addEventListener("input", () => campoMinutos.setCustomValidity(""));

  formulario.addEventListener("submit", evento => {
    evento.preventDefault();
    if (carga.error) {
      mostrarMensaje(`${avisoError(carga.error)} El guardado está bloqueado para proteger tus sesiones.`);
      return;
    }
    const tema = campoTema.value.trim();
    const minutos = Number(campoMinutos.value);
    campoTema.setCustomValidity(tema ? "" : "Escribe el tema de la sesión.");
    campoMinutos.setCustomValidity(Number.isFinite(minutos) && minutos > 0 ? "" : "Los minutos deben ser mayores que 0.");
    if (!formulario.reportValidity()) return;

    const sesion = { fecha: campoFecha.value, tema, minutos };
    if (!sesionValida(sesion)) {
      mostrarMensaje("Introduce una fecha válida.");
      return;
    }
    const nuevasSesiones = [sesion, ...sesiones];
    try {
      localStorage.setItem(CLAVE_SESIONES, JSON.stringify(nuevasSesiones));
    } catch {
      mostrarMensaje("No se ha podido guardar la sesión. Comprueba que el navegador permita guardar datos locales y tenga espacio disponible.");
      return;
    }

    sesiones = nuevasSesiones;
    formulario.reset();
    campoFecha.value = fechaLocal();
    mostrarSesiones();
    mostrarMensaje("Sesión guardada.");
  });

  document.addEventListener("pointerover", evento => {
    if (evento.pointerType !== "mouse" || estadoConsulta.toque) return;
    const boton = botonDia(evento.target);
    if (boton || consultaMapa.contains(evento.target)) clearTimeout(cierreCursor);
    if (boton) abrirDia(boton, "cursor");
    else if (consultaMapa.contains(evento.target) && estadoConsulta.fecha) {
      cambiarConsulta({ tipo: "abrir", fuente: "cursor", fecha: estadoConsulta.fecha });
    }
  });
  document.addEventListener("pointerout", evento => {
    if (evento.pointerType !== "mouse" || estadoConsulta.toque || !dentroConsulta(evento.target)) return;
    if (dentroConsulta(evento.relatedTarget)) return;
    // Breve margen para atravesar el espacio entre la celda y su información.
    clearTimeout(cierreCursor);
    cierreCursor = setTimeout(() => cambiarConsulta({ tipo: "salir", fuente: "cursor" }), 300);
  });
  document.addEventListener("focusin", evento => {
    if (restaurandoFoco) return;
    comprobarCalendario();
    const boton = botonDia(evento.target);
    if (boton) {
      abrirDia(boton, "foco");
      mostrarDiaEnPantalla(boton);
    } else if (consultaMapa.contains(evento.target) && estadoConsulta.fecha) {
      cambiarConsulta({ tipo: "abrir", fuente: "foco", fecha: estadoConsulta.fecha });
    }
  });
  document.addEventListener("focusout", evento => {
    if (restaurandoFoco || !dentroConsulta(evento.target) || dentroConsulta(evento.relatedTarget)) return;
    cambiarConsulta({ tipo: "salir", fuente: "foco" });
  });
  document.addEventListener("pointerdown", evento => {
    if (evento.pointerType === "mouse") {
      const boton = botonDia(evento.target);
      if (estadoConsulta.toque && !consultaMapa.contains(evento.target)) cambiarConsulta({ tipo: "cerrar" });
      if (boton) abrirDia(boton, "cursor");
      return;
    }
    if (evento.pointerType !== "touch") return;
    const boton = botonDia(evento.target);
    if (boton) abrirDia(boton, "toque");
    else if (!consultaMapa.contains(evento.target)) cambiarConsulta({ tipo: "cerrar" });
  });
  document.addEventListener("keydown", evento => {
    const boton = botonDia(evento.target);
    if (evento.key === "Escape" && estadoConsulta.fecha) {
      evento.preventDefault();
      cambiarConsulta({ tipo: "cerrar", devolverFoco: consultaMapa.contains(document.activeElement) });
    } else if (boton && (evento.key === "Enter" || evento.key === " ")) {
      evento.preventDefault();
      abrirDia(boton, "foco");
      cerrarConsulta.focus({ preventScroll: true });
    }
  });
  cerrarConsulta.addEventListener("click", () => {
    clearTimeout(cierreCursor);
    cambiarConsulta({ tipo: "cerrar", devolverFoco: consultaMapa.contains(document.activeElement) });
  });

  // Un único reloj actualiza todas las vistas; al volver se revisa antes de consultar.
  setInterval(() => {
    if (!document.hidden) actualizarVistas();
  }, 30000);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) actualizarVistas();
  });
}

if (typeof document !== "undefined") {
  iniciarAplicacion();
}

// Node puede probar la lógica sin iniciar la interfaz del navegador.
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    fechaLocal,
    convertirFecha,
    sesionValida,
    calcularRacha,
    calcularMejorRacha,
    calcularMinutosSemana,
    calcularDiasMes,
    formatearMinutos,
    obtenerPeriodoMapa,
    validarSesionesMapa,
    descomponerMinutos,
    sumarMinutosExactos,
    obtenerNivelMapa,
    formatearMinutosMapa,
    agruparMinutosPorFecha,
    construirMapa,
    obtenerConsultaDia,
    resolverEstadoConsulta
  };
}
