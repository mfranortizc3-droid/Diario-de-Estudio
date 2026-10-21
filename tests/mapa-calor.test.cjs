const { test } = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const { readFileSync } = require("node:fs");
const { runInNewContext } = require("node:vm");
const { resolve } = require("node:path");

const rutaAplicacion = resolve(__dirname, "../app.js");

test("T01: importar en Node expone funciones sin acceder al navegador ni iniciar temporizadores", () => {
  const resultado = spawnSync(process.execPath, ["--eval", `
    const assert = require("node:assert/strict");
    assert.equal(typeof document, "undefined");
    for (const nombre of ["localStorage", "setInterval", "setTimeout"]) {
      Object.defineProperty(globalThis, nombre, {
        get() { throw new Error("Acceso inesperado a " + nombre); }
      });
    }
    const funciones = require(${JSON.stringify(rutaAplicacion)});
    const nombres = [
      "fechaLocal", "convertirFecha", "sesionValida", "calcularRacha",
      "calcularMejorRacha", "calcularMinutosSemana", "calcularDiasMes",
      "formatearMinutos"
    ];
    for (const nombre of nombres) assert.equal(typeof funciones[nombre], "function");
  `], { encoding: "utf8" });

  assert.equal(resultado.error, undefined);
  assert.equal(resultado.status, 0, resultado.stderr);
  assert.equal(resultado.stdout, "");
});

test("T01: el script clásico puede cargarse sin CommonJS y sin navegador", () => {
  const contenido = readFileSync(rutaAplicacion, "utf8");
  assert.doesNotThrow(() => runInNewContext(contenido, {}));
});

const logica = require(rutaAplicacion);
const hoy = new Date(2026, 9, 20, 12);
const sesion = (fecha, minutos = 25, tema = "Repaso") => ({ fecha, tema, minutos });
const sesionesDe = fechas => fechas.map(fecha => sesion(fecha));

test("T02: racha actual: hoy, ayer, huecos, duplicados y futuras", () => {
  for (const [fechas, esperada] of [
    [[], 0], [["2026-10-20"], 1], [["2026-10-19"], 1],
    [["2026-10-18"], 0], [["2026-10-20", "2026-10-18"], 1],
    [["2026-10-18", "2026-10-19", "2026-10-20", "2026-10-20", "2026-10-21"], 3]
  ]) assert.equal(logica.calcularRacha(sesionesDe(fechas), hoy), esperada);
});

test("T02: mejor racha histórica y unión retroactiva sin futuras", () => {
  const sesiones = sesionesDe(["2026-09-29", "2026-09-30", "2026-10-02", "2026-10-03", "2026-10-03"]);
  assert.equal(logica.calcularMejorRacha(sesiones, hoy), 2);
  assert.equal(logica.calcularMejorRacha([...sesiones, sesion("2026-10-01")], hoy), 5);
  assert.equal(logica.calcularMejorRacha(sesionesDe(["2026-10-21", "2026-10-22"]), hoy), 0);
  assert.equal(logica.calcularRacha(sesionesDe(["2025-12-31", "2026-01-01"]), new Date(2026, 0, 1, 12)), 2);
});

test("T03: semana y mes locales, decimales, duplicados y límites", () => {
  const sesiones = [sesion("2026-09-30"), sesion("2026-10-18", 10), sesion("2026-10-19", 29.5), sesion("2026-10-20", 0.5), sesion("2026-10-20", 10), sesion("2026-10-21", 100)];
  assert.equal(logica.calcularMinutosSemana(sesiones, hoy), 40);
  assert.equal(logica.calcularDiasMes(sesiones, hoy), 3);
  assert.equal(logica.calcularMinutosSemana([], hoy), 0);
  assert.equal(logica.calcularDiasMes([], hoy), 0);
  const cambio = sesionesDe(["2025-12-31", "2026-01-01", "2026-01-02"]);
  assert.equal(logica.calcularMinutosSemana(cambio, new Date(2026, 0, 1, 12)), 50);
  assert.equal(logica.calcularDiasMes(cambio, new Date(2026, 0, 1, 12)), 1);
  assert.equal(logica.formatearMinutos(25), "25 min");
  assert.equal(logica.formatearMinutos(90), "1 h 30 min");
});

