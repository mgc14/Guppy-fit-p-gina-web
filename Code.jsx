import { useState, useEffect, useRef, useCallback } from "react";

// ── CONFIG ────────────────────────────────────────────────────────────────────
const GOOGLE_CLIENT_ID = "TU_CLIENT_ID_AQUI.apps.googleusercontent.com";
const GOOGLE_FIT_SCOPES = [
  "https://www.googleapis.com/auth/fitness.activity.read",
  "https://www.googleapis.com/auth/fitness.activity.write", // 👈 Necesario para guardar
  "https://www.googleapis.com/auth/fitness.heart_rate.read",
  "https://www.googleapis.com/auth/fitness.body.read",
].join(" ");

// ── PALETTE ───────────────────────────────────────────────────────────────────
const G = {
  cream: "#FFF8F0", mint: "#C8F0E8", lavender: "#E8D6FF",
  coral: "#FF8A7A", teal: "#4ECDC4", navy: "#1A2744",
  gold: "#F4C842", lilac: "#B8A0E8", sakura: "#FFB3C6",
  deepMint: "#2BAE9A", cardBg: "rgba(255,255,255,0.85)",
  indigo: "#3D5A99", deepPurple: "#2D1B69",
};

// ── GLOBAL STYLES ─────────────────────────────────────────────────────────────
(() => {
  const l = document.createElement("link");
  l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Yeon+Sung&family=Nanum+Gothic:wght@400;700&family=Do+Hyeon&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style");
  s.textContent = `
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body{background:#FFF8F0;font-family:'Nanum Gothic',sans-serif}
    @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
    @keyframes fadein{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
    @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
    @keyframes pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.08);opacity:0.85}}
    @keyframes ripple{0%{transform:scale(1);opacity:0.6}100%{transform:scale(2.5);opacity:0}}
    @keyframes shimmer{0%{opacity:0.4}50%{opacity:1}100%{opacity:0.4}}
    .fadein{animation:fadein 0.45s ease both}
    .floating{animation:float 3s ease-in-out infinite}
    .pulsing{animation:pulse 2s ease-in-out infinite}
    ::-webkit-scrollbar{width:5px}
    ::-webkit-scrollbar-thumb{background:#B8A0E8;border-radius:10px}
    input,select,textarea{font-family:'Nanum Gothic',sans-serif}
    .hov{transition:all 0.2s ease}
    .hov:hover{transform:translateY(-2px) scale(1.01)}
  `;
  document.head.appendChild(s);
})();

// ── GUPPY SVGs ────────────────────────────────────────────────────────────────
const GUPPIES = [
  ({ size=48, flip=false }) => <svg width={size} height={size} viewBox="0 0 80 80" style={{transform:flip?"scaleX(-1)":"none",display:"block"}}><ellipse cx="38" cy="42" rx="22" ry="14" fill="#FF8A7A"/><ellipse cx="52" cy="40" rx="10" ry="7" fill="#FFB347"/><ellipse cx="56" cy="40" rx="6" ry="4" fill="#FF6B6B"/><path d="M14 42 Q4 30 10 50 Q4 60 14 50 Z" fill="#F4C842"/><path d="M30 30 Q35 22 42 28" stroke="#FFD6B0" strokeWidth="2" fill="none"/><circle cx="58" cy="38" r="3" fill="#1A2744"/><circle cx="59" cy="37" r="1" fill="white"/></svg>,
  ({ size=48, flip=false }) => <svg width={size} height={size} viewBox="0 0 80 80" style={{transform:flip?"scaleX(-1)":"none",display:"block"}}><ellipse cx="38" cy="42" rx="22" ry="13" fill="#4ECDC4"/><ellipse cx="53" cy="40" rx="10" ry="7" fill="#2BAE9A"/><path d="M12 42 Q2 28 8 50 Q2 62 12 52 Z" fill="#B8A0E8"/><ellipse cx="38" cy="38" rx="6" ry="4" fill="rgba(255,255,255,0.25)"/><circle cx="56" cy="39" r="3" fill="#1A2744"/><circle cx="57" cy="38" r="1" fill="white"/></svg>,
  ({ size=48, flip=false }) => <svg width={size} height={size} viewBox="0 0 80 80" style={{transform:flip?"scaleX(-1)":"none",display:"block"}}><ellipse cx="38" cy="43" rx="20" ry="15" fill="#B8A0E8"/><ellipse cx="51" cy="41" rx="11" ry="8" fill="#E8D6FF"/><path d="M15 43 Q3 30 9 52 Q3 64 15 54 Z" fill="#FF8A7A"/><circle cx="54" cy="39" r="3.5" fill="#1A2744"/><circle cx="55" cy="38" r="1.2" fill="white"/></svg>,
  ({ size=48, flip=false }) => <svg width={size} height={size} viewBox="0 0 80 80" style={{transform:flip?"scaleX(-1)":"none",display:"block"}}><ellipse cx="40" cy="42" rx="21" ry="12" fill="#F4C842"/><ellipse cx="53" cy="40" rx="10" ry="7" fill="#FFE066"/><path d="M16 42 Q5 29 11 51 Q5 63 16 53 Z" fill="#4ECDC4"/><ellipse cx="40" cy="38" rx="7" ry="4" fill="rgba(255,255,255,0.2)"/><circle cx="55" cy="39" r="3" fill="#1A2744"/><circle cx="56" cy="38" r="1" fill="white"/></svg>,
  ({ size=48, flip=false }) => <svg width={size} height={size} viewBox="0 0 80 80" style={{transform:flip?"scaleX(-1)":"none",display:"block"}}><ellipse cx="37" cy="43" rx="22" ry="13" fill="#FFB3C6"/><ellipse cx="51" cy="41" rx="11" ry="7" fill="#FF8A7A"/><path d="M12 43 Q1 30 7 52 Q1 63 12 53 Z" fill="#F4C842"/><circle cx="54" cy="40" r="3" fill="#1A2744"/><circle cx="55" cy="39" r="1" fill="white"/></svg>,
];

// ── EXERCISE DATABASE (local, wger-style with reliable gif URLs) ───────────────
const EXERCISES = {
  fuerza: [
    { id:"sq", name:"Sentadillas", muscle:"Piernas", series:3, reps:"12-15", rest:45, desc:"Pies al ancho de hombros, baja hasta 90°, rodillas alineadas con puntas.", gif:"https://media.giphy.com/media/3oKIPavRPgJYaNI97O/giphy.gif" },
    { id:"pu", name:"Flexiones", muscle:"Pecho/Tríceps", series:3, reps:"8-12", rest:45, desc:"Cuerpo en línea recta, codos a 45° del torso, baja el pecho al suelo.", gif:"https://media.giphy.com/media/l0HlBQlQzDvTWEJQA/giphy.gif" },
    { id:"pl", name:"Plancha", muscle:"Core", series:3, reps:"30 seg", rest:30, desc:"Antebrazos en el suelo, cuerpo recto, activa glúteos y abdomen.", gif:"https://media.giphy.com/media/3oKIPe6nAnFheMbmEo/giphy.gif" },
    { id:"lu", name:"Zancadas", muscle:"Piernas/Glúteos", series:3, reps:"10 c/lado", rest:45, desc:"Paso largo al frente, rodilla trasera baja sin tocar el suelo.", gif:"https://media.giphy.com/media/3oKIPf3C7HqqYBVcCk/giphy.gif" },
    { id:"cr", name:"Abdominales", muscle:"Core", series:3, reps:"15-20", rest:30, desc:"Manos en la nuca, sube contrayendo el abdomen, no el cuello.", gif:"https://media.giphy.com/media/xT9IgG50Lg7rusUjJe/giphy.gif" },
    { id:"di", name:"Peso muerto", muscle:"Espalda/Piernas", series:3, reps:"10-12", rest:60, desc:"Espalda recta, bisagra de cadera, baja la barra por las piernas.", gif:"https://media.giphy.com/media/l0HlB0wfCzpJY1I5G/giphy.gif" },
    { id:"cu", name:"Curl de bíceps", muscle:"Bíceps", series:3, reps:"12-15", rest:45, desc:"Codos fijos al cuerpo, sube despacio y baja controlando.", gif:"https://media.giphy.com/media/l0HlPtMkMJNVdMFmM/giphy.gif" },
    { id:"tr", name:"Tríceps en banco", muscle:"Tríceps", series:3, reps:"12-15", rest:45, desc:"Manos en el borde del banco, baja doblando codos a 90°.", gif:"https://media.giphy.com/media/xT9IgFLBcm3Wi6l6Nm/giphy.gif" },
    { id:"sh", name:"Press de hombros", muscle:"Hombros", series:3, reps:"10-12", rest:45, desc:"Empuja las mancuernas hacia arriba, no arquees la espalda.", gif:"https://media.giphy.com/media/l0HlPwMAzh13pcZ20/giphy.gif" },
    { id:"ro", name:"Remo con mancuerna", muscle:"Espalda", series:3, reps:"10 c/lado", rest:45, desc:"Rodilla y mano en banco, tira del codo hacia atrás.", gif:"https://media.giphy.com/media/26ufcVAp3AiA7muNq/giphy.gif" },
  ],
  cardio: [
    { id:"jj", name:"Jumping Jacks", muscle:"Cuerpo completo", series:4, reps:"30 seg", rest:20, desc:"Salta abriendo piernas y llevando brazos arriba simultáneamente.", gif:"https://media.giphy.com/media/3oKIPqhBVJ7nLMkMXi/giphy.gif" },
    { id:"bu", name:"Burpees", muscle:"Cuerpo completo", series:3, reps:"10", rest:45, desc:"Plancha, flexión, salta y levanta brazos. Movimiento explosivo.", gif:"https://media.giphy.com/media/3oKIPrc2ngFZ6BTyww/giphy.gif" },
    { id:"mc", name:"Mountain climbers", muscle:"Core/Cardio", series:3, reps:"30 seg", rest:20, desc:"Posición de plancha, alterna rodillas al pecho a ritmo rápido.", gif:"https://media.giphy.com/media/l0HlKghz0AoKMpsiY/giphy.gif" },
    { id:"sk", name:"Skipping", muscle:"Piernas/Cardio", series:4, reps:"30 seg", rest:20, desc:"Eleva rodillas alternadas a la altura de la cadera, brazos activos.", gif:"https://media.giphy.com/media/3oKIPpFhITaFRNFSEw/giphy.gif" },
  ],
  yoga: [
    { id:"ss", name:"Saludo al sol", muscle:"Cuerpo completo", series:3, reps:"5 ciclos", rest:20, desc:"Flujo: pie junto, brazos arriba, flexión, plancha, cobra, perro boca abajo.", gif:"https://media.giphy.com/media/3oKIPnbKgN3bXeVpvy/giphy.gif" },
    { id:"wa", name:"Guerrero I", muscle:"Piernas/Caderas", series:2, reps:"45 seg c/lado", rest:15, desc:"Paso largo, rodilla delantera a 90°, brazos arriba, mira al frente.", gif:"https://media.giphy.com/media/3o6Zt6KHxJTbXCnSvu/giphy.gif" },
    { id:"tr2", name:"Postura del árbol", muscle:"Equilibrio", series:2, reps:"40 seg c/lado", rest:10, desc:"Pie en la pantorrilla o muslo interno, manos en el corazón.", gif:"https://media.giphy.com/media/3o7TKDEhaRXN5kfmN2/giphy.gif" },
    { id:"ch", name:"Postura del niño", muscle:"Espalda/Relajación", series:2, reps:"60 seg", rest:0, desc:"Rodillas al suelo, frente abajo, brazos extendidos, respira profundo.", gif:"https://media.giphy.com/media/xT9IgzoKnwFNmISR8I/giphy.gif" },
    { id:"cb", name:"Cobra", muscle:"Espalda baja", series:3, reps:"30 seg", rest:15, desc:"Boca abajo, manos bajo hombros, eleva el pecho sin despegar caderas.", gif:"https://media.giphy.com/media/3oKIPavRPgJYaNI97O/giphy.gif" },
  ],
  hipopresivos: [
    { id:"h1", name:"Postura base hipopresiva", muscle:"Suelo pélvico/Core", series:3, reps:"3 apneas", rest:60, desc:"De pie, rodillas ligeramente flexionadas, espalda recta, hombros relajados hacia abajo.", gif:"https://media.giphy.com/media/3oKIPe6nAnFheMbmEo/giphy.gif", isHipo:true, inhale:4, hold:8, exhale:6, apnea:10 },
    { id:"h2", name:"Hipopresivo en cuadrupedia", muscle:"Suelo pélvico/Transverso", series:3, reps:"3 apneas", rest:60, desc:"En cuatro apoyos, columna neutra, activa abdomen suave antes de la apnea.", gif:"https://media.giphy.com/media/l0HlBQlQzDvTWEJQA/giphy.gif", isHipo:true, inhale:4, hold:6, exhale:6, apnea:8 },
    { id:"h3", name:"Hipopresivo sentado", muscle:"Suelo pélvico/Diafragma", series:3, reps:"3 apneas", rest:45, desc:"Sentado en el suelo, piernas cruzadas, espalda recta, hombros abiertos.", gif:"https://media.giphy.com/media/3o7TKDEhaRXN5kfmN2/giphy.gif", isHipo:true, inhale:4, hold:6, exhale:6, apnea:8 },
    { id:"h4", name:"Hipopresivo de pie avanzado", muscle:"Core profundo", series:3, reps:"3 apneas", rest:60, desc:"De pie, eleva talones, inclina el tronco ligeramente, realiza la apnea con costillas abiertas.", gif:"https://media.giphy.com/media/xT9IgG50Lg7rusUjJe/giphy.gif", isHipo:true, inhale:4, hold:8, exhale:6, apnea:12 },
  ],
  meditacion: [
    { id:"m1", name:"Respiración consciente", duration:300, desc:"Cierra los ojos. Lleva tu atención a la respiración natural. Sin controlarla, solo observa.", isMed:true },
    { id:"m2", name:"Body scan", duration:420, desc:"Recorre tu cuerpo mentalmente desde los pies hasta la cabeza. Observa sin juzgar.", isMed:true },
    { id:"m3", name:"Meditación de bondad amorosa", duration:360, desc:"Genera sentimientos de amor y compasión hacia ti mismo y luego hacia otros.", isMed:true },
    { id:"m4", name:"Observación de pensamientos", duration:300, desc:"Observa tus pensamientos como nubes que pasan. No te identifiques con ellos.", isMed:true },
  ],
};

