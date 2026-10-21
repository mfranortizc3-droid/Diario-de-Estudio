const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const { runInNewContext } = require("node:vm");

const clave = "diario-de-estudio-sesiones";
const script = readFileSync(resolve(__dirname, "../app.js"), "utf8");
const html = readFileSync(resolve(__dirname, "../index.html"), "utf8");
const sesion = (fecha, minutos = 25, tema = "Repaso") => ({ fecha, minutos, tema });

// Sustituto intencionalmente pequeño: no comprueba geometría ni accesibilidad real.
function crearEntorno({ texto = null, falloLectura = false, falloEscritura = false } = {}) {
  const elementos = new Map();
  const eventosDocumento = new Map();
  let reloj = new Date(2026, 9, 20, 12).getTime();
  let desplazamientoZona = 0;
  let escrituras = 0;
  const intervalos = [];
  const observacionesGuardado = [];
  const esperas = new Map();
  let siguienteEspera = 0;
  const datos = new Map(texto === null ? [] : [[clave, texto]]);
  let documento;

  class Elemento {
    constructor(etiqueta = "div") {
      this.tagName = etiqueta.toUpperCase();
      this.children = [];
      this.dataset = {};
      this.atributos = {};
      this.eventos = new Map();
      this.textContent = "";
      this.value = "";
      this.hidden = false;
      this.disabled = false;
      this.className = "";
    }
    addEventListener(tipo, manejar) { this.eventos.set(tipo, manejar); }
    emitir(tipo, propiedades = {}) {
      this.eventos.get(tipo)?.({ target: this, preventDefault() {}, ...propiedades });
    }
    setAttribute(nombre, valor) { this.atributos[nombre] = String(valor); }
    getAttribute(nombre) { return this.atributos[nombre] ?? null; }
    removeAttribute(nombre) { delete this.atributos[nombre]; }
    append(...hijos) {
      for (const hijo of hijos) {
        hijo.remove();
        hijo.parentElement = this;
        this.children.push(hijo);
      }
    }
    insertBefore(hijo, referencia) {
      hijo.remove();
      hijo.parentElement = this;
      this.children.splice(this.children.indexOf(referencia), 0, hijo);
    }
    replaceChildren(...hijos) {
      for (const hijo of [...this.children]) hijo.remove();
      this.append(...hijos);
    }
    remove() {
      if (this.parentElement) {
        if (this.contains(documento.activeElement)) {
          const anterior = documento.activeElement;
          documento.activeElement = null;
          eventosDocumento.get("focusout")?.({ target: anterior, relatedTarget: null });
        }
        const hermanos = this.parentElement.children;
        hermanos.splice(hermanos.indexOf(this), 1);
        this.parentElement = null;
      }
    }
    contains(elemento) { return this === elemento || this.children.some(hijo => hijo.contains(elemento)); }
    closest(selector) {
      if (selector === ".mapa-dia" && this.className.split(" ").includes("mapa-dia")) return this;
      return this.parentElement?.closest(selector) || null;
    }
    focus() {
      const anterior = documento.activeElement;
      documento.activeElement = this;
      eventosDocumento.get("focusout")?.({ target: anterior, relatedTarget: this });
      eventosDocumento.get("focusin")?.({ target: this, relatedTarget: anterior });
    }
    scrollIntoView() {}
    getBoundingClientRect() { return { left: 0, right: 44 }; }
    setCustomValidity(texto) { this.validacion = texto; }
    reportValidity() {
      return !["tema", "minutos"].some(id => elementos.get(id).validacion);
    }
    reset() {
      for (const id of ["fecha", "tema", "minutos"]) elementos.get(id).value = "";
    }
  }

  for (const coincidencia of html.matchAll(/id="([^"]+)"/g)) elementos.set(coincidencia[1], new Elemento());
  documento = {
    hidden: false, activeElement: null,
    querySelector(selector) {
      if (selector === '#formulario button[type="submit"]') return elementos.get("guardar-sesion");
      return elementos.get(selector.slice(1)) || null;
    },
    createElement: etiqueta => new Elemento(etiqueta),
    addEventListener: (tipo, manejar) => eventosDocumento.set(tipo, manejar)
  };
  // La jerarquía necesaria para comprobar día/panel y cierres exteriores.
  if (elementos.has("mapa-consulta")) elementos.get("mapa-consulta").append(elementos.get("mapa-consulta-texto"), elementos.get("mapa-cerrar"));
  const contexto = {
    document: documento,
    Date: class extends Date {
      constructor(...argumentos) { super(...(argumentos.length ? argumentos : [reloj])); }
      static now() { return reloj; }
      getTimezoneOffset() { return desplazamientoZona; }
    },
    localStorage: {
      getItem(nombre) { if (falloLectura) throw new Error("Acceso denegado"); return datos.get(nombre) ?? null; },
      setItem(nombre, valor) {
        observacionesGuardado.push({ filas: elementos.get("sesiones").children.length, tema: elementos.get("tema").value });
        if (falloEscritura) throw new Error("Sin espacio");
        escrituras += 1;
        datos.set(nombre, valor);
      }
    },
    setInterval(manejar, demora) { intervalos.push({ manejar, demora }); return intervalos.length; },
    setTimeout(manejar) { esperas.set(++siguienteEspera, manejar); return siguienteEspera; },
    clearTimeout(identificador) { esperas.delete(identificador); }
  };
  runInNewContext(script, contexto);
  const obtener = id => elementos.get(id);
  return {
    obtener, documento, datos, intervalos, observacionesGuardado,
    terminarEsperas() { const pendientes = [...esperas.values()]; esperas.clear(); pendientes.forEach(manejar => manejar()); },
    escrituras: () => escrituras,
    falloEscritura: valor => { falloEscritura = valor; },
    avanzar(fecha, zona = desplazamientoZona) { reloj = fecha.getTime(); desplazamientoZona = zona; },
    emitir: (tipo, propiedades = {}) => eventosDocumento.get(tipo)?.({ preventDefault() {}, ...propiedades }),
    guardar(fecha = "2026-10-20", minutos = 25, tema = "Nuevo") {
      obtener("fecha").value = fecha;
      obtener("tema").value = tema;
      obtener("minutos").value = String(minutos);
      obtener("formulario").emitir("submit");
    },
    dia: fecha => obtener("mapa-dias").children.find(boton => boton.dataset.fecha === fecha)
  };
}

