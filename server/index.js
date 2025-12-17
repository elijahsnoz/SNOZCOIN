const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend files (for local dev)
app.use('/', express.static(path.resolve(__dirname, '..')));

// In-memory sample data (replace with persistent DB in production)
const creators = [
  { slug: 'luna-arts', name: 'Luna Arts', bio: 'Digital painter and animator.', unlockables: [{id:'u1',title:'Behind the Scenes Pack',description:'High-res files and process videos',price:5}], activity:[{type:'Tip',note:'Received 3 tips today'}]},
  { slug: 'beatforge', name: 'BeatForge', bio: 'Electronic music producer.', unlockables: [{id:'u2',title:'Sample Pack Vol.1',description:'Exclusive samples for producers',price:3}], activity:[{type:'Tip',note:'Live show tips incoming'}]},
];

app.get('/api/creators', (req,res)=>{
  res.json(creators.map(c=>({slug:c.slug,name:c.name,bio:c.bio}))); 
});

app.get('/api/creator/:slug', (req,res)=>{
  const c = creators.find(x=>x.slug===req.params.slug);
  if(!c) return res.status(404).json({message:'Not found'});
  res.json(c);
});

// Endpoint: verify an unlock purchase by txHash and return a signed URL
app.post('/api/unlock/verify', (req,res)=>{
  const {slug, assetId, txHash} = req.body || {};
  if(!slug || !assetId || !txHash) return res.status(400).json({message:'Missing parameters'});

  // In a real system: verify txHash on-chain (indexer) that it sent the required amount
  // Here we accept any txHash for demo and return a signed URL with short expiry

  const token = crypto.randomBytes(18).toString('hex');
  const signedUrl = `${req.protocol}://${req.get('host')}/assets/sample-unlocked-content.pdf?token=${token}`;

  // In production, store token with expiry and validate when serving the asset
  return res.json({signedUrl});
});

// Example endpoint to exchange a token for content (not secure — demo only)
app.get('/assets/sample-unlocked-content.pdf', (req,res)=>{
  // In production validate req.query.token against DB and expiry
  // Here we just return a placeholder file if present in assets folder
  const filePath = path.resolve(__dirname, '..', 'assets', 'SNOZCOIN_whitepaper.pdf');
  res.sendFile(filePath);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log('SnozCoin demo backend running on', PORT));