// ── SESSION TYPES ─────────────────────────────────────────────────────────────
const SESSION_TYPES = [
  { id:"fuerza", label:"Fuerza", emoji:"💪", color:"#4ECDC4", desc:"Construye músculo y potencia" },
  { id:"yoga", label:"Yoga", emoji:"🧘", color:"#B8A0E8", desc:"Flexibilidad y equilibrio" },
  { id:"hipopresivos", label:"Hipopresivos", emoji:"🌬️", color:"#FF8A7A", desc:"Suelo pélvico y core profundo" },
  { id:"meditacion", label:"Meditación", emoji:"🪷", color:"#F4C842", desc:"Calma mental y presencia" },
];

// ── 30 QUESTIONS ──────────────────────────────────────────────────────────────
const QUESTIONS = [
  { id:1, text:"¿Cuál es tu nombre?", type:"text", placeholder:"Tu nombre..." },
  { id:2, text:"¿Cuántos años tienes?", type:"number", min:10, max:100 },
  { id:3, text:"¿Cuánto pesas? (kg)", type:"number", min:30, max:300 },
  { id:4, text:"¿Cuánto mides? (cm)", type:"number", min:100, max:250 },
  { id:5, text:"¿Cuál es tu sexo biológico?", type:"select", options:["Femenino","Masculino","Prefiero no decirlo"] },
  { id:6, text:"¿Cómo describirías tu actividad actual?", type:"select", options:["Sedentario","Poco activo","Moderadamente activo","Bastante activo","Muy activo"] },
  { id:7, text:"¿Con qué frecuencia sales a caminar?", type:"select", options:["Nunca","1-2 veces/semana","3-4 veces/semana","Casi todos los días","Todos los días"] },
  { id:8, text:"¿Cuántos días a la semana quieres entrenar?", type:"select", options:["2 días","3 días","4 días","5 días","6 días"] },
  { id:9, text:"¿Qué tipos de entrenamiento te interesan?", type:"multiselect", options:["Fuerza","Yoga","Hipopresivos","Meditación","Cardio","HIIT"] },
  { id:10, text:"¿Tienes equipamiento disponible?", type:"select", options:["Solo mi cuerpo","Mancuernas en casa","Bandas elásticas","Gimnasio completo","Poco equipo"] },
  { id:11, text:"¿Cuál es tu objetivo principal?", type:"select", options:["Perder peso","Ganar músculo","Mejorar resistencia","Flexibilidad","Bienestar general","Suelo pélvico","Reducir estrés"] },
  { id:12, text:"¿Tienes alguna lesión o condición médica?", type:"select", options:["Ninguna","Problemas de rodilla","Dolor de espalda","Suelo pélvico débil","Problemas de hombro","Otra","Prefiero omitir"] },
  { id:13, text:"¿Cuánto tiempo tienes por sesión?", type:"select", options:["15-20 minutos","30 minutos","45 minutos","1 hora","Más de 1 hora"] },
  { id:14, text:"¿A qué hora prefieres entrenar?", type:"select", options:["Mañana temprano","Media mañana","Medio día","Tarde","Noche"] },
  { id:15, text:"¿Cómo calificarías tu fuerza actual?", type:"select", options:["Muy baja","Baja","Media","Buena","Muy buena"] },
  { id:16, text:"¿Cómo calificarías tu resistencia cardiovascular?", type:"select", options:["Muy baja","Baja","Media","Buena","Muy buena"] },
  { id:17, text:"¿Cómo calificarías tu flexibilidad?", type:"select", options:["Muy rígido/a","Poco flexible","Normal","Bastante flexible","Muy flexible"] },
  { id:18, text:"¿Has practicado yoga o pilates antes?", type:"select", options:["Nunca","Un poco","Intermitentemente","Regularmente","Soy practicante habitual"] },
  { id:19, text:"¿Has practicado meditación antes?", type:"select", options:["Nunca","Lo he intentado poco","Ocasionalmente","Con cierta regularidad","Práctica habitual"] },
  { id:20, text:"¿Qué intensidad prefieres al inicio?", type:"select", options:["Muy suave","Suave","Moderada","Intensa","Máxima intensidad"] },
  { id:21, text:"¿Qué parte del cuerpo quieres trabajar más?", type:"multiselect", options:["Abdomen y core","Piernas y glúteos","Pecho y brazos","Espalda","Suelo pélvico","Cuerpo completo"] },
  { id:22, text:"¿Cuántas horas duermes en promedio?", type:"select", options:["Menos de 5","5-6 horas","7-8 horas","Más de 8 horas"] },
  { id:23, text:"¿Cómo es tu alimentación general?", type:"select", options:["Muy desordenada","Irregular","Balanceada","Muy saludable"] },
  { id:24, text:"¿Bebes suficiente agua al día?", type:"select", options:["Casi nada","A veces","Generalmente sí","Siempre, +2L"] },
  { id:25, text:"¿Tienes estrés elevado actualmente?", type:"select", options:["No, estoy tranquilo/a","Un poco","Moderado","Alto","Muy alto"] },
  { id:26, text:"¿Cómo te motivas mejor?", type:"select", options:["Metas medibles","Variedad y sorpresa","Rutinas fijas","El bienestar y la calma","Superar retos"] },
  { id:27, text:"¿Tienes problemas de suelo pélvico?", type:"select", options:["No","Leve incontinencia","Prolapso leve","Postparto reciente","Prefiero omitir"] },
  { id:28, text:"¿Con qué frecuencia meditas o haces respiración consciente?", type:"select", options:["Nunca","Raramente","1-2 veces/semana","Casi todos los días","Todos los días"] },
  { id:29, text:"¿Algo más que deba saber tu entrenador virtual?", type:"text", placeholder:"(opcional) lesiones, metas específicas..." },
  { id:30, text:"¿Cómo te llama alguien que te conoce bien?", type:"text", placeholder:"Tu apodo favorito..." },
];

// ── EMOTION OPTIONS ───────────────────────────────────────────────────────────
const EMOTIONS = [
  { id:"joy", label:"Alegría", emoji:"😊", color:"#F4C842" },
  { id:"calm", label:"Calma", emoji:"😌", color:"#4ECDC4" },
  { id:"anxious", label:"Ansiedad", emoji:"😰", color:"#FF8A7A" },
  { id:"sad", label:"Tristeza", emoji:"😔", color:"#B8A0E8" },
  { id:"anger", label:"Enojo", emoji:"😤", color:"#FF6B6B" },
  { id:"neutral", label:"Neutral", emoji:"😐", color:"#aaa" },
  { id:"motivated", label:"Motivado/a", emoji:"🔥", color:"#F98C2A" },
  { id:"tired", label:"Cansancio", emoji:"😴", color:"#9B8EA0" },
];