test("T04 y T05: contextos aislados y guardado por el manejador real", () => {
  const primero = crearEntorno();
  const segundo = crearEntorno();
  primero.guardar();
  assert.equal(primero.escrituras(), 1);
  assert.equal(segundo.escrituras(), 0);
  assert.equal(segundo.datos.size, 0);
  assert.equal(primero.obtener("sesiones").children.length, 1);
  assert.deepEqual(primero.observacionesGuardado, [{ filas: 0, tema: "Nuevo" }]);
  assert.equal(primero.obtener("tema").value, "");
});

for (const [nombre, opciones, motivo] of [
  ["acceso", { falloLectura: true }, /acceso/],
  ["texto vacío", { texto: "" }, /interpretar/],
  ["ilegible", { texto: "{" }, /interpretar/],
  ["no array", { texto: "{}" }, /interpretar/],
  ["sesión inválida exterior", { texto: JSON.stringify([sesion("2026-10-20"), sesion("1900-02-29")]) }, /interpretar/]
]) {
  test(`T16 y T17: ${nombre} no equivale a vacío ni permite sobrescribir`, () => {
    const entorno = crearEntorno(opciones);
    entorno.guardar();
    assert.equal(entorno.escrituras(), 0);
    assert.equal(entorno.datos.get(clave), opciones.texto);
    assert.equal(entorno.obtener("guardar-sesion").disabled, true);
    assert.equal(entorno.obtener("mapa-contenido").hidden, true);
    assert.match(entorno.obtener("mapa-error").textContent, motivo);
    assert.match(entorno.obtener("mensaje").textContent, /bloqueado/);
  });
}

