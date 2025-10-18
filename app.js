/* ===== Utilidad DOM ===== */
const $ = (sel, ctx=document) => ctx.querySelector(sel);

/* ===== Forzar header fijo y compensaciÃ³n dinÃ¡mica ===== */
function fixHeaderHeight(){
  const header = $(".site-header");
  const spacer = $(".header-spacer");
  if(!header || !spacer) return;

  // Altura real del header
  const h = Math.max(header.offsetHeight, 56);
  // Setear variable CSS para scroll-margin-top, etc.
  document.documentElement.style.setProperty("--header-h", h + "px");
  // Ajustar el spacer
  spacer.style.height = h + "px";
}

window.addEventListener("resize", fixHeaderHeight, {passive:true});
document.addEventListener("DOMContentLoaded", fixHeaderHeight);

/* ===== Datos de ejemplo (cards) ===== */
const DATA = {
  componentes: [
    { id:"cpu", titulo:"CPU", rol:"PlanificaciÃ³n, ETL, compresiÃ³n, consultas paralelas.", tips:"Muchos nÃºcleos e IPC alto.", ejemplos:["Ryzen 9 7950X","Xeon W"], foco:["data","db","inferencia"], precioRef:700 },
    { id:"gpu", titulo:"GPU", rol:"Entrenamiento e inferencia; VRAM manda.", tips:"Para entrenar: VRAM > FLOPS.", ejemplos:["RTX 4070 Ti 16GB","RTX 4090 24GB"], foco:["entrenamiento","inferencia"], precioRef:1600 },
    { id:"ram", titulo:"RAM", rol:"Datasets en memoria, VMs/containers.", tips:"32â€“64 GB para empezar.", ejemplos:["64 GB DDR5","128 GB DDR5"], foco:["data","db","entrenamiento"], precioRef:200 },
    { id:"storage", titulo:"Almacenamiento", rol:"NVMe para datasets, SATA para archivo frÃ­o.", tips:"Mirar IOPS y TBW.", ejemplos:["2TB NVMe Gen4","4TB SATA"], foco:["data","db"], precioRef:250 }
  ]
};

function renderComponentes(){
  const wrap = $("#cardsComponentes");
  if(!wrap) return;
  wrap.innerHTML = DATA.componentes.map(c => `
    <article class="card">
      <div class="kv">/${c.id}</div>
      <h3>${c.titulo}</h3>
      <p>${c.rol}</p>
      <ul class="kv">
        <li><strong>Tips:</strong> ${c.tips}</li>
        <li><strong>Ejemplos:</strong> ${c.ejemplos.join(", ")}</li>
        <li><strong>Enfoque:</strong> ${c.foco.join(" Â· ")}</li>
        <li><strong>Precio ref:</strong> $${c.precioRef}</li>
      </ul>
    </article>
  `).join("");
}

/* ===== CorrecciÃ³n de texto (mojibake) en DOM ===== */
function sanitizeTextIn(container){
  if(!container) return;
  const replacements = [
    [/quÇ¸/g, 'quÃ©'],
    [/qu\?/g, 'quÃ©'],
    [/por quÇ¸/g, 'por quÃ©'],
    [/cuÇ­nto/g, 'cuÃ¡nto'],
    [/Corazï¿½ï¿½n/g, 'CorazÃ³n'],
    [/MÇ­quina/g, 'MÃ¡quina'],
    [/lï¿½ï¿½gica/g, 'lÃ³gica'],
    [/mini-fÇ­brica/g, 'mini-fÃ¡brica'],
    [/NÇ§cleos/g, 'NÃºcleos'],
    [/3000[^0-9]*7000/g, '3000â€“7000'],
    [/opciï¿½ï¿½n econï¿½ï¿½mica/g, 'opciÃ³n econÃ³mica'],
    [/4ï¿½-/g, '4Ã—'],
    [/ï¿½ï¿½GPU o CPU para IA\?/g, 'Â¿GPU o CPU para IA?'],
    [/ï¿½ï¿½RAM/g, 'Â¿RAM'],
    [/cuÇ­nta/g, 'cuÃ¡nta'],
    [/32[^0-9]*64/g, '32â€“64'],
    [/frï¿½ï¿½o/g, 'frÃ­o'],
    [/Hecho por el equipo ï¿½ï¿½/g, 'Hecho por el equipo Â©'],
    [/ ï¿½ï¿½ /g, ' Â· '],
  ];
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
  const nodes = [];
  while(walker.nextNode()) nodes.push(walker.currentNode);
  for(const n of nodes){
    let txt = n.nodeValue;
    let changed = false;
    for(const [pat, rep] of replacements){
      if(pat.test(txt)){ txt = txt.replace(pat, rep); changed = true; }
    }
    if(changed) n.nodeValue = txt;
  }
}