const INTRUSIVE_LEVELS = [
  { id:"none", label:"Sin pensamientos intrusivos", emoji:"✨", color:"#4ECDC4" },
  { id:"mild", label:"Leves", emoji:"🌊", color:"#F4C842" },
  { id:"moderate", label:"Moderados", emoji:"⚡", color:"#FF8A7A" },
  { id:"strong", label:"Fuertes", emoji:"🌪️", color:"#FF6B6B" },
];

// ── LOCAL STORAGE ─────────────────────────────────────────────────────────────
const LS = {
  get: k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set: (k,v) => localStorage.setItem(k, JSON.stringify(v)),
};

// ── CLAUDE API ────────────────────────────────────────────────────────────────
async function callClaude(prompt, system) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000, system, messages:[{role:"user",content:prompt}] }),
  });
  const d = await r.json();
  return d.content?.map(b=>b.text||"").join("") || "";
}

// ── TIBETAN BOWL (Web Audio API) ──────────────────────────────────────────────
function playTibetanBowl(times = 3, onDone) {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const playOne = (i) => {
    if (i >= times) { setTimeout(() => { ctx.close(); onDone?.(); }, 500); return; }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc.connect(gain); osc2.connect(gain2);
    gain.connect(ctx.destination); gain2.connect(ctx.destination);
    const t = ctx.currentTime;
    osc.frequency.setValueAtTime(432, t);
    osc.frequency.exponentialRampToValueAtTime(428, t + 3);
    osc2.frequency.setValueAtTime(864, t);
    osc2.frequency.exponentialRampToValueAtTime(858, t + 3);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 4);
    gain2.gain.setValueAtTime(0, t);
    gain2.gain.linearRampToValueAtTime(0.06, t + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 3.5);
    osc.type = "sine"; osc2.type = "sine";
    osc.start(t); osc2.start(t);
    osc.stop(t + 4.5); osc2.stop(t + 4);
    setTimeout(() => playOne(i + 1), 4800);
  };
  playOne(0);
}

// ── GOOGLE AUTH ───────────────────────────────────────────────────────────────
function loadGSI() {
  return new Promise(r => {
    if (document.getElementById("gsi")) return r();
    const s = document.createElement("script");
    s.id="gsi"; s.src="https://accounts.google.com/gsi/client"; s.onload=r;
    document.head.appendChild(s);
  });
}
function parseJwt(t) {
  try { return JSON.parse(atob(t.split(".")[1].replace(/-/g,"+").replace(/_/g,"/"))); }
  catch { return {}; }
}

// ── GOOGLE FIT ────────────────────────────────────────────────────────────────
async function fetchFit(token) {
  const now = Date.now();
  const sod = new Date(); sod.setHours(0,0,0,0);
  const h = { Authorization:`Bearer ${token}`, "Content-Type":"application/json" };
  const u = "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate";
  const b = name => JSON.stringify({ aggregateBy:[{dataTypeName:name}], bucketByTime:{durationMillis:86400000}, startTimeMillis:sod.getTime(), endTimeMillis:now });
  try {
    const [cR,hR,aR] = await Promise.all([
      fetch(u,{method:"POST",headers:h,body:b("com.google.calories.expended")}),
      fetch(u,{method:"POST",headers:h,body:b("com.google.heart_rate.bpm")}),
      fetch(u,{method:"POST",headers:h,body:b("com.google.active_minutes")}),
    ]);
    const [cD,hD,aD] = await Promise.all([cR.json(),hR.json(),aR.json()]);
    const sum = (d,f="fpVal") => { try { const pts=d.bucket?.[0]?.dataset?.[0]?.point||[]; return pts.length?Math.round(pts.flatMap(p=>p.value?.map(v=>v[f]||0)||[]).reduce((a,b)=>a+b,0)):null; } catch{return null;} };
    const avg = (d,f="fpVal") => { try { const pts=d.bucket?.[0]?.dataset?.[0]?.point||[]; if(!pts.length)return null; const vs=pts.flatMap(p=>p.value?.map(v=>v[f]||0)||[]); return Math.round(vs.reduce((a,b)=>a+b,0)/vs.length); } catch{return null;} };
    return { calories:sum(cD), heartRate:avg(hD), activeMinutes:sum(aD,"intVal") };
  } catch { return {calories:null,heartRate:null,activeMinutes:null}; }
}

// ── PRIMITIVES ────────────────────────────────────────────────────────────────
const Card = ({children,style={}}) => (
  <div style={{background:G.cardBg,borderRadius:22,padding:"20px 22px",boxShadow:"0 4px 24px rgba(26,39,68,0.08)",border:"1.5px solid rgba(184,160,232,0.18)",backdropFilter:"blur(12px)",...style}}>
    {children}
  </div>
);

const Btn = ({children,onClick,variant="primary",disabled,style={},small}) => {
  const vs = {
    primary:{background:`linear-gradient(135deg,${G.teal},${G.lilac})`,color:"white",boxShadow:`0 4px 14px rgba(78,205,196,0.3)`},
    coral:{background:`linear-gradient(135deg,${G.coral},${G.sakura})`,color:"white",boxShadow:`0 4px 14px rgba(255,138,122,0.3)`},
    ghost:{background:"rgba(184,160,232,0.15)",color:G.navy,border:"1.5px solid rgba(184,160,232,0.4)"},
    gold:{background:`linear-gradient(135deg,${G.gold},#F98C2A)`,color:G.navy,boxShadow:`0 4px 14px rgba(244,200,66,0.35)`},
    navy:{background:`linear-gradient(135deg,${G.navy},#2A3F6B)`,color:"white",boxShadow:"0 4px 14px rgba(26,39,68,0.3)"},
    dark:{background:`linear-gradient(135deg,${G.deepPurple},#3D1B69)`,color:"white",boxShadow:"0 4px 14px rgba(45,27,105,0.4)"},
  };
  return (
    <button className="hov" onClick={disabled?undefined:onClick}
      style={{border:"none",borderRadius:50,cursor:disabled?"not-allowed":"pointer",fontFamily:"'Nanum Gothic',sans-serif",fontWeight:700,padding:small?"7px 18px":"12px 28px",fontSize:small?13:15,transition:"all 0.2s",opacity:disabled?0.5:1,display:"inline-flex",alignItems:"center",gap:7,...vs[variant],...style}}>
      {children}
    </button>
  );
};

const GuppyRow = ({count=3}) => (
  <div style={{display:"flex",gap:6,alignItems:"center"}}>
    {Array.from({length:Math.min(count,GUPPIES.length)}).map((_,i)=>{const Gp=GUPPIES[i%GUPPIES.length];return(<div key={i} style={{animation:`float ${2+i*0.4}s ease-in-out infinite`,animationDelay:`${i*0.3}s`}}><Gp size={32} flip={i%2===0}/></div>);})}
  </div>
);

