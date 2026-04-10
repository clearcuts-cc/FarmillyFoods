const fs = require('fs');

// Read the file as binary buffer
const raw = fs.readFileSync('d:/Farmily Web/app.js');

// Find where the corruption starts - look for null bytes after line 1359
// Find the last legitimate line ending before the corruption
const content = raw.toString('utf8');

// The last good line is the closing }; of showProduct 
// Find that and truncate everything after it
const lastGoodEnding = "};\r\n";
const lastGoodIdx = content.lastIndexOf("window.showProduct = function");
console.log('showProduct found at:', lastGoodIdx);

// Find the end of the showProduct function
const fnEnd = content.indexOf("};\r\n", lastGoodIdx);
console.log('Function end at:', fnEnd);

if (fnEnd > 0) {
  // Keep everything up to and including that };\r\n
  const good = content.substring(0, fnEnd + 4);
  
  // Now add the marquee code cleanly 
  const marqueeCode = `
function setupMobileMarquee() {
  const trowNode = document.querySelector('.trow');
  if (trowNode && window.innerWidth < 900 && !trowNode.classList.contains('marquee-enabled')) {
    trowNode.classList.add('marquee-enabled');
    const wrapper = document.createElement('div');
    wrapper.style.overflow = 'hidden';
    wrapper.style.width = '100%';
    trowNode.parentNode.insertBefore(wrapper, trowNode);
    wrapper.appendChild(trowNode);
    const children = Array.from(trowNode.children);
    children.forEach(c => {
      const clone = c.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      trowNode.appendChild(clone);
    });
    trowNode.style.width = 'max-content';
    trowNode.style.overflowX = 'visible';
    trowNode.style.animation = 'marqueeMob 20s linear infinite';
    const style = document.createElement('style');
    style.textContent = '@keyframes marqueeMob { 0% { transform: translateX(0); } 100% { transform: translateX(calc(-50% - 12px)); } } .trow:active { animation-play-state: paused !important; }';
    document.head.appendChild(style);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupMobileMarquee);
} else {
  setupMobileMarquee();
}
`;

  const final = good + marqueeCode;
  fs.writeFileSync('d:/Farmily Web/app.js', final, 'utf8');
  console.log('SUCCESS: Cleaned corruption and wrote file. Total lines:', final.split('\n').length);
} else {
  console.log('ERROR: Could not find end of showProduct function');
}
