const storageKey = "diario-de-estudio-sesiones";
const form = document.querySelector("#session-form");
const dateInput = document.querySelector("#date");
const topicInput = document.querySelector("#topic");
const minutesInput = document.querySelector("#minutes");
const message = document.querySelector("#form-message");
const list = document.querySelector("#session-list");

// Construimos la fecha con componentes locales, sin convertirla a UTC.
function localDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseLocalDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setFullYear(year, month - 1, day);
  return date;
}

function isValidSession(session) {
  return session && typeof session.date === "string"
    && /^\d{4}-\d{2}-\d{2}$/.test(session.date)
    && localDateKey(parseLocalDate(session.date)) === session.date
    && typeof session.topic === "string" && session.topic.trim() !== ""
    && Number.isFinite(session.minutes) && session.minutes > 0;
}

function loadSessions() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
    if (!Array.isArray(saved) || !saved.every(isValidSession)) {
      throw new Error("Datos no válidos");
    }
    return saved;
  } catch {
    message.textContent = "No se han podido cargar las sesiones guardadas en este navegador.";
    return [];
  }
}

let sessions = loadSessions();
dateInput.value = localDateKey(new Date());

function calculateStreak(sessions, today = new Date()) {
  // El conjunto cuenta cada dia una sola vez, aunque tenga varias sesiones.
  const studyDays = new Set(sessions.map(session => session.date));
  const day = parseLocalDate(localDateKey(today));
  let streak = 0;

  if (!studyDays.has(localDateKey(day))) {
    day.setDate(day.getDate() - 1);
  }

  while (studyDays.has(localDateKey(day))) {
    streak += 1;
    // Restamos dias de calendario para respetar los cambios de horario local.
    day.setDate(day.getDate() - 1);
  }
  return streak;
}

function renderStreak() {
  const streak = calculateStreak(sessions);
  document.querySelector("#streak-count").textContent = streak;
  document.querySelector("#streak-unit").textContent = streak === 1 ? "día" : "días";

  const bestStreak = calculateBestStreak(sessions);
  document.querySelector("#best-streak-count").textContent = bestStreak;
  document.querySelector("#best-streak-unit").textContent = bestStreak === 1 ? "día" : "días";
}

function calculateMonthlyStudyDays(sessions, today = new Date()) {
  const todayKey = localDateKey(today);
  const currentMonth = todayKey.slice(0, 7);
  const studyDays = new Set(sessions
    .map(session => session.date)
    .filter(date => date.slice(0, 7) === currentMonth && date <= todayKey));

  return studyDays.size;
}

function renderMonthlyStudyDays() {
  const studyDays = calculateMonthlyStudyDays(sessions);
  document.querySelector("#monthly-study-days").textContent = studyDays;
  document.querySelector("#monthly-study-unit").textContent = studyDays === 1 ? "día" : "días";
}

function calculateBestStreak(sessions, today = new Date()) {
  const todayKey = localDateKey(today);
  const studyDays = [...new Set(sessions
    .map(session => session.date)
    .filter(date => date <= todayKey))].sort();
  let bestStreak = 0;
  let currentStreak = 0;
  let previousDay = null;

  for (const studyDay of studyDays) {
    if (previousDay) {
      const nextDay = parseLocalDate(previousDay);
      nextDay.setDate(nextDay.getDate() + 1);
      currentStreak = localDateKey(nextDay) === studyDay ? currentStreak + 1 : 1;
    } else {
      currentStreak = 1;
    }

    bestStreak = Math.max(bestStreak, currentStreak);
    previousDay = studyDay;
  }

  return bestStreak;
}

function calculateWeeklyMinutes(sessions, today = new Date()) {
  const weekStart = parseLocalDate(localDateKey(today));
  const daysSinceMonday = (weekStart.getDay() + 6) % 7;
  weekStart.setDate(weekStart.getDate() - daysSinceMonday);
  const weekStartKey = localDateKey(weekStart);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const weekEndKey = localDateKey(weekEnd);

  return sessions
    .filter(session => session.date >= weekStartKey && session.date < weekEndKey)
    .reduce((total, session) => total + session.minutes, 0);
}

function renderWeeklyTotal() {
  const total = calculateWeeklyMinutes(sessions);
  document.querySelector("#weekly-minutes").textContent = total.toLocaleString("es");
  document.querySelector("#weekly-unit").textContent = total === 1 ? "minuto" : "minutos";
}

function renderSessions() {
  renderStreak();
  renderMonthlyStudyDays();
  renderWeeklyTotal();
  list.replaceChildren();
  document.querySelector("#empty-message").hidden = sessions.length > 0;

  const sorted = [...sessions].sort((a, b) => b.date.localeCompare(a.date));
  for (const session of sorted) {
    const item = document.createElement("li");
    const details = document.createElement("div");
    const topic = document.createElement("strong");
    const date = document.createElement("time");
    const minutes = document.createElement("span");

    topic.className = "session-topic";
    topic.textContent = session.topic;
    date.className = "session-date";
    date.dateTime = session.date;
    date.textContent = parseLocalDate(session.date).toLocaleDateString("es", {
      day: "numeric", month: "long", year: "numeric"
    });
    minutes.className = "session-minutes";
    minutes.textContent = `${session.minutes.toLocaleString("es")} min`;

    details.append(topic, date);
    item.append(details, minutes);
    list.append(item);
  }
}

topicInput.addEventListener("input", () => topicInput.setCustomValidity(""));
minutesInput.addEventListener("input", () => minutesInput.setCustomValidity(""));

form.addEventListener("submit", event => {
  event.preventDefault();
  const topic = topicInput.value.trim();
  const minutes = Number(minutesInput.value);

  topicInput.setCustomValidity(topic ? "" : "Escribe el tema de estudio.");
  minutesInput.setCustomValidity(Number.isFinite(minutes) && minutes > 0
    ? "" : "Introduce un número de minutos mayor que 0.");
  if (!form.reportValidity()) return;

  const session = { date: dateInput.value, topic, minutes };
  if (!isValidSession(session)) {
    message.textContent = "Introduce una fecha válida con un año de cuatro cifras.";
    return;
  }
  const updatedSessions = [session, ...sessions];
  try {
    localStorage.setItem(storageKey, JSON.stringify(updatedSessions));
  } catch {
    message.textContent = "No se ha podido guardar la sesión. Comprueba que el navegador permita el almacenamiento local.";
    return;
  }

  sessions = updatedSessions;
  form.reset();
  dateInput.value = localDateKey(new Date());
  renderSessions();
  message.textContent = "Sesión guardada.";
  topicInput.focus();
});

renderSessions();
// Actualizamos la racha tambien si la pagina permanece abierta de un dia a otro.
setInterval(() => {
  renderStreak();
  renderMonthlyStudyDays();
  renderWeeklyTotal();
}, 60000);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    renderStreak();
    renderMonthlyStudyDays();
    renderWeeklyTotal();
  }
});