// ── SCREEN: AUTH ──────────────────────────────────────────────────────────────
function AuthScreen({onAuth}) {
  const [loading,setLoading] = useState(false);
  const [err,setErr] = useState("");
  const btnRef = useRef(null);
  const isDemo = GOOGLE_CLIENT_ID.startsWith("TU_CLIENT_ID");

  useEffect(()=>{
    if(isDemo) return;
    loadGSI().then(()=>{
      if(!window.google||!btnRef.current) return;
      window.google.accounts.id.initialize({ client_id:GOOGLE_CLIENT_ID, callback:handleCred });
      window.google.accounts.id.renderButton(btnRef.current,{theme:"outline",size:"large",shape:"pill",locale:"es",width:280});
    });
  },[]);

  const handleCred = res => {
    setLoading(true);
    try {
      const {sub,name,email,picture} = parseJwt(res.credential);
      const users = LS.get("gf_users")||{};
      if(!users[sub]) users[sub]={googleId:sub,name,email,picture,plan:null,log:[],answers:null,fitToken:null,emotionLog:[]};
      LS.set("gf_users",users);
      onAuth(sub,users[sub]);
    } catch { setErr("Error al iniciar sesión 🐡"); setLoading(false); }
  };

  const demoLogin = () => {
    const id="demo_v3";
    const users=LS.get("gf_users")||{};
    if(!users[id]) users[id]={googleId:id,name:"Demo Pececito",email:"demo@guppyfit.com",picture:null,plan:null,log:[],answers:null,fitToken:null,emotionLog:[]};
    LS.set("gf_users",users);
    onAuth(id,users[id]);
  };

  return (
    <div style={{minHeight:"100vh",background:`linear-gradient(145deg,${G.cream} 0%,#EEF8FF 50%,${G.lavender}55 100%)`,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{width:"100%",maxWidth:400}} className="fadein">
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{display:"flex",justifyContent:"center",gap:5,marginBottom:14}}>
            {GUPPIES.map((Gp,i)=><div key={i} style={{animation:`float ${2+i*0.5}s ease-in-out infinite`,animationDelay:`${i*0.2}s`}}><Gp size={30} flip={i%2===0}/></div>)}
          </div>
          <h1 style={{fontFamily:"'Yeon Sung',cursive",fontSize:44,color:G.navy,letterSpacing:2,lineHeight:1}}>GuppyFit</h1>
          <p style={{color:G.deepMint,fontSize:11,marginTop:7,letterSpacing:2,fontWeight:700}}>🐠 TU ENTRENADOR KAWAII</p>
        </div>
        <Card style={{textAlign:"center"}}>
          <p style={{fontSize:15,color:G.navy,marginBottom:5,fontWeight:700,fontFamily:"'Do Hyeon',sans-serif"}}>Bienvenido/a 🌊</p>
          <p style={{fontSize:13,color:"#999",marginBottom:24,lineHeight:1.7}}>Inicia sesión con Google para guardar tu progreso.</p>
          {isDemo ? (
            <>
              <div style={{background:"rgba(244,200,66,0.12)",border:`1.5px solid ${G.gold}60`,borderRadius:14,padding:"11px 15px",marginBottom:18,textAlign:"left"}}>
                <p style={{fontSize:11,color:"#9A7700",fontWeight:700,marginBottom:2}}>⚙️ MODO DEMO</p>
                <p style={{fontSize:11,color:"#9A7700",lineHeight:1.6}}>Reemplaza <code style={{background:"rgba(0,0,0,0.06)",padding:"1px 4px",borderRadius:4}}>GOOGLE_CLIENT_ID</code> en línea 8 para activar Google Sign-In.</p>
              </div>
              <Btn onClick={demoLogin} style={{width:"100%",justifyContent:"center"}}>🐠 Entrar en modo demo</Btn>
            </>
          ) : <div style={{display:"flex",justifyContent:"center"}}><div ref={btnRef}/></div>}
          {loading&&<div style={{marginTop:14,display:"flex",alignItems:"center",justifyContent:"center",gap:8,color:G.deepMint,fontSize:13}}><div style={{width:14,height:14,border:`2px solid ${G.teal}`,borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>Iniciando...</div>}
          {err&&<p style={{color:G.coral,fontSize:13,marginTop:10}}>{err}</p>}
        </Card>
        <p style={{textAlign:"center",fontSize:11,color:"#ccc",marginTop:16,lineHeight:1.7}}>GuppyFit guarda tu información localmente.<br/>Los datos de Google Fit solo se leen.</p>
      </div>
    </div>
  );
}

// ── SCREEN: ONBOARDING (30 questions) ─────────────────────────────────────────
function OnboardingScreen({userData,onDone}) {
  const [step,setStep] = useState(0);
  const [answers,setAnswers] = useState({});
  const [sel,setSel] = useState(null);
  const q = QUESTIONS[step];
  const Gp = GUPPIES[step%GUPPIES.length];

  useEffect(()=>{
    const saved=answers[q.id];
    setSel(q.type==="multiselect"?(saved||[]):(saved!==undefined?saved:(q.type==="text"?"":null)));
  },[step]);

  const canGo = q.type==="text"?true:q.type==="multiselect"?Array.isArray(sel)&&sel.length>0:!!sel;

  const next = () => {
    const na={...answers,[q.id]:sel};
    setAnswers(na);
    if(step<QUESTIONS.length-1) setStep(step+1); else onDone(na);
  };

  const iStyle={width:"100%",padding:"12px 15px",borderRadius:13,border:"1.5px solid rgba(184,160,232,0.4)",background:"rgba(255,255,255,0.8)",fontSize:15,outline:"none",color:G.navy};

  return (
    <div style={{minHeight:"100vh",background:`linear-gradient(160deg,${G.mint}55 0%,${G.cream} 40%,${G.lavender}40 100%)`,padding:"18px 18px 48px",display:"flex",flexDirection:"column",alignItems:"center"}}>
      <div style={{width:"100%",maxWidth:520,marginBottom:14}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7}}>
          <span style={{fontFamily:"'Yeon Sung',cursive",fontSize:18,color:G.navy}}>GuppyFit 🐠</span>
          <span style={{fontSize:12,color:G.lilac,fontWeight:700}}>{step+1} / {QUESTIONS.length}</span>
        </div>
        <div style={{height:5,background:"rgba(184,160,232,0.2)",borderRadius:10,overflow:"hidden"}}>
          <div style={{height:"100%",width:`${((step+1)/QUESTIONS.length)*100}%`,background:`linear-gradient(90deg,${G.teal},${G.lilac})`,borderRadius:10,transition:"width 0.4s"}}/>
        </div>
      </div>
      <div key={step} className="fadein" style={{width:"100%",maxWidth:520}}>
        <Card>
          <div style={{display:"flex",alignItems:"flex-start",gap:13,marginBottom:20}}>
            <div className="floating"><Gp size={42}/></div>
            <div>
              <p style={{fontSize:11,color:G.deepMint,fontWeight:700,letterSpacing:1,marginBottom:3}}>PREGUNTA {step+1}</p>
              <h2 style={{fontFamily:"'Do Hyeon',sans-serif",fontSize:20,color:G.navy,lineHeight:1.3}}>{q.text}</h2>
            </div>
          </div>
          {q.type==="text"&&<input style={iStyle} placeholder={q.placeholder} value={sel||""} onChange={e=>setSel(e.target.value)}/>}
          {q.type==="number"&&<input type="number" min={q.min} max={q.max} style={{...iStyle,fontSize:28,fontWeight:700,fontFamily:"'Do Hyeon',sans-serif",textAlign:"center"}} value={sel||""} onChange={e=>setSel(e.target.value)}/>}
          {q.type==="select"&&(
            <div style={{display:"flex",flexDirection:"column",gap:7}}>
              {q.options.map(o=>(
                <button key={o} onClick={()=>setSel(o)} style={{padding:"10px 16px",borderRadius:13,textAlign:"left",cursor:"pointer",border:`1.5px solid ${sel===o?G.teal:"rgba(184,160,232,0.3)"}`,background:sel===o?`linear-gradient(135deg,${G.mint},${G.lavender}80)`:"rgba(255,255,255,0.6)",fontFamily:"'Nanum Gothic',sans-serif",fontWeight:sel===o?700:400,fontSize:13,color:G.navy,transition:"all 0.2s"}}>
                  {sel===o?"🐟 ":"○ "}{o}
                </button>
              ))}
            </div>
          )}
          {q.type==="multiselect"&&(
            <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
              {q.options.map(o=>{const s=Array.isArray(sel)&&sel.includes(o);return(
                <button key={o} onClick={()=>{const a=Array.isArray(sel)?sel:[];setSel(s?a.filter(x=>x!==o):[...a,o]);}} style={{padding:"8px 15px",borderRadius:50,cursor:"pointer",border:`1.5px solid ${s?G.teal:"rgba(184,160,232,0.35)"}`,background:s?`linear-gradient(135deg,${G.teal},${G.lilac})`:"rgba(255,255,255,0.7)",fontFamily:"'Nanum Gothic',sans-serif",fontWeight:700,fontSize:13,color:s?"white":G.navy,transition:"all 0.2s"}}>
                  {s?"🐠 ":""}{o}
                </button>
              );})}
              <p style={{width:"100%",fontSize:11,color:"#bbb",marginTop:3}}>Puedes elegir varios</p>
            </div>
          )}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:20}}>
            {step>0?<Btn onClick={()=>setStep(step-1)} variant="ghost" small>← Anterior</Btn>:<div/>}
            <Btn onClick={next} disabled={!canGo}>{step===QUESTIONS.length-1?"🐠 ¡Crear mi plan!":"Siguiente →"}</Btn>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── SCREEN: GENERATING ────────────────────────────────────────────────────────
function GeneratingScreen({answers,onPlan}) {
  const [status,setStatus] = useState("Analizando tus respuestas...");
  const msgs=["Analizando tus respuestas...","Diseñando tu rutina personalizada...","Eligiendo los mejores ejercicios...","Preparando tu acuario..."];

  useEffect(()=>{
    let i=0; const iv=setInterval(()=>{i=(i+1)%msgs.length;setStatus(msgs[i]);},2000);
    const a=answers;
    const prompt=`Genera plan de entrenamiento personalizado en JSON. Usuario: Nombre:${a[1]},Edad:${a[2]},Peso:${a[3]}kg,Talla:${a[4]}cm,Sexo:${a[5]},Actividad:${a[6]},Objetivo:${a[11]},Lesiones:${a[12]},Tiempo:${a[13]},Fuerza:${a[15]},Flexibilidad:${a[17]},Meditación previa:${a[19]},Intensidad:${a[20]},Suelo pélvico:${a[27]},Apodo:${a[30]}
Devuelve SOLO JSON: {"nickname":"apodo","diasPorSemana":3,"recomendaciones":["tip1","tip2","tip3"]}`;
    const fallback={nickname:a[30]||a[1]||"Pececito",diasPorSemana:3,recomendaciones:["Hidratate bien antes y después de cada sesión","Escucha a tu cuerpo y descansa cuando lo necesites","La constancia supera la intensidad"]};
    callClaude(prompt,"Eres entrenador personal experto. Devuelve ÚNICAMENTE JSON válido sin backticks.")
      .then(raw=>{clearInterval(iv);try{onPlan(JSON.parse(raw.replace(/```json|```/g,"").trim()));}catch{onPlan(fallback);}})
      .catch(()=>{clearInterval(iv);onPlan(fallback);});
    return ()=>clearInterval(iv);
  },[]);

  const Gp=GUPPIES[0];
  return (
    <div style={{minHeight:"100vh",background:`linear-gradient(145deg,${G.navy},#2A3F6B)`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:"white"}}>
      <div style={{textAlign:"center"}} className="fadein">
        <div style={{position:"relative",width:100,height:100,margin:"0 auto 22px"}}>
          <div style={{width:100,height:100,borderRadius:"50%",border:`3px solid rgba(78,205,196,0.25)`,borderTopColor:G.teal,animation:"spin 1.5s linear infinite",position:"absolute"}}/>
          <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}><Gp size={54}/></div>
        </div>
        <h2 style={{fontFamily:"'Do Hyeon',sans-serif",fontSize:22,marginBottom:8}}>Creando tu plan</h2>
        <p style={{color:G.teal,fontSize:13}}>{status}</p>
        <div style={{display:"flex",justifyContent:"center",gap:9,marginTop:26}}>
          {GUPPIES.map((Gp,i)=><div key={i} style={{animation:`float ${2+i*0.3}s ease-in-out infinite`,animationDelay:`${i*0.4}s`}}><Gp size={28} flip={i%2===1}/></div>)}
        </div>
      </div>
    </div>
  );
}