test("T03: conversión sin reloj, años menores de 100 y fechas inválidas", () => {
  for (const fecha of ["0099-01-01", "2024-02-29", "2026-12-31"]) {
    assert.equal(logica.fechaLocal(logica.convertirFecha(fecha)), fecha);
    assert.equal(logica.sesionValida(sesion(fecha)), true);
  }
  assert.equal(logica.calcularDiasMes([sesion("0099-01-01")], logica.convertirFecha("0099-01-01")), 1);
  for (const fecha of ["2026-02-29", "2026-04-31", "2026-13-01"]) {
    assert.equal(logica.sesionValida(sesion(fecha)), false);
  }
  const contenido = readFileSync(rutaAplicacion, "utf8");
  const contexto = runInNewContext(`${contenido}\n({ convertirFecha });`, {
    Date: class extends Date {
      constructor(...argumentos) {
        if (argumentos.length === 0) throw new Error("Reloj no permitido");
        super(...argumentos);
      }
    }
  });
  assert.equal(contexto.convertirFecha("2024-02-29").getDate(), 29);
});

test("T06: doce semanas con límites inclusivos y hoy inmutable", () => {
  for (const dia of [19, 20, 25]) {
    const referencia = new Date(2026, 9, dia, 23);
    const antes = referencia.getTime();
    assert.deepEqual(logica.obtenerPeriodoMapa(referencia), { inicio: "2026-08-03", fin: "2026-10-25" });
    assert.equal(referencia.getTime(), antes);
  }
});

test("T07: validar sin descartar ninguna sesión inválida", () => {
  assert.equal(logica.validarSesionesMapa([]), true);
  for (const valor of [null, {}, "[]", [sesion("1900-02-29")], [sesion("2026-10-20", 0)], [sesion("2026-10-20", Infinity)], [sesion("2026-10-20", NaN)], [sesion("2026-10-20", "25")], [sesion("2026-10-20", 25, " ")]]) {
    assert.equal(logica.validarSesionesMapa(valor), false);
  }
});

test("T08: coeficiente y escala decimal, incluidos exponentes", () => {
  for (const [numero, coeficiente, escala] of [[25, 25n, 0], [29.9, 299n, 1], [1e-7, 1n, 7], [1e21, 10n ** 21n, 0], [5e-324, 5n, 324]]) {
    assert.deepEqual(logica.descomponerMinutos(numero), { coeficiente, escala });
  }
});

test("T09: sumas exactas independientes del orden y total desbordado", () => {
  for (const [a, b, esperado] of [[29.9, 0.1, "30"], [59.9, 0.1, "60"], [119.9, 0.1, "120"]]) {
    for (const valores of [[a, b], [b, a]]) {
      assert.equal(logica.formatearMinutosMapa(logica.sumarMinutosExactos(valores).total), `${esperado} minutos`);
    }
  }
  assert.equal(logica.sumarMinutosExactos([Number.MAX_VALUE, Number.MAX_VALUE]).error, "total");
  assert.equal(logica.sumarMinutosExactos([Number.MAX_VALUE]).error, undefined);
  assert.equal(logica.formatearMinutosMapa(logica.sumarMinutosExactos([]).total), "0 minutos");
});