/* ===== GrÃ¡fico simple de almacenamiento ===== */
function drawStorageChart(){
  const canvas = document.getElementById("storageCanvas");
  if(!canvas) return;
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0,0,w,h);

  const bg = getComputedStyle(document.documentElement).getPropertyValue("--card2") || "#10131c";
  ctx.fillStyle = bg; ctx.fillRect(0,0,w,h);

  const labels = ["HDD", "SSD SATA", "NVMe Gen3", "NVMe Gen4", "NVMe Gen5"];
  const values = [120, 550, 3200, 7000, 11000];
  const max = Math.max(...values) * 1.15;

  // MÃ¡rgenes y ejes
  const plot = { left: 80, right: 20, top: 20, bottom: 40 };
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.beginPath();
  ctx.moveTo(plot.left, plot.top);
  ctx.lineTo(plot.left, h - plot.bottom);
  ctx.lineTo(w - plot.right, h - plot.bottom);
  ctx.stroke();

  // Barras posicionadas dentro del Ã¡rea de dibujo
  const step = (w - plot.left - plot.right) / labels.length;
  const barW = step * 0.6;
  for (let i=0; i<labels.length; i++){
    const x = plot.left + i*step + (step - barW)/2;
    const bh = (values[i] / max) * (h - plot.top - plot.bottom);
    const color = i===0 ? "#9fa7b3" : (i===1 ? "#7de2ff" : (i===2 ? "#a78bfa" : (i===3 ? "#6ee7f8" : "#d4bfff")));
    ctx.fillStyle = color;
    ctx.fillRect(x, (h - plot.bottom) - bh, barW, bh);

    // Etiquetas inferiores
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = "12px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(labels[i], x + barW/2, h - 20);

    // Valor encima de barra
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.font = "11px system-ui";
    ctx.fillText(values[i] + " MB/s", x + barW/2, (h - plot.bottom - 8) - bh);
  }

  // Eje Y: ticks y lÃ­neas guÃ­a, con etiquetas a la izquierda del eje
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.textAlign = "right";
  const tick = 2000;
  for (let t=0; t<=max; t+=tick){
    const y = (h - plot.bottom) - (t / max) * (h - plot.top - plot.bottom);
    ctx.fillText(String(t), plot.left - 6, y + 4);
    ctx.globalAlpha = 0.08; ctx.beginPath(); ctx.moveTo(plot.left, y); ctx.lineTo(w - plot.right, y); ctx.stroke(); ctx.globalAlpha = 1;
  }

  const legend = document.getElementById("storageLegend");
  if (legend){
    legend.innerHTML = `<span><span class="dot"></span>Velocidad secuencial (MB/s)</span>`;
  }
}