// ── SCREEN: EMOTION CHECK ─────────────────────────────────────────────────────
function EmotionCheckScreen({onDone}) {
  const [emotion,setEmotion] = useState(null);
  const [intrusive,setIntrusive] = useState(null);
  const [energy,setEnergy] = useState(5);

  const canContinue = emotion&&intrusive;

  return (
    <div style={{minHeight:"100vh",background:`linear-gradient(160deg,${G.lavender}60 0%,${G.cream} 50%,${G.mint}40 100%)`,padding:"24px 18px 48px",display:"flex",flexDirection:"column",alignItems:"center"}}>
      <div style={{width:"100%",maxWidth:500}} className="fadein">
        <h1 style={{fontFamily:"'Yeon Sung',cursive",fontSize:26,color:G.navy,textAlign:"center",marginBottom:4}}>¿Cómo estás hoy? 🌸</h1>
        <p style={{textAlign:"center",fontSize:13,color:"#999",marginBottom:22}}>Antes de entrenar, registra tu estado</p>

        {/* Emotion */}
        <Card style={{marginBottom:14}}>
          <p style={{fontSize:11,color:G.deepMint,fontWeight:700,letterSpacing:1,marginBottom:12}}>¿QUÉ EMOCIÓN PREDOMINA?</p>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {EMOTIONS.map(e=>(
              <button key={e.id} onClick={()=>setEmotion(e.id)}
                style={{padding:"8px 14px",borderRadius:50,cursor:"pointer",border:`1.5px solid ${emotion===e.id?e.color:"rgba(184,160,232,0.3)"}`,background:emotion===e.id?`${e.color}25`:"rgba(255,255,255,0.7)",fontFamily:"'Nanum Gothic',sans-serif",fontWeight:700,fontSize:13,color:G.navy,transition:"all 0.2s",display:"flex",alignItems:"center",gap:5}}>
                {e.emoji} {e.label}
              </button>
            ))}
          </div>
        </Card>

        {/* Intrusive thoughts */}
        <Card style={{marginBottom:14}}>
          <p style={{fontSize:11,color:G.deepMint,fontWeight:700,letterSpacing:1,marginBottom:12}}>PENSAMIENTOS INTRUSIVOS</p>
          <div style={{display:"flex",flexDirection:"column",gap:7}}>
            {INTRUSIVE_LEVELS.map(l=>(
              <button key={l.id} onClick={()=>setIntrusive(l.id)}
                style={{padding:"10px 16px",borderRadius:13,cursor:"pointer",textAlign:"left",border:`1.5px solid ${intrusive===l.id?l.color:"rgba(184,160,232,0.3)"}`,background:intrusive===l.id?`${l.color}20`:"rgba(255,255,255,0.6)",fontFamily:"'Nanum Gothic',sans-serif",fontWeight:intrusive===l.id?700:400,fontSize:13,color:G.navy,transition:"all 0.2s"}}>
                {l.emoji} {l.label}
              </button>
            ))}
          </div>
        </Card>

        {/* Energy level */}
        <Card style={{marginBottom:22}}>
          <p style={{fontSize:11,color:G.deepMint,fontWeight:700,letterSpacing:1,marginBottom:4}}>NIVEL DE ENERGÍA</p>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#bbb",marginBottom:8}}>
            <span>😴 Sin energía</span><span>⚡ Lleno/a de energía</span>
          </div>
          <input type="range" min={1} max={10} value={energy} onChange={e=>setEnergy(+e.target.value)}
            style={{width:"100%",accentColor:G.teal,height:6}}/>
          <div style={{textAlign:"center",marginTop:8}}>
            <span style={{fontFamily:"'Do Hyeon',sans-serif",fontSize:28,color:G.teal}}>{energy}</span>
            <span style={{fontSize:12,color:"#aaa"}}> / 10</span>
          </div>
        </Card>

        <Btn onClick={()=>onDone({emotion,intrusive,energy,date:new Date().toISOString()})}
          disabled={!canContinue} style={{width:"100%",justifyContent:"center"}}>
          🐠 Continuar al entrenamiento
        </Btn>
      </div>
    </div>
  );
}

