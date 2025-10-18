/* ===== Utilidad DOM ===== */
const $ = (sel, ctx=document) => ctx.querySelector(sel);

/* ===== Forzar header fijo y compensación dinámica ===== */
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
    { id:"cpu", titulo:"CPU", rol:"Planificación, ETL, compresión, consultas paralelas.", tips:"Muchos núcleos e IPC alto.", ejemplos:["Ryzen 9 7950X","Xeon W"], foco:["data","db","inferencia"], precioRef:700 },
    { id:"gpu", titulo:"GPU", rol:"Entrenamiento e inferencia; VRAM manda.", tips:"Para entrenar: VRAM > FLOPS.", ejemplos:["RTX 4070 Ti 16GB","RTX 4090 24GB"], foco:["entrenamiento","inferencia"], precioRef:1600 },
    { id:"ram", titulo:"RAM", rol:"Datasets en memoria, VMs/containers.", tips:"32–64 GB para empezar.", ejemplos:["64 GB DDR5","128 GB DDR5"], foco:["data","db","entrenamiento"], precioRef:200 },
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
        <li><strong>Enfoque:</strong> ${c.foco.join(" · ")}</li>
        <li><strong>Precio ref:</strong> $${c.precioRef}</li>
      </ul>
    </article>
  `).join("");
}

/* ===== Gráfico simple de almacenamiento ===== */
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

  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.beginPath(); ctx.moveTo(60,20); ctx.lineTo(60,h-40); ctx.lineTo(w-20,h-40); ctx.stroke();

  const barW = (w-120) / labels.length * 0.6;
  const step = (w-120) / labels.length;
  for(let i=0;i<labels.length;i++){
    const x = 80 + i*step - barW/2;
    const bh = (values[i] / max) * (h-80);
    const color = i===0 ? "#9fa7b3" : (i===1 ? "#7de2ff" : (i===2 ? "#a78bfa" : (i===3 ? "#6ee7f8" : "#d4bfff")));
    ctx.fillStyle = color;
    ctx.fillRect(x, (h-40)-bh, barW, bh);

    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = "12px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(labels[i], x + barW/2, h-20);

    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.font = "11px system-ui";
    ctx.fillText(values[i] + " MB/s", x + barW/2, (h-48)-bh);
  }

  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.textAlign = "right";
  const tick = 2000;
  for(let t=0; t<=max; t+=tick){
    const y = (h-40) - (t/max)*(h-80);
    ctx.fillText(t, 55, y+4);
    ctx.globalAlpha = 0.08; ctx.beginPath(); ctx.moveTo(60,y); ctx.lineTo(w-20,y); ctx.stroke(); ctx.globalAlpha=1;
  }

  const legend = document.getElementById("storageLegend");
  if(legend){
    legend.innerHTML = `<span><span class="dot"></span>Velocidad secuencial (MB/s)</span>`;
  }
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
  renderComponentes();
  drawStorageChart();
  fixHeaderHeight(); // asegurar en load
});