test("T10 y T11: niveles fijos y formato decimal completo sin redondeo", () => {
  for (const [numero, nivel] of [[0, 0], [0.5, 1], [29.5, 1], [30, 2], [59.5, 2], [60, 3], [119.5, 3], [120, 4], [1e21, 4]]) {
    assert.equal(logica.obtenerNivelMapa(logica.sumarMinutosExactos([numero]).total), nivel);
  }
  for (const [numero, texto] of [[0.5, "0,5"], [1e-7, "0,0000001"], [1e21, "1000000000000000000000"], [29.999999999999996, "29,999999999999996"]]) {
    assert.equal(logica.formatearMinutosMapa(logica.sumarMinutosExactos([numero]).total), `${texto} minutos`);
  }
});

test("T12 y T13: agrupar, excluir fuera del periodo y construir sin mutar", () => {
  const sesiones = [sesion("2026-10-20", 29.9), sesion("2026-08-03", 60), sesion("2026-10-20", 0.1, "Otro"), sesion("2026-08-02", 100), sesion("2026-10-21", 120)];
  const antes = JSON.stringify(sesiones);
  const mapa = logica.construirMapa(sesiones, hoy);
  assert.equal(mapa.dias.length, 84);
  assert.equal(new Set(mapa.dias.map(dia => dia.fecha)).size, 84);
  assert.deepEqual(mapa.dias.map(dia => dia.fecha), mapa.dias.map(dia => dia.fecha).sort());
  assert.equal(mapa.dias[0].fecha, "2026-08-03");
  assert.equal(mapa.dias[83].fecha, "2026-10-25");
  mapa.dias.forEach((dia, indice) => {
    assert.equal(dia.semana, Math.floor(indice / 7));
    assert.equal(dia.columna, indice % 7);
  });
  assert.equal(mapa.dias.find(dia => dia.esHoy).nivel, 2);
  const futuro = mapa.dias.find(dia => dia.fecha === "2026-10-21");
  assert.equal(futuro.futuro, true);
  assert.equal(futuro.total, undefined);
  assert.equal(futuro.nivel, undefined);
  assert.equal(mapa.vacio, false);
  assert.equal(JSON.stringify(sesiones), antes);
  assert.equal(hoy.getHours(), 12);
});

test("T13: vacío, solo futuras, nivel independiente del máximo y error sin parciales", () => {
  for (const sesiones of [[], [sesion("2026-08-02")], [sesion("2026-10-21")]]) {
    assert.equal(logica.construirMapa(sesiones, hoy).vacio, true);
  }
  const base = [sesion("2026-10-20", 30)];
  const nivel = sesiones => logica.construirMapa(sesiones, hoy).dias.find(dia => dia.esHoy).nivel;
  assert.equal(nivel(base), nivel([...base, sesion("2026-10-19", 10000)]));
  for (const [sesiones, error] of [[[sesion("1900-02-29")], "interpretacion"], [[sesion("2026-10-20", Number.MAX_VALUE), sesion("2026-10-20", Number.MAX_VALUE)], "total"]]) {
    const mapa = logica.construirMapa(sesiones, hoy);
    assert.equal(mapa.error, error);
    assert.equal(mapa.dias, undefined);
  }
});

test("T14: calendario local en zonas con y sin horario estacional", () => {
  for (const zona of ["Europe/Madrid", "America/New_York", "Asia/Tokyo"]) {
    const resultado = spawnSync(process.execPath, ["--eval", `
      const assert = require("node:assert/strict");
      const { construirMapa, convertirFecha, fechaLocal, calcularRacha, calcularMejorRacha, calcularMinutosSemana, calcularDiasMes } = require(${JSON.stringify(rutaAplicacion)});
      for (const texto of ["2024-03-31", "2024-11-03", "2026-10-25", "2026-01-01", "2024-02-29"]) {
        const hoy = convertirFecha(texto);
        const dias = construirMapa([], hoy).dias;
        assert.equal(dias.length, 84);
        assert.equal(new Set(dias.map(dia => dia.fecha)).size, 84);
        const ayer = convertirFecha(texto);
        ayer.setDate(ayer.getDate()-1);
        const sesiones = [texto, fechaLocal(ayer)].map(fecha=>({fecha,tema:"Repaso",minutos:25}));
        assert.equal(calcularRacha(sesiones,hoy),2);
        assert.equal(calcularMejorRacha(sesiones,hoy),2);
        assert.equal(calcularMinutosSemana(sesiones,hoy),hoy.getDay()===1?25:50);
        assert.equal(calcularDiasMes(sesiones,hoy),ayer.getMonth()===hoy.getMonth()?2:1);
        for (let i = 1; i < 84; i++) {
          const siguiente = convertirFecha(dias[i-1].fecha);
          siguiente.setDate(siguiente.getDate()+1);
          assert.equal(dias[i].fecha, fechaLocal(siguiente));
        }
      }
    `], { encoding: "utf8", env: { ...process.env, TZ: zona } });
    assert.equal(resultado.status, 0, `${zona}: ${resultado.stderr}`);
  }
});