// ── SCREEN: SESSION TYPE SELECTOR ─────────────────────────────────────────────
function SessionTypeScreen({onSelect,onBack}) {
  return (
    <div style={{minHeight:"100vh",background:`linear-gradient(160deg,${G.cream} 0%,#EEF8FF 60%,${G.lavender}40 100%)`,padding:"24px 18px",display:"flex",flexDirection:"column",alignItems:"center"}}>
      <div style={{width:"100%",maxWidth:500}} className="fadein">
        <button onClick={onBack} style={{background:"none",border:"none",color:G.lilac,fontSize:13,cursor:"pointer",fontFamily:"'Nanum Gothic',sans-serif",marginBottom:16,fontWeight:700}}>← Volver</button>
        <h1 style={{fontFamily:"'Yeon Sung',cursive",fontSize:26,color:G.navy,marginBottom:4}}>¿Qué practicamos hoy?</h1>
        <p style={{fontSize:13,color:"#999",marginBottom:22}}>Elige el tipo de sesión que quieres hacer</p>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {SESSION_TYPES.map((t,i)=>{
            const Gp=GUPPIES[(i+1)%GUPPIES.length];
            return (
              <div key={t.id} onClick={()=>onSelect(t.id)} className="hov"
                style={{background:G.cardBg,borderRadius:20,padding:"18px 20px",display:"flex",alignItems:"center",gap:14,cursor:"pointer",border:`1.5px solid ${t.color}40`,boxShadow:`0 4px 18px ${t.color}20`}}>
                <div style={{width:52,height:52,borderRadius:16,background:`${t.color}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0}}>{t.emoji}</div>
                <div style={{flex:1}}>
                  <h3 style={{fontFamily:"'Do Hyeon',sans-serif",fontSize:18,color:G.navy}}>{t.label}</h3>
                  <p style={{fontSize:12,color:"#999",marginTop:2}}>{t.desc}</p>
                  <p style={{fontSize:11,color:t.color,fontWeight:700,marginTop:4}}>15-20 minutos</p>
                </div>
                <div style={{animation:`float ${2+i*0.4}s ease-in-out infinite`}}><Gp size={34}/></div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── SCREEN: MEDITATION SESSION ────────────────────────────────────────────────
function MeditationScreen({onComplete,onBack}) {
  const [phase,setPhase] = useState("intro"); // intro|bowl_start|active|bowl_end|done
  const [timerLeft,setTimerLeft] = useState(0);
  const [bowlCount,setBowlCount] = useState(0);
  const [meditation] = useState(()=>EXERCISES.meditacion[Math.floor(Math.random()*EXERCISES.meditacion.length)]);
  const [sessionStart] = useState(Date.now());
  const ivRef = useRef(null);

  const startSession = () => {
    setPhase("bowl_start");
    setBowlCount(0);
    playTibetanBowl(3, ()=>{
      setPhase("active");
      setTimerLeft(meditation.duration);
    });
  };

  useEffect(()=>{
    if(phase==="active"){
      ivRef.current=setInterval(()=>{
        setTimerLeft(t=>{
          if(t<=1){
            clearInterval(ivRef.current);
            setPhase("bowl_end");
            playTibetanBowl(3,()=>setPhase("done"));
            return 0;
          }
          return t-1;
        });
      },1000);
    }
    return ()=>clearInterval(ivRef.current);
  },[phase]);

  const fmt = s=>`${Math.floor(s/60).toString().padStart(2,"0")}:${(s%60).toString().padStart(2,"0")}`;
  const pct = phase==="active"?((meditation.duration-timerLeft)/meditation.duration)*100:0;

  if(phase==="done") return (
    <div style={{minHeight:"100vh",background:`linear-gradient(145deg,${G.deepPurple},#1A2744)`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,color:"white",textAlign:"center"}}>
      <div className="fadein">
        <div style={{fontSize:64,marginBottom:14}}>🙏</div>
        <h1 style={{fontFamily:"'Yeon Sung',cursive",fontSize:28,marginBottom:8}}>Meditación completada</h1>
        <p style={{color:G.teal,marginBottom:8,fontSize:14}}>{meditation.name}</p>
        <p style={{color:"rgba(255,255,255,0.6)",fontSize:13,marginBottom:28}}>{Math.round(meditation.duration/60)} minutos de práctica</p>
        <div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:28}}>
          {GUPPIES.map((Gp,i)=><div key={i} style={{animation:`float ${1.5+i*0.3}s ease-in-out infinite`}}><Gp size={34} flip={i%2===1}/></div>)}
        </div>
        <Btn onClick={()=>onComplete({tipo:"meditacion",nombre:meditation.name,duracion:Math.round((Date.now()-sessionStart)/1000),date:new Date().toISOString()})} variant="gold">🐠 Guardar y volver</Btn>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:`linear-gradient(145deg,${G.deepPurple},#2D1B69)`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,color:"white"}}>
      <button onClick={onBack} style={{position:"absolute",top:20,left:20,background:"rgba(255,255,255,0.1)",border:"none",color:"white",borderRadius:10,padding:"6px 12px",cursor:"pointer",fontSize:13,fontFamily:"'Nanum Gothic',sans-serif"}}>← Salir</button>

      {phase==="intro"&&(
        <div className="fadein" style={{textAlign:"center",maxWidth:420}}>
          <div style={{fontSize:64,marginBottom:16}}>🪷</div>
          <h2 style={{fontFamily:"'Do Hyeon',sans-serif",fontSize:24,marginBottom:10}}>{meditation.name}</h2>
          <p style={{color:"rgba(255,255,255,0.75)",fontSize:14,lineHeight:1.7,marginBottom:28}}>{meditation.desc}</p>
          <p style={{color:G.teal,fontSize:13,marginBottom:28}}>Duración: {Math.round(meditation.duration/60)} minutos</p>
          <p style={{color:"rgba(255,255,255,0.5)",fontSize:12,marginBottom:24}}>La sesión comenzará con 3 toques de cuenco tibetano</p>
          <Btn onClick={startSession} variant="dark" style={{background:`linear-gradient(135deg,${G.lilac},${G.deepMint})`,color:"white"}}>🪷 Comenzar meditación</Btn>
        </div>
      )}

      {phase==="bowl_start"&&(
        <div className="fadein" style={{textAlign:"center"}}>
          <div style={{fontSize:80,animation:"pulse 1.5s ease-in-out infinite",display:"inline-block",marginBottom:20}}>🔔</div>
          <h2 style={{fontFamily:"'Do Hyeon',sans-serif",fontSize:22,marginBottom:10}}>Cuenco tibetano</h2>
          <p style={{color:G.teal,fontSize:14}}>Escucha y relaja tu cuerpo...</p>
        </div>
      )}

      {phase==="active"&&(
        <div className="fadein" style={{textAlign:"center",width:"100%",maxWidth:380}}>
          <div style={{position:"relative",width:180,height:180,margin:"0 auto 28px"}}>
            <svg width={180} height={180} style={{position:"absolute",top:0,left:0}}>
              <circle cx={90} cy={90} r={80} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={6}/>
              <circle cx={90} cy={90} r={80} fill="none" stroke={G.teal} strokeWidth={6}
                strokeDasharray={`${2*Math.PI*80}`}
                strokeDashoffset={`${2*Math.PI*80*(1-pct/100)}`}
                strokeLinecap="round"
                style={{transform:"rotate(-90deg)",transformOrigin:"center",transition:"stroke-dashoffset 1s linear"}}/>
            </svg>
            <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
              <span style={{fontFamily:"'Do Hyeon',sans-serif",fontSize:38,color:"white"}}>{fmt(timerLeft)}</span>
              <span style={{fontSize:11,color:"rgba(255,255,255,0.5)",letterSpacing:1}}>RESTANTE</span>
            </div>
          </div>
          <h2 style={{fontFamily:"'Do Hyeon',sans-serif",fontSize:20,marginBottom:10}}>{meditation.name}</h2>
          <p style={{color:"rgba(255,255,255,0.65)",fontSize:13,lineHeight:1.7,marginBottom:8}}>{meditation.desc}</p>
          <p style={{color:G.teal,fontSize:12}}>🔔 Tres toques de cuenco al finalizar</p>
        </div>
      )}

      {phase==="bowl_end"&&(
        <div className="fadein" style={{textAlign:"center"}}>
          <div style={{fontSize:80,animation:"pulse 1.5s ease-in-out infinite",display:"inline-block",marginBottom:20}}>🔔</div>
          <h2 style={{fontFamily:"'Do Hyeon',sans-serif",fontSize:22,marginBottom:10}}>Finalizando...</h2>
          <p style={{color:G.teal,fontSize:14}}>Lleva la consciencia de vuelta al cuerpo</p>
        </div>
      )}
    </div>
  );
}

// ── SCREEN: HIPOPRESIVOS SESSION ──────────────────────────────────────────────
function HipopresivosScreen({onComplete,onBack}) {
  const [exIdx,setExIdx] = useState(0);
  const [apneaIdx,setApneaIdx] = useState(0);
  const [breathPhase,setBreathPhase] = useState("ready"); // ready|inhale|hold|exhale|apnea|rest|done
  const [timer,setTimer] = useState(0);
  const [gifErr,setGifErr] = useState(false);
  const [completed,setCompleted] = useState([]);
  const [sessionStart] = useState(Date.now());
  const ivRef = useRef(null);
  const exercises = EXERCISES.hipopresivos;
  const ex = exercises[exIdx];

  useEffect(()=>{ setGifErr(false); setApneaIdx(0); setBreathPhase("ready"); },[exIdx]);

  const startBreath = () => {
    setBreathPhase("inhale"); setTimer(ex.inhale);
    let phase="inhale", t=ex.inhale;
    ivRef.current=setInterval(()=>{
      t--;
      if(t<=0){
        if(phase==="inhale"){ phase="hold"; t=ex.hold; setBreathPhase("hold"); setTimer(t); }
        else if(phase==="hold"){ phase="exhale"; t=ex.exhale; setBreathPhase("exhale"); setTimer(t); }
        else if(phase==="exhale"){ phase="apnea"; t=ex.apnea; setBreathPhase("apnea"); setTimer(t); }
        else if(phase==="apnea"){
          clearInterval(ivRef.current);
          const na=apneaIdx+1;
          setApneaIdx(na);
          if(na>=ex.series){
            const nc=[...completed,ex.name];
            setCompleted(nc);
            if(exIdx<exercises.length-1){ setTimeout(()=>{setExIdx(exIdx+1);},400); }
            else { setBreathPhase("done"); }
          } else { setBreathPhase("rest"); setTimer(ex.rest); }
        }
      } else { setTimer(t); }
    },1000);
  };

  useEffect(()=>{
    if(breathPhase==="rest"){
      let t=ex.rest;
      ivRef.current=setInterval(()=>{t--;setTimer(t);if(t<=0){clearInterval(ivRef.current);setBreathPhase("ready");}},1000);
    }
    return ()=>clearInterval(ivRef.current);
  },[breathPhase]);

  const phaseColors={ready:G.teal,inhale:"#4ECDC4",hold:"#B8A0E8",exhale:"#FF8A7A",apnea:"#F4C842",rest:"#aaa"};
  const phaseLabels={ready:"Preparado/a",inhale:`Inhala... ${timer}s`,hold:`Retén... ${timer}s`,exhale:`Exhala... ${timer}s`,apnea:`Apnea ${timer}s`,rest:`Descansa ${timer}s`};
  const phaseEmojis={ready:"🌬️",inhale:"🫁",hold:"⏸️",exhale:"💨",apnea:"🌀",rest:"😮‍💨"};

  if(breathPhase==="done") return (
    <div style={{minHeight:"100vh",background:`linear-gradient(145deg,${G.navy},#2A3F6B)`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,color:"white",textAlign:"center"}}>
      <div className="fadein">
        <div style={{fontSize:64,marginBottom:14}}>🌬️</div>
        <h1 style={{fontFamily:"'Yeon Sung',cursive",fontSize:28,marginBottom:8}}>¡Hipopresivos completados!</h1>
        <p style={{color:G.teal,fontSize:14,marginBottom:28}}>{completed.length} ejercicios realizados</p>
        <Btn onClick={()=>onComplete({tipo:"hipopresivos",nombre:"Sesión de hipopresivos",completados:completed.length,total:exercises.length,duracion:Math.round((Date.now()-sessionStart)/1000),date:new Date().toISOString()})} variant="gold">🐠 Guardar y volver</Btn>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:`linear-gradient(160deg,${G.cream} 0%,#EEF8FF 100%)`,paddingBottom:40}}>
      <div style={{background:`linear-gradient(135deg,${G.navy},#2A3F6B)`,padding:"15px 18px 20px",borderRadius:"0 0 24px 24px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:9}}>
          <button onClick={onBack} style={{background:"rgba(255,255,255,0.1)",border:"none",color:"white",borderRadius:10,padding:"6px 12px",cursor:"pointer",fontSize:13,fontFamily:"'Nanum Gothic',sans-serif"}}>← Salir</button>
          <span style={{color:G.teal,fontSize:12,fontWeight:700}}>Ejercicio {exIdx+1}/{exercises.length} · Apnea {apneaIdx+1}/{ex.series}</span>
        </div>
        <div style={{height:5,background:"rgba(255,255,255,0.15)",borderRadius:10,overflow:"hidden"}}>
          <div style={{height:"100%",width:`${(exIdx/exercises.length)*100}%`,background:`linear-gradient(90deg,${G.teal},${G.gold})`,borderRadius:10,transition:"width 0.4s"}}/>
        </div>
      </div>

      <div style={{padding:"18px 18px",maxWidth:540,margin:"0 auto"}}>
        <div className="fadein" key={exIdx}>
          <Card style={{marginBottom:12}}>
            <h2 style={{fontFamily:"'Do Hyeon',sans-serif",fontSize:20,color:G.navy,marginBottom:4}}>🌬️ {ex.name}</h2>
            <p style={{fontSize:12,color:G.deepMint,fontWeight:700,marginBottom:10}}>{ex.muscle}</p>
            <p style={{fontSize:13,color:"#777",lineHeight:1.6,marginBottom:12}}>{ex.desc}</p>
            <div style={{borderRadius:14,overflow:"hidden",background:"#f5f5f5",marginBottom:12,minHeight:130,display:"flex",alignItems:"center",justifyContent:"center"}}>
              {!gifErr?<img src={ex.gif} alt={ex.name} onError={()=>setGifErr(true)} style={{width:"100%",maxHeight:170,objectFit:"cover"}}/>
                :<div style={{padding:24,color:"#ccc",textAlign:"center"}}><div style={{fontSize:36}}>🌬️</div></div>}
            </div>
          </Card>

          {/* Breath circle */}
          <Card style={{marginBottom:12,textAlign:"center"}}>
            <div style={{position:"relative",width:140,height:140,margin:"0 auto 16px"}}>
              <svg width={140} height={140} style={{position:"absolute",top:0,left:0}}>
                <circle cx={70} cy={70} r={60} fill="none" stroke="rgba(184,160,232,0.2)" strokeWidth={5}/>
                {breathPhase!=="ready"&&breathPhase!=="rest"&&<circle cx={70} cy={70} r={60} fill="none" stroke={phaseColors[breathPhase]||G.teal} strokeWidth={5} strokeDasharray={`${2*Math.PI*60}`} strokeDashoffset={`${2*Math.PI*60*0.25}`} strokeLinecap="round" style={{transform:"rotate(-90deg)",transformOrigin:"center",transition:"all 0.5s"}}/>}
              </svg>
              <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                <span style={{fontSize:32}}>{phaseEmojis[breathPhase]||"🌬️"}</span>
                <span style={{fontFamily:"'Do Hyeon',sans-serif",fontSize:20,color:phaseColors[breathPhase]||G.navy,marginTop:4}}>{timer||""}</span>
              </div>
            </div>
            <p style={{fontFamily:"'Do Hyeon',sans-serif",fontSize:18,color:phaseColors[breathPhase]||G.navy,marginBottom:4}}>{phaseLabels[breathPhase]||""}</p>
            <p style={{fontSize:11,color:"#bbb",marginBottom:14}}>Inhala {ex.inhale}s · Retén {ex.hold}s · Exhala {ex.exhale}s · Apnea {ex.apnea}s</p>
            {breathPhase==="ready"&&<Btn onClick={startBreath} style={{width:"100%",justifyContent:"center"}}>🌬️ Iniciar ciclo de respiración</Btn>}
          </Card>
        </div>
      </div>
    </div>
  );
}

// ── SCREEN: EXERCISE SESSION (Fuerza / Yoga / Cardio) ─────────────────────────
function ExerciseSession({tipo,onComplete,onBack}) {
  const pool = [...(EXERCISES[tipo]||EXERCISES.fuerza),...(tipo!=="cardio"?EXERCISES.cardio.slice(0,2):[])];
  const [exercises] = useState(()=>pool.slice(0,5));
  const [exIdx,setExIdx] = useState(0);
  const [phase,setPhase] = useState("preview");
  const [sets,setSets] = useState(0);
  const [timer,setTimer] = useState(0);
  const [isResting,setIsResting] = useState(false);
  const [repsInput,setRepsInput] = useState("");
  const [completed,setCompleted] = useState([]);
  const [gifErr,setGifErr] = useState(false);
  const [sessionStart] = useState(Date.now());
  const ivRef = useRef(null);
  const ex = exercises[exIdx];

  useEffect(()=>{ setSets(0); setRepsInput(""); setGifErr(false); setPhase("preview"); },[exIdx]);

  useEffect(()=>{
    if(isResting){ ivRef.current=setInterval(()=>setTimer(t=>t+1),1000); }
    else clearInterval(ivRef.current);
    return()=>clearInterval(ivRef.current);
  },[isResting]);

  const completeSeries = () => {
    const ns=sets+1; setSets(ns);
    if(ns>=ex.series){
      const nc=[...completed,{...ex,repsHechas:repsInput}];
      setCompleted(nc);
      if(exIdx<exercises.length-1){ setTimeout(()=>{setExIdx(exIdx+1);setIsResting(false);setTimer(0);},200); }
      else setPhase("done");
    } else { setIsResting(true); setTimer(0); setTimeout(()=>{setIsResting(false);setTimer(0);},ex.rest*1000); }
  };

  const fmt=s=>`${Math.floor(s/60).toString().padStart(2,"0")}:${(s%60).toString().padStart(2,"0")}`;
  const Gp=GUPPIES[exIdx%GUPPIES.length];
  const typeInfo=SESSION_TYPES.find(t=>t.id===tipo)||SESSION_TYPES[0];

  if(phase==="done") return (
    <div style={{minHeight:"100vh",background:`linear-gradient(145deg,${G.navy},#2A3F6B)`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,color:"white",textAlign:"center"}}>
      <div className="fadein">
        <div style={{fontSize:60,marginBottom:14}}>🎉</div>
        <h1 style={{fontFamily:"'Yeon Sung',cursive",fontSize:28,marginBottom:8}}>¡Sesión completada!</h1>
        <p style={{color:G.teal,fontSize:14,marginBottom:24}}>{typeInfo.label} · {completed.length} ejercicios</p>
        <div style={{display:"flex",gap:14,justifyContent:"center",marginBottom:24}}>
          {[{v:completed.length,l:"ejercicios"},{v:fmt(Math.round((Date.now()-sessionStart)/1000)),l:"duración"}].map(s=>(
            <div key={s.l} style={{background:"rgba(255,255,255,0.1)",borderRadius:16,padding:"13px 20px"}}>
              <p style={{fontSize:24,fontWeight:700,fontFamily:"'Do Hyeon',sans-serif"}}>{s.v}</p>
              <p style={{fontSize:11,color:G.teal}}>{s.l}</p>
            </div>
          ))}
        </div>
        <div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:24}}>
          {GUPPIES.map((Gp,i)=><div key={i} style={{animation:`float ${1.5+i*0.3}s ease-in-out infinite`}}><Gp size={34} flip={i%2===1}/></div>)}
        </div>
        <Btn onClick={()=>onComplete({tipo,nombre:`Sesión de ${typeInfo.label}`,completados:completed.length,total:exercises.length,duracion:Math.round((Date.now()-sessionStart)/1000),date:new Date().toISOString()})} variant="gold">🐠 Guardar y volver</Btn>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:`linear-gradient(160deg,${G.cream} 0%,#EEF8FF 100%)`,paddingBottom:40}}>
      <div style={{background:`linear-gradient(135deg,${G.navy},#2A3F6B)`,padding:"14px 18px 18px",borderRadius:"0 0 22px 22px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <button onClick={onBack} style={{background:"rgba(255,255,255,0.1)",border:"none",color:"white",borderRadius:10,padding:"5px 11px",cursor:"pointer",fontSize:13,fontFamily:"'Nanum Gothic',sans-serif"}}>← Salir</button>
          <span style={{color:G.teal,fontSize:12,fontWeight:700}}>{typeInfo.emoji} {typeInfo.label} · {exIdx+1}/{exercises.length}</span>
        </div>
        <div style={{height:5,background:"rgba(255,255,255,0.15)",borderRadius:10,overflow:"hidden"}}>
          <div style={{height:"100%",width:`${(exIdx/exercises.length)*100}%`,background:`linear-gradient(90deg,${G.teal},${G.gold})`,borderRadius:10,transition:"width 0.4s"}}/>
        </div>
      </div>

      <div style={{padding:"16px 18px",maxWidth:540,margin:"0 auto"}}>
        {isResting&&(
          <div className="fadein" style={{textAlign:"center",padding:"24px 0"}}>
            <div style={{fontSize:50,marginBottom:8}}>😮‍💨</div>
            <h2 style={{fontFamily:"'Do Hyeon',sans-serif",fontSize:24,color:G.navy,margin:"8px 0 4px"}}>Descansa</h2>
            <div style={{fontSize:60,fontWeight:700,fontFamily:"'Do Hyeon',sans-serif",color:G.deepMint,margin:"12px 0"}}>{Math.max(0,ex.rest-timer)}s</div>
            <p style={{color:"#bbb",fontSize:13}}>Siguiente serie en breve...</p>
          </div>
        )}
        {!isResting&&(
          <div className="fadein" key={exIdx}>
            <Card style={{marginBottom:12}}>
              <div style={{display:"flex",alignItems:"center",gap:11,marginBottom:12}}>
                <div className="floating"><Gp size={38}/></div>
                <div>
                  <h2 style={{fontFamily:"'Do Hyeon',sans-serif",fontSize:20,color:G.navy}}>{ex.name}</h2>
                  <p style={{fontSize:12,color:G.deepMint,fontWeight:700}}>{ex.muscle} · {ex.series} series · {ex.reps}</p>
                </div>
              </div>
              <p style={{fontSize:13,color:"#777",lineHeight:1.6,marginBottom:12}}>{ex.desc}</p>
              <div style={{borderRadius:13,overflow:"hidden",background:"#f5f5f5",marginBottom:12,minHeight:130,display:"flex",alignItems:"center",justifyContent:"center"}}>
                {!gifErr?<img src={ex.gif} alt={ex.name} onError={()=>setGifErr(true)} style={{width:"100%",maxHeight:180,objectFit:"cover"}}/>
                  :<div style={{padding:24,color:"#ccc",textAlign:"center"}}><div style={{fontSize:36}}>🐠</div><p style={{fontSize:12}}>GIF no disponible</p></div>}
              </div>
              <div style={{display:"flex",gap:5,marginBottom:5}}>
                {Array.from({length:ex.series}).map((_,i)=>(
                  <div key={i} style={{flex:1,height:6,borderRadius:10,background:i<sets?typeInfo.color:"rgba(184,160,232,0.2)",transition:"background 0.3s"}}/>
                ))}
              </div>
              <p style={{fontSize:11,color:"#bbb",textAlign:"center"}}>Serie {Math.min(sets+1,ex.series)} de {ex.series}</p>
            </Card>
            <Card style={{marginBottom:12}}>
              <p style={{fontSize:11,color:G.lilac,fontWeight:700,letterSpacing:0.5,marginBottom:7}}>REPS / TIEMPO COMPLETADO</p>
              <input style={{width:"100%",padding:"10px 13px",borderRadius:11,border:"1.5px solid rgba(184,160,232,0.35)",background:"rgba(255,255,255,0.8)",fontSize:14,outline:"none",color:G.navy}} placeholder={`Ej: ${ex.reps}`} value={repsInput} onChange={e=>setRepsInput(e.target.value)}/>
            </Card>
            <Btn onClick={completeSeries} style={{width:"100%",justifyContent:"center"}} variant={sets>=ex.series-1?"coral":"primary"}>
              {sets>=ex.series-1?"✅ Ejercicio completo →":"💪 Serie lista → Descansar"}
            </Btn>
          </div>
        )}
      </div>
    </div>
  );
}

// ── COMPONENT: Emotion Chart ──────────────────────────────────────────────────
function EmotionChart({emotionLog}) {
  if(!emotionLog||emotionLog.length<2) return null;
  const last7=emotionLog.slice(-7);
  const energyVals=last7.map(e=>e.energy||5);
  const max=10,min=1;
  const W=280,H=80,pad=8;
  const xStep=(W-pad*2)/(last7.length-1);
  const yScale=(H-pad*2)/(max-min);
  const pts=energyVals.map((v,i)=>`${pad+i*xStep},${H-pad-(v-min)*yScale}`).join(" ");

  return (
    <Card style={{marginBottom:16}}>
      <p style={{fontSize:11,color:G.deepMint,fontWeight:700,letterSpacing:1,marginBottom:12}}>EVOLUCIÓN EMOCIONAL (ÚLTIMOS 7 DÍAS)</p>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{overflow:"visible"}}>
        <defs>
          <linearGradient id="eg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={G.teal} stopOpacity="0.3"/>
            <stop offset="100%" stopColor={G.teal} stopOpacity="0"/>
          </linearGradient>
        </defs>
        <polyline points={pts} fill="none" stroke={G.teal} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/>
        {energyVals.map((v,i)=>(
          <circle key={i} cx={pad+i*xStep} cy={H-pad-(v-min)*yScale} r={4} fill={G.teal}/>
        ))}
      </svg>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:8}}>
        {last7.map((e,i)=>{
          const em=EMOTIONS.find(x=>x.id===e.emotion);
          return <div key={i} style={{textAlign:"center",flex:1}}><div style={{fontSize:14}}>{em?.emoji||"•"}</div><div style={{fontSize:9,color:"#bbb"}}>{new Date(e.date).toLocaleDateString("es-MX",{weekday:"short"}).slice(0,2)}</div></div>;
        })}
      </div>
    </Card>
  );
}

