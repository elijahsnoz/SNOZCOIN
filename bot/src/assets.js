const path = require('path');

const ART_DIR = path.join(__dirname, '..', 'assets', 'art');
const MEME_DIR = path.join(__dirname, '..', 'assets', 'memes');

const ART = [
  { file: 'art1.png', caption: 'Genesis — Study No.1' },
  { file: 'art2.png', caption: 'Bloom — Study No.2' },
  { file: 'art3.png', caption: 'Fracture — Study No.3' },
  { file: 'art4.png', caption: 'Night Watch — Study No.4' },
  { file: 'art5.png', caption: 'Drip — Study No.5' },
  { file: 'art6.png', caption: 'Static — Study No.6' },
  { file: 'hero.png', caption: 'SNOZ — the character himself' },
];

const MEMES = [
  { file: 'meme1.png', caption: 'WHEN THE CHART WIGGLES' },
  { file: 'meme2.png', caption: 'ME EXPLAINING SNOZ TO MY FRIENDS AGAIN' },
  { file: 'meme3.png', caption: 'CAUSE WHY NOT?' },
  { file: 'meme4.png', caption: 'SNOZ NEVER SLEEPS. IT TRANSFORMS.' },
];

function pick(list, dir) {
  const item = list[Math.floor(Math.random() * list.length)];
  return { source: path.join(dir, item.file), caption: item.caption };
}

module.exports = {
  randomArt: () => pick(ART, ART_DIR),
  randomMeme: () => pick(MEMES, MEME_DIR),
};