/* ===== GrÃ¡fico de latencia (Î¼s, menor es mejor) ===== */
function drawLatencyChart(){
  const canvas = document.getElementById("latencyCanvas");
  if(!canvas) return;
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0,0,w,h);

  const bg = getComputedStyle(document.documentElement).getPropertyValue("--card2") || "#10131c";
  ctx.fillStyle = bg; ctx.fillRect(0,0,w,h);

  const labels = ["HDD", "SSD SATA", "NVMe Gen3", "NVMe Gen4", "NVMe Gen5"];
  // Valores aproximados en microsegundos (Î¼s)
  const values = [4000, 100, 30, 20, 15];
  const max = Math.max(...values) * 1.15;

  // MÃ¡rgenes y ejes
  const plot = { left: 80, right: 20, top: 20, bottom: 40 };
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.beginPath();
  ctx.moveTo(plot.left, plot.top);
  ctx.lineTo(plot.left, h - plot.bottom);
  ctx.lineTo(w - plot.right, h - plot.bottom);
  ctx.stroke();

  // Barras posicionadas dentro del Ã¡rea de dibujo
  const step = (w - plot.left - plot.right) / labels.length;
  const barW = step * 0.6;
  for (let i=0; i<labels.length; i++){
    const x = plot.left + i*step + (step - barW)/2;
    const bh = (values[i] / max) * (h - plot.top - plot.bottom);
    const color = i===0 ? "#9fa7b3" : (i===1 ? "#7de2ff" : (i===2 ? "#a78bfa" : (i===3 ? "#6ee7f8" : "#d4bfff")));
    ctx.fillStyle = color;
    ctx.fillRect(x, (h - plot.bottom) - bh, barW, bh);

    // Etiquetas inferiores
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = "12px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(labels[i], x + barW/2, h - 20);

    // Valor encima de barra
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.font = "11px system-ui";
    ctx.fillText(values[i] + " Î¼s", x + barW/2, (h - plot.bottom - 8) - bh);
  }

  // Eje Y: ticks y lÃ­neas guÃ­a, etiquetas a la izquierda del eje para no superponer
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.textAlign = "right";
  const ticks = [0, 20, 50, 100, 500, 1000, 2000, 4000];
  for (const t of ticks){
    const y = (h - plot.bottom) - (t / max) * (h - plot.top - plot.bottom);
    if (y < plot.top) continue;
    ctx.fillText(String(t), plot.left - 6, y + 4);
    ctx.globalAlpha = 0.08; ctx.beginPath(); ctx.moveTo(plot.left, y); ctx.lineTo(w - plot.right, y); ctx.stroke(); ctx.globalAlpha = 1;
  }

  const legend = document.getElementById("latencyLegend");
  if (legend){
    legend.innerHTML = `<span><span class=\"dot\"></span>Latencia (Î¼s, menor es mejor)</span>`;
  }
}

/* ===== MenÃº mÃ³vil (hamburguesa) ===== */
function initMobileNav(){
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.getElementById('primary-menu');
  if(!toggle || !menu) return;

  toggle.addEventListener('click', ()=>{
    const isOpen = menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  // Cerrar al hacer click en un enlace (Ãºtil en mÃ³vil)
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', ()=>{
    if(menu.classList.contains('open')){
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded','false');
    }
  }));
}