// ── SCREEN: HOME ──────────────────────────────────────────────────────────────
function HomeScreen({userId,userData,onStartSession,onLogout,onConnectFit}) {
  const {plan,log=[],fitToken,emotionLog=[]} = userData;
  const [fitData,setFitData] = useState(null);
  const [fitLoading,setFitLoading] = useState(false);

  useEffect(()=>{
    if(!fitToken) return;
    setFitLoading(true);
    fetchFit(fitToken).then(d=>setFitData(d)).finally(()=>setFitLoading(false));
  },[fitToken]);

  const weekLog=log.filter(e=>(Date.now()-new Date(e.date))/86400000<7);
  const streak=(()=>{let s=0;const d=new Date();while(log.some(e=>new Date(e.date).toDateString()===d.toDateString())){s++;d.setDate(d.getDate()-1);}return s;})();

  return (
    <div style={{minHeight:"100vh",background:`linear-gradient(160deg,${G.cream} 0%,#EEF8FF 60%,${G.lavender}40 100%)`,paddingBottom:48}}>
      {/* Header */}
      <div style={{background:`linear-gradient(135deg,${G.navy},#2A3F6B)`,padding:"18px 18px 24px",borderRadius:"0 0 28px 28px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            {userData?.picture?<img src={userData.picture} style={{width:40,height:40,borderRadius:"50%",border:`2px solid ${G.teal}`,objectFit:"cover"}} alt=""/>
              :<div style={{width:40,height:40,borderRadius:"50%",background:`linear-gradient(135deg,${G.teal},${G.lilac})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🐠</div>}
            <div>
              <p style={{color:G.teal,fontSize:10,letterSpacing:1.5,fontWeight:700}}>BIENVENIDO/A</p>
              <h1 style={{fontFamily:"'Yeon Sung',cursive",fontSize:22,color:"white",letterSpacing:1}}>{plan?.nickname||userData?.name?.split(" ")[0]||"Pececito"} 🐠</h1>
            </div>
          </div>
          <button onClick={onLogout} style={{background:"rgba(255,255,255,0.1)",border:"none",color:"rgba(255,255,255,0.65)",borderRadius:12,padding:"6px 12px",cursor:"pointer",fontSize:12,fontFamily:"'Nanum Gothic',sans-serif"}}>Salir</button>
        </div>
        <div style={{display:"flex",gap:9}}>
          {[{v:`${streak}🔥`,s:"racha"},{v:weekLog.length,s:"esta semana"},{v:log.length,s:"total"}].map((x,i)=>(
            <div key={i} style={{flex:1,background:"rgba(255,255,255,0.1)",borderRadius:13,padding:"9px 6px",textAlign:"center",backdropFilter:"blur(8px)"}}>
              <p style={{fontSize:18,fontWeight:700,color:"white",fontFamily:"'Do Hyeon',sans-serif"}}>{x.v}</p>
              <p style={{fontSize:9,color:G.teal,letterSpacing:0.5}}>{x.s}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{padding:"18px 16px",maxWidth:600,margin:"0 auto"}}>

        {/* Google Fit */}
        {!fitToken?(
          <Card style={{marginBottom:16,background:`linear-gradient(135deg,rgba(200,240,232,0.5),rgba(232,214,255,0.5))`}}>
            <div style={{display:"flex",alignItems:"center",gap:11}}>
              <div style={{fontSize:24}}>💪</div>
              <div style={{flex:1}}>
                <p style={{fontSize:13,fontWeight:700,color:G.navy}}>Conectar Google Fit</p>
                <p style={{fontSize:11,color:"#999"}}>Calorías, ritmo cardíaco y actividad</p>
              </div>
              <Btn onClick={onConnectFit} small>Conectar</Btn>
            </div>
          </Card>
        ):(
          <Card style={{marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <p style={{fontSize:11,color:G.deepMint,fontWeight:700,letterSpacing:1}}>GOOGLE FIT · HOY</p>
              {fitLoading&&<div style={{width:12,height:12,border:`2px solid ${G.teal}`,borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>}
            </div>
            <div style={{display:"flex",gap:9}}>
              {[{l:"Calorías",v:fitData?.calories!=null?`${fitData.calories}`:"—",u:"kcal",icon:"🔥",c:G.coral},{l:"Freq. card.",v:fitData?.heartRate!=null?`${fitData.heartRate}`:"—",u:"bpm",icon:"❤️",c:G.sakura},{l:"Min. activos",v:fitData?.activeMinutes!=null?`${fitData.activeMinutes}`:"—",u:"min",icon:"⚡",c:G.teal}].map(m=>(
                <div key={m.l} style={{flex:1,background:`${m.c}13`,borderRadius:13,padding:"10px 7px",textAlign:"center"}}>
                  <div style={{fontSize:16,marginBottom:3}}>{m.icon}</div>
                  <p style={{fontFamily:"'Do Hyeon',sans-serif",fontSize:17,color:G.navy}}>{m.v}</p>
                  <p style={{fontSize:9,color:"#bbb",marginTop:1}}>{m.u}</p>
                  <p style={{fontSize:9,color:"#aaa"}}>{m.l}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Emotion chart */}
        {emotionLog.length>=2&&<EmotionChart emotionLog={emotionLog}/>}

        {/* Guppy tank */}
        <Card style={{marginBottom:16,background:`linear-gradient(135deg,rgba(200,240,232,0.6),rgba(232,214,255,0.6))`}}>
          <p style={{fontSize:11,color:G.deepMint,fontWeight:700,letterSpacing:1,marginBottom:9}}>TU ACUARIO DE PROGRESO</p>
          <div style={{display:"flex",alignItems:"center",gap:9}}>
            <GuppyRow count={Math.min(weekLog.length+1,5)}/>
            <p style={{fontSize:13,color:G.navy}}>{weekLog.length===0?"¡Entrena para llenar tu acuario! 🐠":`¡${weekLog.length} sesión${weekLog.length>1?"es":""} esta semana! 🥰`}</p>
          </div>
        </Card>

        {/* Start session CTA */}
        <div onClick={onStartSession} className="hov"
          style={{background:`linear-gradient(135deg,${G.teal},${G.lilac})`,borderRadius:20,padding:"20px 22px",cursor:"pointer",marginBottom:20,textAlign:"center",boxShadow:`0 6px 24px rgba(78,205,196,0.35)`}}>
          <div style={{fontSize:32,marginBottom:6}}>🏋️</div>
          <h2 style={{fontFamily:"'Do Hyeon',sans-serif",fontSize:22,color:"white",marginBottom:4}}>Iniciar sesión de hoy</h2>
          <p style={{color:"rgba(255,255,255,0.8)",fontSize:13}}>Elige fuerza, yoga, hipopresivos o meditación</p>
        </div>

        {/* Recommendations */}
        {plan?.recomendaciones&&(
          <Card style={{marginBottom:16}}>
            <p style={{fontSize:11,color:G.deepMint,fontWeight:700,letterSpacing:1,marginBottom:10}}>RECOMENDACIONES PARA TI</p>
            {plan.recomendaciones.map((r,i)=>(
              <div key={i} style={{display:"flex",gap:9,alignItems:"flex-start",marginBottom:8}}>
                <span style={{fontSize:14,flexShrink:0}}>{"🐠🐟🐡"[i]||"🐠"}</span>
                <p style={{fontSize:13,color:G.navy,lineHeight:1.5}}>{r}</p>
              </div>
            ))}
          </Card>
        )}

        {/* History */}
        {log.length>0&&(
          <>
            <h2 style={{fontFamily:"'Do Hyeon',sans-serif",fontSize:18,color:G.navy,marginBottom:11}}>Historial reciente</h2>
            <div style={{display:"flex",flexDirection:"column",gap:7}}>
              {log.slice(-5).reverse().map((e,i)=>{
                const emotEntry=emotionLog.find(em=>Math.abs(new Date(em.date)-new Date(e.date))<3600000*2);
                const emObj=emotEntry?EMOTIONS.find(x=>x.id===emotEntry.emotion):null;
                return (
                  <div key={i} style={{background:G.cardBg,borderRadius:13,padding:"11px 15px",display:"flex",justifyContent:"space-between",alignItems:"center",border:"1.5px solid rgba(184,160,232,0.15)"}}>
                    <div>
                      <p style={{fontWeight:700,color:G.navy,fontSize:14}}>{e.nombre||e.bloque}</p>
                      <p style={{fontSize:11,color:"#bbb"}}>{new Date(e.date).toLocaleDateString("es-MX",{weekday:"long",day:"numeric",month:"short"})}</p>
                      {emObj&&<p style={{fontSize:11,color:emObj.color,marginTop:2}}>{emObj.emoji} {emObj.label}</p>}
                    </div>
                    <div style={{textAlign:"right"}}>
                      <p style={{color:G.deepMint,fontWeight:700,fontSize:13}}>✅ {e.completados||"—"}/{e.total||"—"}</p>
                      <p style={{fontSize:11,color:"#bbb"}}>{Math.round((e.duracion||0)/60)} min</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── ROOT APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [screen,setScreen] = useState("auth");
  const [userId,setUserId] = useState(null);
  const [userData,setUserData] = useState(null);
  const [sessionType,setSessionType] = useState(null);
  const [pendingEmotion,setPendingEmotion] = useState(null);

  const getUsers=()=>LS.get("gf_users")||{};
  const saveUser=(uid,data)=>{const u=getUsers();u[uid]=data;LS.set("gf_users",u);};
  const reload=(uid)=>{const u=getUsers();setUserData({...u[uid]});};

  const handleAuth=(uid,ud)=>{setUserId(uid);setUserData(ud);setScreen(ud.plan?"home":"onboarding");};

  const handleOnboardingDone=(answers)=>{
    const u=getUsers();u[userId].answers=answers;LS.set("gf_users",u);setUserData(u[userId]);setScreen("generating");
  };

  const handlePlanReady=(plan)=>{
    const u=getUsers();u[userId].plan=plan;LS.set("gf_users",u);setUserData({...u[userId]});setScreen("home");
  };

  const handleStartSession=()=>setScreen("emotion");

  const handleEmotionDone=(emotionEntry)=>{
    const u=getUsers();
    u[userId].emotionLog=[...(u[userId].emotionLog||[]),emotionEntry];
    LS.set("gf_users",u);setUserData({...u[userId]});
    setPendingEmotion(emotionEntry);
    setScreen("sessionType");
  };

  const handleTypeSelect=(tipo)=>{setSessionType(tipo);setScreen("session");};

  const handleSessionComplete=(entry)=>{
    const u=getUsers();
    u[userId].log=[...(u[userId].log||[]),entry];
    LS.set("gf_users",u);setUserData({...u[userId]});
    setScreen("home");
  };

  const handleConnectFit=()=>{
    if(GOOGLE_CLIENT_ID.startsWith("TU_CLIENT_ID")){alert("⚙️ Agrega tu Google Client ID para activar Google Fit.");return;}
    const p=new URLSearchParams({client_id:GOOGLE_CLIENT_ID,redirect_uri:window.location.origin,response_type:"token",scope:GOOGLE_FIT_SCOPES,prompt:"consent"});
    const popup=window.open(`https://accounts.google.com/o/oauth2/v2/auth?${p}`,"gfit","width=500,height=600");
    const iv=setInterval(()=>{try{if(!popup||popup.closed){clearInterval(iv);return;}const h=popup.location.hash;if(h.includes("access_token")){clearInterval(iv);popup.close();const t=new URLSearchParams(h.slice(1)).get("access_token");const u=getUsers();u[userId].fitToken=t;LS.set("gf_users",u);setUserData({...u[userId]});}}catch{}},500);
  };

  return (
    <div>
      {screen==="auth"&&<AuthScreen onAuth={handleAuth}/>}
      {screen==="onboarding"&&<OnboardingScreen userData={userData} onDone={handleOnboardingDone}/>}
      {screen==="generating"&&userData&&<GeneratingScreen answers={userData.answers} onPlan={handlePlanReady}/>}
      {screen==="home"&&userData?.plan&&<HomeScreen userId={userId} userData={userData} onStartSession={handleStartSession} onLogout={()=>{setUserId(null);setUserData(null);setScreen("auth");}} onConnectFit={handleConnectFit}/>}
      {screen==="emotion"&&<EmotionCheckScreen onDone={handleEmotionDone}/>}
      {screen==="sessionType"&&<SessionTypeScreen onSelect={handleTypeSelect} onBack={()=>setScreen("home")}/>}
      {screen==="session"&&sessionType==="meditacion"&&<MeditationScreen onComplete={handleSessionComplete} onBack={()=>setScreen("sessionType")}/>}
      {screen==="session"&&sessionType==="hipopresivos"&&<HipopresivosScreen onComplete={handleSessionComplete} onBack={()=>setScreen("sessionType")}/>}
      {screen==="session"&&(sessionType==="fuerza"||sessionType==="yoga"||sessionType==="cardio")&&<ExerciseSession tipo={sessionType} onComplete={handleSessionComplete} onBack={()=>setScreen("sessionType")}/>}
    </div>
  );
}

