// Minimal interactions: mobile nav toggle, smooth scroll, reveal-on-scroll
document.addEventListener('DOMContentLoaded',function(){
  const nav = document.getElementById('nav');
  const toggle = document.getElementById('navToggle');
  toggle.addEventListener('click',()=>{nav.classList.toggle('show');toggle.classList.toggle('open');});

  // smooth anchor scroll
  document.querySelectorAll('a[href^="#"]').forEach(a=>{
    a.addEventListener('click',function(e){
      const href = this.getAttribute('href');
      if(href.length>1){
        e.preventDefault();
        const el = document.querySelector(href);
        if(el) el.scrollIntoView({behavior:'smooth',block:'start'});
        if(nav.classList.contains('show')) nav.classList.remove('show');
      }
    })
  });

  // reveal on scroll
  const revealItems = document.querySelectorAll('.reveal, .card, .token-card, .phase');
  const obs = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('visible'); obs.unobserve(e.target);} });
  },{threshold:0.12});
  revealItems.forEach(i=>obs.observe(i));

  // Animated counters when visible
  const counters = document.querySelectorAll('.counter');
  const runCounter = (el)=>{
    const target = Number(el.getAttribute('data-target')) || 0;
    const start = el.textContent.trim().replace(/[^0-9]/g,'') || 0;
    const duration = 1400;
    let startTime = null;
    const step = (timestamp)=>{
      if(!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration,1);
      const value = Math.floor(progress * target);
      if(el.textContent.trim().startsWith('$')){
        el.textContent = '$' + value.toLocaleString();
      } else {
        el.textContent = value.toLocaleString();
      }
      if(progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const counterObserver = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){ runCounter(entry.target); counterObserver.unobserve(entry.target); }
    });
  },{threshold:0.2});
  counters.forEach(c=>counterObserver.observe(c));

  // Roadmap progress fills
  document.querySelectorAll('.phase').forEach(p=>{
    const fill = p.querySelector('.progress-fill');
    const val = Number(p.getAttribute('data-progress') || 0);
    if(fill){ setTimeout(()=>{ fill.style.width = val + '%'; }, 350); }
  });

  // Ensure the Whitepaper CTA is a proper download link (force-download via `download` attr)
  const openWP = document.getElementById('openWhitepaper');
  if(openWP){
    try{
      openWP.setAttribute('href','/assets/SNOZCOIN_whitepaper.pdf');
      openWP.setAttribute('download','SNOZCOIN_whitepaper.pdf');
    }catch(e){ /* noop */ }
  }
});