test("T15: descripciones de cero, hoy, actividad y futuro", () => {
  const mapa = logica.construirMapa([sesion("2026-10-20", 30)], hoy);
  const actual = logica.obtenerConsultaDia(mapa.dias.find(dia => dia.esHoy));
  assert.match(actual, /20 de octubre de 2026/);
  assert.match(actual, /Hoy/);
  assert.match(actual, /30 minutos/);
  assert.match(actual, /30 a menos de 60/);
  assert.match(logica.obtenerConsultaDia(mapa.dias[0]), /0 minutos/);
  assert.match(logica.obtenerConsultaDia(mapa.dias[83]), /Día futuro/);
  assert.doesNotMatch(logica.obtenerConsultaDia(mapa.dias[83]), /minutos/);
});

test("T25 y T26: consulta pura, causas de apertura, cierre y expulsión", () => {
  const resolver = (estado, evento, fechas = ["a", "b"]) => logica.resolverEstadoConsulta(estado, evento, fechas);
  const abrir = (fuente, fecha = "a") => ({ tipo: "abrir", fuente, fecha });
  let estado = resolver({}, abrir("cursor"));
  assert.equal(estado.fecha, "a");
  estado = resolver(estado, abrir("foco"));
  estado = resolver(estado, { tipo: "salir", fuente: "cursor" });
  assert.equal(estado.fecha, "a");
  estado = resolver(estado, abrir("toque", "b"));
  estado = resolver(estado, { tipo: "salir", fuente: "foco" });
  assert.equal(estado.fecha, "b");
  estado = resolver(estado, { tipo: "cerrar", devolverFoco: true });
  assert.equal(estado.fecha, null);
  assert.equal(estado.destinoFoco, "b");
  assert.equal(estado.toque, false);
  estado = resolver(estado, abrir("foco", "a"));
  assert.equal(estado.fecha, "a");
  const expulsado = resolver(estado, { tipo: "actualizar", focoDentro: true }, ["b"]);
  assert.equal(expulsado.fecha, null);
  assert.equal(expulsado.destinoFoco, "titulo");
  assert.equal(resolver(estado, { tipo: "actualizar", focoDentro: false }, ["b"]).destinoFoco, null);
});

test("RF-2: calendario con siete columnas y cabecera dentro del mismo desplazamiento", () => {
  const html = readFileSync(resolve(__dirname, "../index.html"), "utf8");
  const estilos = readFileSync(resolve(__dirname, "../styles.css"), "utf8");
  const inicioDesplazamiento = html.indexOf('id="mapa-desplazamiento"');
  const inicioCabecera = html.indexOf('class="mapa-semana"');
  const inicioDias = html.indexOf('id="mapa-dias"');
  assert.ok(inicioDesplazamiento < inicioCabecera && inicioCabecera < inicioDias);
  assert.match(estilos, /\.mapa-dias\s*\{[^}]*grid-template-columns:\s*repeat\(7,/);
  assert.match(estilos, /\.mapa-semana\s*\{[^}]*grid-template-columns:\s*repeat\(7,/);
});