test("T18 y T23: lectura correcta vacía, error de total y reapertura válida", () => {
  const vacio = crearEntorno();
  assert.equal(vacio.obtener("mapa-dias").children.length, 84);
  assert.equal(vacio.obtener("mapa-vacio").hidden, false);
  assert.equal(vacio.obtener("guardar-sesion").disabled, false);
  const texto = JSON.stringify([sesion("2026-10-20", Number.MAX_VALUE), sesion("2026-10-20", Number.MAX_VALUE)]);
  const extremo = crearEntorno({ texto });
  assert.match(extremo.obtener("mapa-error").textContent, /total/);
  assert.equal(extremo.obtener("guardar-sesion").disabled, false);
  extremo.guardar();
  assert.equal(extremo.escrituras(), 1);
  const recuperado = crearEntorno({ texto: JSON.stringify([sesion("2026-10-20")]) });
  assert.equal(recuperado.obtener("mapa-contenido").hidden, false);
  assert.equal(recuperado.obtener("guardar-sesion").disabled, false);
});

test("T20 a T23: fechas, leyenda, futuro y contenido accesible", () => {
  const entorno = crearEntorno({ texto: JSON.stringify([sesion("2026-10-20", 30), sesion("2026-10-21", 120)]) });
  assert.equal(entorno.obtener("mapa-dias").children.length, 84);
  assert.equal(entorno.obtener("mapa-leyenda").children.length, 5);
  assert.match(entorno.dia("2026-10-20").getAttribute("aria-label"), /Hoy.*30 minutos/);
  assert.match(entorno.dia("2026-10-21").getAttribute("aria-label"), /Día futuro/);
  assert.doesNotMatch(entorno.dia("2026-10-21").className, /nivel-/);
});

test("T27 a T31: consulta, foco preservado, guardado exacto y fallo transaccional", () => {
  const entorno = crearEntorno({ texto: JSON.stringify([sesion("2026-10-20", 29.9)]) });
  const boton = entorno.dia("2026-10-20");
  boton.focus();
  assert.equal(entorno.obtener("mapa-consulta").hidden, false);
  assert.match(entorno.obtener("mapa-consulta-texto").textContent, /29,9 minutos/);
  entorno.guardar("2026-10-20", 0.1);
  assert.equal(entorno.dia("2026-10-20"), boton);
  assert.equal(entorno.documento.activeElement, boton);
  assert.match(entorno.obtener("mapa-consulta-texto").textContent, /30 minutos/);
  assert.equal(entorno.obtener("mapa-vacio").hidden, true);
  const guardado = entorno.datos.get(clave);
  const consulta = entorno.obtener("mapa-consulta-texto").textContent;
  entorno.falloEscritura(true);
  entorno.guardar("2026-10-20", 10);
  assert.equal(entorno.datos.get(clave), guardado);
  assert.equal(entorno.obtener("mapa-consulta-texto").textContent, consulta);
  assert.equal(entorno.obtener("tema").value, "Nuevo");
  assert.doesNotMatch(entorno.obtener("mensaje").textContent, /Sesión guardada/);
  const datos = JSON.parse(guardado);
  assert.deepEqual(Object.keys(datos[0]).sort(), ["fecha", "minutos", "tema"]);
  assert.equal(datos[0].minutos, 0.1);
  assert.equal(entorno.obtener("sesiones").children[0].children[0].children[0].textContent, "Nuevo");
});

test("T28 y T29: cierres explícitos no reabren por foco ni toque sintetizado", () => {
  const entorno = crearEntorno();
  const boton = entorno.dia("2026-10-20");
  boton.focus();
  entorno.emitir("keydown", { key: "Enter", target: boton });
  assert.equal(entorno.documento.activeElement, entorno.obtener("mapa-cerrar"));
  entorno.obtener("mapa-cerrar").emitir("click");
  assert.equal(entorno.documento.activeElement, boton);
  assert.equal(entorno.obtener("mapa-consulta").hidden, true);
  entorno.emitir("pointerdown", { target: boton, pointerType: "mouse" });
  assert.equal(entorno.obtener("mapa-consulta").hidden, false);
  entorno.emitir("keydown", { target: boton, key: "Escape" });
  assert.equal(entorno.obtener("mapa-consulta").hidden, true);
  entorno.emitir("pointerdown", { target: boton, pointerType: "touch" });
  assert.equal(entorno.obtener("mapa-consulta").hidden, false);
  entorno.emitir("pointerover", { target: entorno.dia("2026-10-19"), pointerType: "mouse" });
  assert.match(entorno.obtener("mapa-consulta-texto").textContent, /20 de octubre/);
  entorno.emitir("pointerdown", { target: entorno.obtener("tema"), pointerType: "touch" });
  assert.equal(entorno.obtener("mapa-consulta").hidden, true);
});