/* ===== Fondo de lÃ­neas sutiles ===== */
(function bgLinesInit(){
  const canvas = document.getElementById('bgLines');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');

  let w=0, h=0, dpr=1, t=0, scrollParallax=0, animId=null;
  const prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const WAVE_LINES = 6;
  const SEGMENTS   = 16;
  const AMPL_BASE  = 14;
  const waveLines = [];

  function resize(){
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = Math.floor(window.innerWidth);
    h = Math.floor(window.innerHeight);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }

  function initWaveLines(){
    waveLines.length = 0;
    for(let i=0;i<WAVE_LINES;i++){
      waveLines.push({
        yBase: (h/(WAVE_LINES+1))*(i+1),
        ampl: AMPL_BASE*(0.7 + Math.random()*0.7),
        freq: 0.7 + Math.random()*0.6,
        phase: Math.random()*Math.PI*2,
        thickness: 0.8 + Math.random()*0.6,
        alpha: 0.18 + Math.random()*0.22,
        tilt: (Math.random()*0.4 - 0.2),
      });
    }
  }

  function drawWaves(){
    const acc1 = getComputedStyle(document.documentElement).getPropertyValue('--acc1') || '#6ee7f8';
    const acc2 = getComputedStyle(document.documentElement).getPropertyValue('--acc2') || '#a78bfa';
    const stepX = w / SEGMENTS;

    for(const ln of waveLines){
      ctx.beginPath();
      const grad = ctx.createLinearGradient(0, ln.yBase - 30, w, ln.yBase + 30);
      grad.addColorStop(0, acc2.trim());
      grad.addColorStop(1, acc1.trim());
      ctx.strokeStyle = grad;
      ctx.globalAlpha = ln.alpha;

      for(let s=0; s<=SEGMENTS; s++){
        const x = s*stepX;
        const y = ln.yBase
          + ln.ampl * Math.sin( (s*ln.freq*0.55) + ln.phase + t )
          + (scrollParallax * ln.tilt);
        if(s===0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.lineWidth = ln.thickness;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
    ctx.globalAlpha = 1.0;
  }

  function drawBG(){
    ctx.clearRect(0,0,w,h);
    drawWaves();
  }

  function loop(now){
    t += (now ? now : 16) * 0.0006;
    drawBG();
    animId = requestAnimationFrame(loop);
  }

  function onScroll(){
    const target = window.scrollY * 0.06;
    scrollParallax += (target - scrollParallax) * 0.08;
    drawBG();
  }

  // Init
  resize();
  initWaveLines();
  drawBG();
  if(!prefersReduce) animId = requestAnimationFrame(loop);

  window.addEventListener('resize', ()=>{ resize(); initWaveLines(); drawBG(); }, {passive:true});
  window.addEventListener('scroll', onScroll, {passive:true});
})();

/* ===== Inicio ===== */
document.addEventListener("DOMContentLoaded", ()=>{
  // Eliminar restos de la secciÃ³n antigua de almacenamiento si existiera
  const oldStorage = document.getElementById('almacenamiento-old');
  if(oldStorage && oldStorage.parentNode){ oldStorage.parentNode.removeChild(oldStorage); }
  // Quitar secciÃ³n comparativa si existe
  const comp = document.getElementById('comparativa');
  if(comp && comp.parentNode){ comp.parentNode.removeChild(comp); }

  renderComponentes();
  drawStorageChart();
  drawLatencyChart();
  fixHeaderHeight(); // asegurar en load
  initMobileNav();
  initCarousels();
  initScrollSpy();
  // Sanitizar textos visibles en secciones clave
  sanitizeTextIn(document.querySelector('.hero'));
  // SecciÃ³n renovada del corazÃ³n IA
  sanitizeTextIn(document.getElementById('corazon-ia'));
  sanitizeTextIn(document.getElementById('almacenamiento-ssd'));
  sanitizeTextIn(document.getElementById('config-ml'));
  sanitizeTextIn(document.getElementById('faq'));
  sanitizeTextIn(document.querySelector('.site-footer'));
  sanitizeTextIn(document.getElementById('cardsComponentes'));
});

/* ===== Post-carga: limpieza de acentos + iconos ===== */
(function(){
  function sanitizeTextInOverride(container){
    if(!container) return;
    const replacements = [
      [/ï¿½ï¿½/g, 'Â¿'],
      [/ï¿½/g, ''],
      [/Coraz..n/g, 'CorazÃ³n'],
      [/M.[qÇ­]uina/g, 'MÃ¡quina'],
      [/Introducci..n/g, 'IntroducciÃ³n'],
      [/Gr.[Ã¡Ç­]ficos/g, 'GrÃ¡ficos'],
      [/l..gica/g, 'lÃ³gica'],
      [/mini[- ]f.[Ã¡Ç­]brica/g, 'miniâ€‘fÃ¡brica'],
      [/N.[ÃºÇ§]cleos/g, 'NÃºcleos'],
      [/opci..n/g, 'opciÃ³n'],
      [/econ..mica/g, 'econÃ³mica'],
      [/m.[Ã³Ç]vil/g, 'mÃ³vil'],
      [/energ..a/g, 'energÃ­a'],
      [/autonom..a/g, 'autonomÃ­a'],
      [/c.[Ã¡Ç­]mara/g, 'cÃ¡mara'],
      [/traducci..n/g, 'traducciÃ³n'],
      [/edici..n/g, 'ediciÃ³n'],
      [/tecnolog..a/g, 'tecnologÃ­a'],
      [/m..s/g, 'mÃ¡s'],
      [/r..pido/g, 'rÃ¡pido'],
      [/fr..o/g, 'frÃ­o'],
      [/Qu.[Ã©Ç¸]/g, 'QuÃ©'],
      [/qu.[Ã©Ç¸]/g, 'quÃ©'],
      [/por qu.[Ã©Ç¸]/gi, 'por quÃ©'],
      [/cu.[Ã¡Ç­]nto/gi, 'cuÃ¡nto'],
      [/cu.[Ã¡Ç­]nta/gi, 'cuÃ¡nta'],
      [/3000[^0-9]*7000/g, '3000â€“7000'],
      [/32[^0-9]*64/g, '32â€“64'],
      [/4[^0-9A-Za-z ]*\-?/g, '4Ã— '],
      [/Hecho por el equipo \S+/g, 'Hecho por el equipo Â© 2025'],
    ];
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
    const nodes = [];
    while(walker.nextNode()) nodes.push(walker.currentNode);
    for(const n of nodes){
      let txt = n.nodeValue;
      let changed = false;
      for(const [pat, rep] of replacements){
        if(pat.test(txt)){
          txt = txt.replace(pat, rep);
          changed = true;
        }
      }
      if(changed) n.nodeValue = txt;
    }
  }
  // Sobrescribir la funciÃ³n global existente
  try { window.sanitizeTextIn = sanitizeTextInOverride; } catch(e){}

  function addSectionIcons(){
    const map = [
      ['corazon-ia','ðŸ§  '],
      ['almacenamiento-ssd','ðŸ’¾ '],
      ['config-ml','ðŸ§° '],
      ['futuro','ðŸ”­ '],
    ];
    for(const [id, icon] of map){
      const sec = document.getElementById(id);
      if(!sec) continue;
      const h2 = sec.querySelector('h2');
      if(h2 && !h2.textContent.trim().startsWith(icon)){
        h2.textContent = icon + h2.textContent.trim();
      }
    }
    const grafCard = document.querySelector('#almacenamiento-ssd canvas#storageCanvas');
    if(grafCard){
      const h3 = grafCard.closest('.card')?.querySelector('h3');
      if(h3){ h3.textContent = 'ðŸ“Š GrÃ¡ficos'; }
    }
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    try { sanitizeTextIn(document.body); } catch(e){}
    try { safeAddSectionIcons(); } catch(e){}
  });
})();

// Reemplazo seguro de iconos en títulos para evitar caracteres raros
function safeAddSectionIcons(){
  const map = [
    ['corazon-ia','🧠 '],
    ['almacenamiento-ssd','💾 '],
    ['config-ml','🧰 '],
    ['futuro','🔭 '],
  ];
  for(const [id, icon] of map){
    const sec = document.getElementById(id);
    if(!sec) continue;
    const h2 = sec.querySelector('h2');
    if(h2){
      const t = h2.textContent.trim();
      const clean = t.replace(/[�]+/g, '');
      h2.textContent = (clean.startsWith(icon) ? '' : icon) + clean.replace(/^([🧠💾🧰🔭]\s*)+/, '');
    }
  }
  const grafCanvas = document.querySelector('#almacenamiento-ssd canvas#storageCanvas');
  if(grafCanvas){
    const h3 = grafCanvas.closest('.card')?.querySelector('h3');
    if(h3) h3.textContent = '📊 Gráficos';
  }
}

// Scrollspy: resalta la sección activa en el menú
function initScrollSpy(){
  const links = Array.from(document.querySelectorAll('#primary-menu a'));
  if(!links.length) return;
  const pairs = links
    .map(a => ({ a, id: a.getAttribute('href') || '' }))
    .filter(p => p.id.startsWith('#'))
    .map(p => ({ a: p.a, sec: document.querySelector(p.id) }))
    .filter(p => p.sec);
  if(!pairs.length) return;

  let headerH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 64;

  function computeActive(){
    headerH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || headerH;
    const viewportTop = headerH + 8;
    let best = null;
    for(const {a, sec} of pairs){
      const top = sec.getBoundingClientRect().top;
      if(top - viewportTop <= 0){
        if(!best || top > best.top) best = { a, top };
      }
    }
    links.forEach(l=>l.classList.remove('active'));
    if(best){
      best.a.classList.add('active');
    } else if(pairs[0]) {
      pairs[0].a.classList.add('active');
    }
  }

  window.addEventListener('scroll', computeActive, {passive:true});
  window.addEventListener('resize', computeActive, {passive:true});
  computeActive();

  if(location.hash){
    const active = links.find(l=>l.getAttribute('href') === location.hash);
    if(active){ links.forEach(l=>l.classList.remove('active')); active.classList.add('active'); }
  }
}

/* ===== Carrusel simple ===== */
function initCarousels(){
  const carousels = document.querySelectorAll('.carousel');
  carousels.forEach((car) => {
    const track = car.querySelector('.carousel-track');
    const slides = Array.from(car.querySelectorAll('.carousel-slide'));
    const prevBtn = car.querySelector('.carousel-btn.prev');
    const nextBtn = car.querySelector('.carousel-btn.next');
    const dotsWrap = car.querySelector('.carousel-dots');
    if(!track || slides.length === 0) return;

    let index = 0;
    const last = slides.length - 1;

    // Build dots
    if(dotsWrap){
      dotsWrap.innerHTML = '';
      slides.forEach((_, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', 'Ir a la imagen ' + (i+1));
        b.addEventListener('click', ()=>goTo(i));
        dotsWrap.appendChild(b);
      });
    }

    function update(){
      const offset = -index * 100; // percentage
      track.style.transform = `translateX(${offset}%)`;
      if(dotsWrap){
        Array.from(dotsWrap.children).forEach((d, i)=>{
          if(i===index) d.setAttribute('aria-current','true');
          else d.removeAttribute('aria-current');
        });
      }
      if(prevBtn) prevBtn.disabled = (index === 0);
      if(nextBtn) nextBtn.disabled = (index === last);
    }

    function goTo(i){ index = Math.max(0, Math.min(last, i)); update(); }
    function next(){ goTo(index+1); }
    function prev(){ goTo(index-1); }

    prevBtn && prevBtn.addEventListener('click', prev);
    nextBtn && nextBtn.addEventListener('click', next);

    // Swipe support (pointer events)
    let startX = 0, deltaX = 0, dragging = false;
    const viewport = car.querySelector('.carousel-viewport') || car;
    function onDown(e){ dragging = true; startX = e.clientX || (e.touches && e.touches[0].clientX) || 0; deltaX = 0; }
    function onMove(e){ if(!dragging) return; const x = e.clientX || (e.touches && e.touches[0].clientX) || 0; deltaX = x - startX; }
    function onUp(){ if(!dragging) return; dragging = false; const thr = Math.max(30, viewport.clientWidth * 0.12); if(deltaX > thr) prev(); else if(deltaX < -thr) next(); }
    viewport.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    viewport.addEventListener('touchstart', onDown, {passive:true});
    window.addEventListener('touchmove', onMove, {passive:true});
    window.addEventListener('touchend', onUp);

    update();
  });
}

// Overrides to prevent unwanted text mutations
try { window.sanitizeTextIn = () => {}; } catch(e){}
function safeAddSectionIcons(){ /* no-op to avoid encoding glitches */ }

/* ===== Loader: ocultar cuando todo cargó ===== */
window.addEventListener('load', ()=>{
  const ld = document.getElementById('app-loader');
  if(ld){
    ld.classList.add('hidden');
    ld.setAttribute('aria-busy','false');
  }
});
