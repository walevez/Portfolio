/* ===== Utilidad DOM ===== */
const $ = (sel, ctx=document) => ctx.querySelector(sel);

/* ===== Forzar header fijo y compensación dinámica ===== */
function fixHeaderHeight(){
  const header = $(".site-header");
  const spacer = $(".header-spacer");
  if(!header || !spacer) return;

  // Altura real del encabezado (header)
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
    { id:"cpu", titulo:"CPU", rol:"Planificación, ETL, compresión, consultas paralelas.", tips:"Muchos núcleos e IPC alto.", ejemplos:["Ryzen 9 7950X","Xeon W"], foco:["data","db","inferencia"], precioRef:700 },
    { id:"gpu", titulo:"GPU", rol:"Entrenamiento e inferencia; VRAM manda.", tips:"Para entrenar: VRAM > FLOPS.", ejemplos:["RTX 4070 Ti 16GB","RTX 4090 24GB"], foco:["entrenamiento","inferencia"], precioRef:1600 },
    { id:"ram", titulo:"RAM", rol:"Datasets en memoria, VMs/containers.", tips:"32-64 GB para empezar.", ejemplos:["64 GB DDR5","128 GB DDR5"], foco:["data","db","entrenamiento"], precioRef:200 },
    { id:"storage", titulo:"Almacenamiento", rol:"NVMe para datasets, SATA para archivo frío.", tips:"Mirar IOPS y TBW.", ejemplos:["2TB NVMe Gen4","4TB SATA"], foco:["data","db"], precioRef:250 }
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
        <li><strong>Enfoque:</strong> ${c.foco.join(" \u00B7 ")}</li>
        <li><strong>Precio ref:</strong> $${c.precioRef}</li>
      </ul>
    </article>
  `).join("");
}

/* ===== Sanitizador (no hace nada: texto ya validado) ===== */
function sanitizeTextIn(container){ return; }

/* ===== Gráfico simple de almacenamiento ===== */
function drawStorageChart(){
  const canvas = document.getElementById("storageCanvas");
  if(!canvas) return;
  const prep = prepareCanvas(canvas);
  if(!prep) return;
  const {ctx, width:w, height:h} = prep;
  ctx.clearRect(0,0,w,h);

  const bg = getComputedStyle(document.documentElement).getPropertyValue("--card2") || "#10131c";
  ctx.fillStyle = bg; ctx.fillRect(0,0,w,h);

  const labels = ["HDD", "SSD SATA", "NVMe Gen3", "NVMe Gen4", "NVMe Gen5"];
  const values = [120, 550, 3200, 7000, 11000];
  const max = Math.max(...values) * 1.15;

  // Márgenes y ejes
  const plot = { left: 80, right: 20, top: 20, bottom: 40 };
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.beginPath();
  ctx.moveTo(plot.left, plot.top);
  ctx.lineTo(plot.left, h - plot.bottom);
  ctx.lineTo(w - plot.right, h - plot.bottom);
  ctx.stroke();

  // Barras posicionadas dentro del área de dibujo
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

  // Eje Y: ticks y líneas guía, con etiquetas a la izquierda del eje
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

/* ===== Gráfico de latencia (µs, menor es mejor) ===== */
function drawLatencyChart(){
  const canvas = document.getElementById("latencyCanvas");
  if(!canvas) return;
  const prep = prepareCanvas(canvas);
  if(!prep) return;
  const {ctx, width:w, height:h} = prep;
  ctx.clearRect(0,0,w,h);

  const bg = getComputedStyle(document.documentElement).getPropertyValue("--card2") || "#10131c";
  ctx.fillStyle = bg; ctx.fillRect(0,0,w,h);

  const labels = ["HDD", "SSD SATA", "NVMe Gen3", "NVMe Gen4", "NVMe Gen5"];
  // Valores aproximados en microsegundos (µs)
  const values = [4000, 100, 30, 20, 15];
  const max = Math.max(...values) * 1.15;

  // Márgenes y ejes
  const plot = { left: 80, right: 20, top: 20, bottom: 40 };
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.beginPath();
  ctx.moveTo(plot.left, plot.top);
  ctx.lineTo(plot.left, h - plot.bottom);
  ctx.lineTo(w - plot.right, h - plot.bottom);
  ctx.stroke();

  // Barras posicionadas dentro del área de dibujo
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
    ctx.fillText(values[i] + " \u00B5s", x + barW/2, (h - plot.bottom - 8) - bh);
  }

  // Eje Y: ticks y líneas guía, etiquetas a la izquierda del eje para no superponer
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
    legend.innerHTML = `<span><span class=\"dot\"></span>Latencia (\u00B5s, menor es mejor)</span>`;
  }
}

function prepareCanvas(canvas){
  if(!canvas) return null;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const targetHeight = parseInt(canvas.dataset.height || canvas.clientHeight || 320, 10);
  canvas.style.height = targetHeight + "px";
  const fallbackWidth = canvas.parentElement ? canvas.parentElement.clientWidth : 600;
  const cssWidth = canvas.clientWidth || fallbackWidth || 600;
  canvas.width = cssWidth * dpr;
  canvas.height = targetHeight * dpr;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr,0,0,dpr,0,0);
  return {ctx, width: cssWidth, height: targetHeight};
}