test("T27: cursor compartido entre día y panel y cierre diferido cancelable", () => {
  const entorno = crearEntorno();
  const boton = entorno.dia("2026-10-20");
  entorno.emitir("pointerover", { target: boton, pointerType: "mouse" });
  assert.equal(entorno.obtener("mapa-consulta").hidden, false);
  entorno.emitir("pointerout", { target: boton, relatedTarget: null, pointerType: "mouse" });
  entorno.emitir("pointerover", { target: entorno.obtener("mapa-consulta-texto"), pointerType: "mouse" });
  entorno.terminarEsperas();
  assert.equal(entorno.obtener("mapa-consulta").hidden, false);
  entorno.emitir("pointerout", { target: entorno.obtener("mapa-consulta-texto"), relatedTarget: null, pointerType: "mouse" });
  entorno.dia("2026-10-19").focus();
  entorno.terminarEsperas();
  assert.match(entorno.obtener("mapa-consulta-texto").textContent, /19 de octubre/);
  assert.equal(entorno.obtener("mapa-consulta").hidden, false);
  entorno.emitir("keydown", { key: "Escape", target: entorno.documento.activeElement });
  assert.equal(entorno.obtener("mapa-consulta").hidden, true);
  entorno.emitir("focusout", { target: entorno.documento.activeElement, relatedTarget: null });
  entorno.emitir("pointerover", { target: boton, pointerType: "mouse" });
  entorno.emitir("pointerout", { target: boton, relatedTarget: null, pointerType: "mouse" });
  entorno.terminarEsperas();
  assert.equal(entorno.obtener("mapa-consulta").hidden, true);
});

test("T32 a T34: calendario, suspensión, futuro a hoy, vacío y expulsión del foco", () => {
  const entorno = crearEntorno({ texto: JSON.stringify([sesion("2026-10-21", 60)]) });
  assert.equal(entorno.obtener("mapa-vacio").hidden, false);
  assert.equal(entorno.intervalos.length, 1);
  assert.equal(entorno.intervalos[0].demora, 30000);
  entorno.avanzar(new Date(2026, 9, 21, 12), 60);
  entorno.documento.hidden = true;
  entorno.intervalos[0].manejar();
  entorno.documento.hidden = false;
  entorno.emitir("visibilitychange");
  assert.equal(entorno.obtener("mapa-vacio").hidden, true);
  assert.match(entorno.dia("2026-10-21").getAttribute("aria-label"), /Hoy.*60 minutos/);
  entorno.dia("2026-08-03").focus();
  entorno.avanzar(new Date(2026, 9, 26, 12));
  entorno.intervalos[0].manejar();
  assert.equal(entorno.obtener("mapa-consulta").hidden, true);
  assert.equal(entorno.documento.activeElement, entorno.obtener("titulo-mapa"));
  assert.equal(entorno.dia("2026-08-03"), undefined);
  entorno.avanzar(new Date(2026, 9, 20, 12));
  entorno.emitir("visibilitychange");
  assert.equal(entorno.obtener("mapa-vacio").hidden, false);
  assert.equal(entorno.obtener("mapa-dias").children[0].dataset.fecha, "2026-08-03");
});

test("T33: la primera consulta comprueba la fecha incluso sin evento de retorno", () => {
  const entorno = crearEntorno({ texto: JSON.stringify([sesion("2026-10-21", 60)]) });
  entorno.avanzar(new Date(2026, 9, 21, 12));
  entorno.emitir("pointerdown", { target: entorno.dia("2026-10-21"), pointerType: "touch" });
  assert.match(entorno.obtener("mapa-consulta-texto").textContent, /Hoy.*60 minutos/);
  assert.equal(entorno.obtener("mapa-vacio").hidden, true);
});

test("T18: no persistir temas vacíos ni minutos no positivos", () => {
  const entorno = crearEntorno();
  entorno.guardar("2026-10-20", 25, "   ");
  entorno.guardar("2026-10-20", 0);
  entorno.guardar("2026-10-20", -1);
  assert.equal(entorno.escrituras(), 0);
});
