// Creator profile frontend logic
// Loads profile by slug query param and handles tip/unlock interactions (UI only)

function qs(name){
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

async function loadProfile(){
  const slug = qs('slug');
  const root = document.getElementById('profileRoot');
  if(!slug || !root){
    root.innerHTML = '<p class="muted">No profile specified.</p>';
    return;
  }
  try{
    const res = await fetch(`/api/creator/${encodeURIComponent(slug)}`);
    if(!res.ok) throw new Error('profile not found');
    const data = await res.json();
    document.getElementById('creatorName').textContent = data.name;
    document.getElementById('creatorBio').textContent = data.bio || '';

    // Unlockables
    const ul = document.getElementById('unlockables');
    ul.innerHTML = '';
    (data.unlockables || []).forEach(u=>{
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `<h4>${escapeHtml(u.title)}</h4><p class="muted">${escapeHtml(u.description)}</p><p style="margin-top:0.75rem;"><button class=\"btn btn-primary\" data-id=\"${escapeHtml(u.id)}\">Unlock (${u.price} SNZ)</button></p>`;
      ul.appendChild(card);
    });

    // Activity (basic tip history)
    const act = document.getElementById('activity');
    act.innerHTML = '';
    (data.activity || []).forEach(a=>{
      const n = document.createElement('div'); n.className='transparency-card';
      n.innerHTML = `<p><strong>${escapeHtml(a.type)}</strong> — <span class=\"muted\">${escapeHtml(a.note)}</span></p>`;
      act.appendChild(n);
    });

    // Wire tip button
    document.getElementById('tipBtn').addEventListener('click', ()=>openTipModal(data));

    // Wire unlock buttons
    ul.querySelectorAll('button[data-id]').forEach(btn=>{
      btn.addEventListener('click', async ()=>{
        const assetId = btn.getAttribute('data-id');
        await unlockContent(slug, assetId);
      });
    });

  }catch(err){
    console.error(err);
    root.innerHTML = '<p class="muted">Failed to load profile.</p>';
  }
}

function escapeHtml(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

// Simple tip modal UI (wallet connect flow stub)
function openTipModal(profile){
  const tpl = document.getElementById('tip-modal-template');
  const node = tpl.content.cloneNode(true);
  const modal = node.querySelector('.modal');
  document.body.appendChild(modal);

  modal.querySelector('#closeTipModal').addEventListener('click', ()=>modal.remove());

  // Connect wallet button (Phantom example for Solana)
  const connectBtn = modal.querySelector('#connectWallet');
  connectBtn.addEventListener('click', async ()=>{
    if(window.solana && window.solana.isPhantom){
      try{
        await window.solana.connect();
        connectBtn.textContent = 'Connected';
        // Here you would build and send a transaction to transfer SNZ to creator
        // This is a placeholder: implement real transaction building with web3.js / @solana/web3.js
        alert('Wallet connected. Implement transaction signing in production.');
      }catch(e){
        console.error(e);
        alert('Failed to connect wallet.');
      }
    }else{
      alert('No Phantom wallet detected. For now, use the purchase link from the profile.');
    }
  });
}

async function unlockContent(slug, assetId){
  // Shows a simple flow: ask backend for a signed URL after purchaser confirms txHash
  const txHash = prompt('Enter transaction hash after paying the unlock price (or leave blank to open purchase link):');
  if(!txHash){
    alert('Open the purchase page to acquire SnozCoin and then pay the creator.');
    return;
  }
  const res = await fetch('/api/unlock/verify',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({slug,assetId,txHash})});
  const data = await res.json();
  if(res.ok){
    // data.signedUrl contains a short-lived link to the asset
    window.open(data.signedUrl,'_blank');
  }else{
    alert(data.message || 'Verification failed');
  }
}

document.addEventListener('DOMContentLoaded', loadProfile);