let chartResizeTimer = null;
window.addEventListener("resize", ()=>{
  clearTimeout(chartResizeTimer);
  chartResizeTimer = setTimeout(()=>{
    drawStorageChart();
    drawLatencyChart();
  }, 200);
}, {passive:true});

/* ===== Menú móvil (hamburguesa) ===== */
function initMobileNav(){
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.getElementById('primary-menu');
  if(!toggle || !menu) return;

  const closeSubmenus = ()=>{
    menu.querySelectorAll('.nav-item.open').forEach(item=>{
      item.classList.remove('open');
      const trigger = item.querySelector('.nav-trigger');
      if(trigger){ trigger.setAttribute('aria-expanded','false'); }
    });
  };

  toggle.addEventListener('click', ()=>{
    const isOpen = menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    if(!isOpen){ closeSubmenus(); }
  });

  // Cerrar al hacer click en un enlace (útil en móvil)
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', ()=>{
    if(menu.classList.contains('open')){
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded','false');
      closeSubmenus();
    }
  }));
}

/* ===== Submenús accesibles en desktop/móvil ===== */
function initNavSubmenus(){
  const items = document.querySelectorAll('.nav-item.has-submenu');
  if(!items.length) return;

  const closeItem = (item)=>{
    if(!item || !item.classList.contains('open')) return;
    item.classList.remove('open');
    const trigger = item.querySelector('.nav-trigger');
    if(trigger){ trigger.setAttribute('aria-expanded','false'); }
  };

  items.forEach(item=>{
    const trigger = item.querySelector('.nav-trigger');
    if(!trigger) return;
    trigger.addEventListener('click', evt=>{
      evt.preventDefault();
      const willOpen = !item.classList.contains('open');
      items.forEach(other=>{
        if(other !== item){ closeItem(other); }
      });
      if(willOpen){
        item.classList.add('open');
        trigger.setAttribute('aria-expanded','true');
      }else{
        closeItem(item);
      }
    });
  });

  document.addEventListener('click', evt=>{
    items.forEach(item=>{
      if(item.contains(evt.target)) return;
      closeItem(item);
    });
  });

  document.addEventListener('keyup', evt=>{
    if(evt.key !== 'Escape') return;
    items.forEach(closeItem);
  });
}

/* ===== Fondo de líneas sutiles ===== */
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
  // Eliminar restos de la sección antigua de almacenamiento si existiera
  const oldStorage = document.getElementById('almacenamiento-old');
  if(oldStorage && oldStorage.parentNode){ oldStorage.parentNode.removeChild(oldStorage); }
  // Quitar sección comparativa si existe
  const comp = document.getElementById('comparativa');
  if(comp && comp.parentNode){ comp.parentNode.removeChild(comp); }

  renderComponentes();
  drawStorageChart();
  drawLatencyChart();
  fixHeaderHeight(); // asegurar en load
  initMobileNav();
  initNavSubmenus();
  initCarousels();
  // Sanitizar textos visibles en secciones clave
  sanitizeTextIn(document.querySelector('.hero'));
  // Sección renovada del corazón IA
  sanitizeTextIn(document.getElementById('corazon-ia'));
  sanitizeTextIn(document.getElementById('almacenamiento-ssd'));
  sanitizeTextIn(document.getElementById('config-ml'));
  sanitizeTextIn(document.getElementById('faq'));
  sanitizeTextIn(document.querySelector('.site-footer'));
  sanitizeTextIn(document.getElementById('cardsComponentes'));

  // Mover el badge Sectigo al renglón del texto del footer
  try{
    const badge = document.getElementById('comodoTL');
    const footerText = document.querySelector('.site-footer .container > p');
    if(badge && footerText){
      // Insertar al inicio, para que quede a la izquierda del texto
      if(!footerText.contains(badge)){
        footerText.insertBefore(badge, footerText.firstChild);
      } else if(footerText.firstChild !== badge){
        footerText.insertBefore(badge, footerText.firstChild);
      }
      // Asegurar imagen dentro del enlace y estilo inline
      if(!badge.querySelector('img')){
        badge.textContent = '';
        const img = document.createElement('img');
        img.alt = 'Sectigo PositiveSSL';
        img.src = 'https://micuenta.donweb.com/img/sectigo_positive_sm.png';
        badge.appendChild(img);
      }
      badge.classList.add('footer-badge');
    }
  }catch(_){}
});

;

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
    }

    function goTo(i){
      if(slides.length === 0) return;
      const total = slides.length;
      index = ((i % total) + total) % total; // wrap both sides
      update();
    }
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

/* ===== Loader: ocultar cuando todo cargó ===== */
window.addEventListener('load', ()=>{
  const ld = document.getElementById('app-loader');
  if(ld){
    ld.classList.add('hidden');
    ld.setAttribute('aria-busy','false');
  }

  // Footer badge: ensure inline next to text, remove floating badge if injected
  try{
    // Ya usamos #comodoTL como badge; sólo limpiamos instancias sueltas
    // Hide/remove other trustlogo instances
    document.querySelectorAll('img[src*="sectigo_positive_sm"]').forEach(img => {
      if(!img.closest('.site-footer')){
        img.remove();
      }
    });
    const tl = document.getElementById('comodoTL');
    if(tl && !tl.closest('.site-footer')) tl.style.display = 'none';
  }catch(_){ }
});















