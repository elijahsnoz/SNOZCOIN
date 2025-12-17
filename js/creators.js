// Fetch and render creators list
// Frontend script queries the sample backend at /api/creators

async function fetchCreators(){
  try{
    const res = await fetch('/api/creators');
    if(!res.ok) throw new Error('Failed to fetch');
    const data = await res.json();
    return data;
  }catch(err){
    console.error(err);
    return [];
  }
}

function makeCard(c){
  const el = document.createElement('div');
  el.className = 'card';
  el.innerHTML = `
    <h3>${escapeHtml(c.name)}</h3>
    <p class="muted">${escapeHtml(c.bio || '')}</p>
    <p style="margin-top:0.75rem;"><a class="btn btn-ghost" href="/creator.html?slug=${encodeURIComponent(c.slug)}">View Profile</a></p>
  `;
  return el;
}

function escapeHtml(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

document.addEventListener('DOMContentLoaded', async ()=>{
  const grid = document.getElementById('creatorsGrid');
  if(!grid) return;
  grid.innerHTML = '<p class="muted">Loading creators…</p>';
  const creators = await fetchCreators();
  grid.innerHTML = '';
  if(!creators.length){
    grid.innerHTML = '<p class="muted">No creators found. Be the first to create a profile.</p>';
    return;
  }
  creators.forEach(c=>grid.appendChild(makeCard(c)));
});
