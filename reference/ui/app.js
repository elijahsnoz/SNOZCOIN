const e = React.createElement;

const API = 'http://127.0.0.1:5001';

function fetchJson(path){
  return fetch(API + path).then(r=>r.json());
}

function App(){
  const [chain, setChain] = React.useState([]);
  const [mempool, setMempool] = React.useState([]);
  const [address, setAddress] = React.useState('');
  const [balance, setBalance] = React.useState(null);

  // initial load and periodic polling
  React.useEffect(()=>{
    let mounted = true;
    async function poll(){
      try{
        const c = await fetchJson('/chain');
        const m = await fetchJson('/mempool');
        const u = await fetchJson('/unsigned');
        if(!mounted) return;
        setChain(c.chain || []);
        setMempool(m.mempool || []);
        setUnsigned(u.unsigned || []);
        if(address){
          const b = await fetchJson(`/balance/${address}`);
          if(mounted) setBalance(b);
        }
      }catch(err){
        console.error(err);
      }
    }
    poll();
    const iv = setInterval(poll, 3000);
    return ()=>{ mounted = false; clearInterval(iv); };
  }, [address]);

  function lookup(){
    // force immediate fetch of balance
    if(!address) return;
    fetchJson(`/balance/${address}`).then(d=>setBalance(d)).catch(console.error);
  }

  return e('div', {className:'app'}, 
    e('h1', null, 'PMVP Visualizer (demo)'),

    e('section', {className:'panel'},
      e('h2', null, 'Chain'),
      e('ol', null, chain.map((b, i)=> e('li',{key:b.hash}, `#${i} ${b.hash.slice(0,12)} txs=${b.block.txs.length}`)))
    ),

    e('section', {className:'panel'},
      e('h2', null, 'Mempool'),
      mempool.length === 0 ? e('div', null, 'No pending transactions') : e('ol', null, mempool.map((tx, i)=> e('li',{key:i}, `tx ${i}: inputs=${(tx.inputs||[]).length} outputs=${(tx.outputs||[]).length}`)))
    ),

    e('section', {className:'panel'},
      e('h2', null, 'Unsigned tx queue'),
      unsigned.length === 0 ? e('div', null, 'No unsigned proposals') : e('ol', null, unsigned.map((tx, i)=> e('li',{key:i}, e('div', null, `proposal ${i}: inputs=${(tx.inputs||[]).length} outputs=${(tx.outputs||[]).length}`), e('pre', null, JSON.stringify(tx, null, 2)) ))),
      e('h3', null, 'Create unsigned tx (single input, single output)'),
      e('div', null,
        e('input', {placeholder:'utxo (txid:index)', id:'u_utxo'}),
        e('input', {placeholder:'amount', id:'u_amount'}),
        e('input', {placeholder:'recipient address', id:'u_recipient'}),
        e('button', {onClick: ()=>{
          const utxo = document.getElementById('u_utxo').value.trim();
          const amount = parseInt(document.getElementById('u_amount').value.trim()||'0',10);
          const recipient = document.getElementById('u_recipient').value.trim();
          if(!utxo || !recipient || !amount) return alert('provide utxo, amount, recipient');
          const [txid, idxs] = utxo.split(':');
          const tx = { inputs: [{txid: txid, index: parseInt(idxs||'0')}], outputs: [{amount: amount, pubkey_hash: recipient}] };
          fetchJson('/unsigned', {method: 'POST'}); // no-op placeholder for fetchJson
          // do raw fetch to post unsigned
          fetch('http://127.0.0.1:5001/unsigned', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(tx)}).then(r=>r.json()).then(d=>{ if(d.ok) alert('unsigned tx posted'); else alert('post failed: '+JSON.stringify(d)); }).catch(e=>alert(e));
        }}, 'Post unsigned')
      )
    ),

    e('section', {className:'panel'},
      e('h2', null, 'Lookup address'),
      e('input', {value: address, onChange: ev=>setAddress(ev.target.value), placeholder:'address'}),
      e('button', {onClick: lookup}, 'Lookup'),
      balance ? e('pre', null, JSON.stringify(balance, null, 2)) : null
    )
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(e(App));
