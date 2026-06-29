const fs = require('fs');
const path = require('path');

const BASE = 'c:/Users/mingmu/Desktop/第二学年/Web/stitch_ktv_wx';

function svgToDataUri(svg) {
  return 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
}

const ICONS = {
  mic: svgToDataUri('<svg viewBox="0 0 48 48" fill="none" stroke="#0369A1" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><rect x="16" y="4" width="16" height="24" rx="8"/><path d="M10 22c0 6.6 5.4 12 12 12s12-5.4 12-12"/><line x1="24" y1="34" x2="24" y2="42"/><line x1="18" y1="42" x2="30" y2="42"/></svg>'),
  user: svgToDataUri('<svg viewBox="0 0 24 24" fill="none" stroke="#86868b" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg>'),
  lock: svgToDataUri('<svg viewBox="0 0 24 24" fill="none" stroke="#86868b" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="11" width="18" height="10" rx="3"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>'),
  search: svgToDataUri('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>'),
  searchGray: svgToDataUri('<svg viewBox="0 0 24 24" fill="none" stroke="#86868b" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>'),
  menu: svgToDataUri('<svg viewBox="0 0 24 24" fill="none" stroke="#1d1d1f" stroke-width="1.8" stroke-linecap="round" xmlns="http://www.w3.org/2000/svg"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>'),
  mail: svgToDataUri('<svg viewBox="0 0 24 24" fill="none" stroke="#1d1d1f" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>'),
  back: svgToDataUri('<svg viewBox="0 0 24 24" fill="none" stroke="#1d1d1f" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><polyline points="15 18 9 12 15 6"/></svg>'),
  dots: svgToDataUri('<svg viewBox="0 0 24 24" fill="#1d1d1f" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>'),
  prev: svgToDataUri('<svg viewBox="0 0 24 24" fill="#86868b" xmlns="http://www.w3.org/2000/svg"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>'),
  next: svgToDataUri('<svg viewBox="0 0 24 24" fill="#86868b" xmlns="http://www.w3.org/2000/svg"><path d="M16 18h2V6h-2zM6 18l8.5-6L6 6z"/></svg>'),
  play: svgToDataUri('<svg viewBox="0 0 24 24" fill="#fff" xmlns="http://www.w3.org/2000/svg"><polygon points="8,5 19,12 8,19"/></svg>'),
  pause: svgToDataUri('<svg viewBox="0 0 24 24" fill="#fff" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>'),
  close: svgToDataUri('<svg viewBox="0 0 24 24" fill="none" stroke="#1d1d1f" stroke-width="1.8" stroke-linecap="round" xmlns="http://www.w3.org/2000/svg"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'),
  heartStroke: svgToDataUri('<svg viewBox="0 0 24 24" fill="none" stroke="#86868b" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>'),
  heartFill: svgToDataUri('<svg viewBox="0 0 24 24" fill="#ec4899" stroke="#ec4899" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>'),
  phone: svgToDataUri('<svg viewBox="0 0 24 24" fill="none" stroke="#86868b" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>'),
  envelope: svgToDataUri('<svg viewBox="0 0 24 24" fill="none" stroke="#86868b" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>'),
  tag: svgToDataUri('<svg viewBox="0 0 24 24" fill="none" stroke="#86868b" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>'),
  trash: svgToDataUri('<svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>'),
  music: svgToDataUri('<svg viewBox="0 0 24 24" fill="#0EA5E9" xmlns="http://www.w3.org/2000/svg"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>'),
};

// Write utils/icons.js
let iconsOutput = '// SVG icon data URIs - auto-generated by scripts/replace-svgs.js\n';
iconsOutput += '// Usage in WXML: <image class="icon" src="{{ICONS.mic}}" mode="aspectFit"/>\n';
iconsOutput += 'const ICONS = {\n';
for (const [key, uri] of Object.entries(ICONS)) {
  iconsOutput += `  ${key}: '${uri}',\n`;
}
iconsOutput += '};\n\nmodule.exports = ICONS;\n';
fs.writeFileSync(path.join(BASE, 'utils/icons.js'), iconsOutput);
console.log('Wrote utils/icons.js');

// Find all SVGs in text and replace based on context
function replaceSvgsInText(text, fileName) {
  const results = [];
  let searchPos = 0;

  while (true) {
    const svgStart = text.indexOf('<svg', searchPos);
    if (svgStart === -1) break;

    // Find end of opening tag
    const openTagEnd = text.indexOf('>', svgStart);
    if (openTagEnd === -1) break;

    // Find closing tag
    const closeTag = text.indexOf('</svg>', openTagEnd);
    if (closeTag === -1) break;

    const svgEnd = closeTag + 6;
    const svgContent = text.substring(svgStart, svgEnd);

    // Extract viewBox for identification
    const viewBoxMatch = svgContent.match(/viewBox="([^"]+)"/);
    const viewBox = viewBoxMatch ? viewBoxMatch[1] : '';

    // Determine replacement icon based on viewBox + content
    let icon = null;

    if (viewBox === '0 0 48 48') {
      icon = ICONS.mic;
    } else if (viewBox === '0 0 24 24') {
      if (svgContent.includes('cx="11"') && svgContent.includes('r="8"')) {
        icon = svgContent.includes('#86868b') ? ICONS.searchGray : ICONS.search;
      } else if (svgContent.includes('cx="12"') && svgContent.includes('r="4"') && svgContent.includes('circle')) {
        icon = ICONS.user;
      } else if (svgContent.includes('rect x="3"') && svgContent.includes('rect x="3" y="11"')) {
        icon = ICONS.lock;
      } else if (svgContent.includes('rect x="5"') && svgContent.includes('rx="2"')) {
        icon = ICONS.phone;
      } else if (svgContent.includes('"M4 4h16c1.1') && svgContent.includes('polyline')) {
        // envelope/mail - check stroke color
        icon = svgContent.includes('stroke="#1d1d1f"') ? ICONS.mail : ICONS.envelope;
      } else if (svgContent.includes('"M20.59')) {
        icon = ICONS.tag;
      } else if (svgContent.includes('"M19 6v14')) {
        icon = ICONS.trash;
      } else if (svgContent.includes('<line') && svgContent.includes('x1="3"') && svgContent.includes('x2="21"')) {
        icon = ICONS.menu;
      } else if (svgContent.includes('<polyline points="15 18')) {
        icon = ICONS.back;
      } else if (svgContent.includes('circle cx="12" cy="5"')) {
        icon = ICONS.dots;
      } else if (svgContent.includes('M20.84')) {
        // Heart - check if liked
        if (svgContent.includes("isLiked ? '#ec4899'")) {
          icon = `{{isLiked ? '${ICONS.heartFill}' : '${ICONS.heartStroke}'}}`;
        } else if (svgContent.includes("item.liked")) {
          icon = `{{item.liked ? '${ICONS.heartFill}' : '${ICONS.heartStroke}'}}`;
        } else if (svgContent.includes("chartList[") || svgContent.includes('[e.currentTarget.dataset.index]')) {
          icon = `{{item.liked ? '${ICONS.heartFill}' : '${ICONS.heartStroke}'}}`;
        } else {
          icon = ICONS.heartStroke;
        }
      } else if (svgContent.includes('M6 6h2v12')) {
        icon = ICONS.prev;
      } else if (svgContent.includes('M16 18h2V6')) {
        icon = ICONS.next;
      } else if (svgContent.includes('<polygon')) {
        icon = ICONS.play;
      } else if (svgContent.includes('width="4"') && svgContent.includes('height="14"')) {
        icon = ICONS.pause;
      } else if (svgContent.includes('"M18" y1="6"')) {
        icon = ICONS.close;
      } else if (svgContent.includes('M9 18V5')) {
        icon = ICONS.music;
      } else if (svgContent.includes('<line') && svgContent.includes('x1="12" y1="18"') && svgContent.includes('12.01')) {
        icon = ICONS.phone;
      }
    }

    if (icon) {
      results.push({ start: svgStart, end: svgEnd, icon });
    } else {
      console.warn(`[${fileName}] Unknown SVG at pos ${svgStart}: viewBox="${viewBox}"`);
    }

    searchPos = svgEnd;
  }

  // Process from end to start
  results.sort((a, b) => b.start - a.start);

  let output = text;
  for (const { start, end, icon } of results) {
    output = output.substring(0, start) + `<image src="${icon}" mode="aspectFit"/>` + output.substring(end);
  }

  return output;
}

const files = [
  'custom-tab-bar/index.wxml',
  'pages/index/index.wxml',
  'pages/home/home.wxml',
  'pages/list/list.wxml',
  'pages/music/music.wxml',
  'pages/register/register.wxml',
  'pages/detail/detail.wxml',
  'pages/profile/profile.wxml',
];

for (const relPath of files) {
  const fullPath = path.join(BASE, relPath);
  const content = fs.readFileSync(fullPath, 'utf8');
  const svgCount = (content.match(/<svg[\s>]/g) || []).length;

  if (svgCount === 0) {
    console.log(`${relPath}: no SVGs found, skipping`);
    continue;
  }

  const result = replaceSvgsInText(content, relPath);
  fs.writeFileSync(fullPath, result);
  console.log(`${relPath}: replaced ${svgCount} SVG(s)`);
}

console.log('\nDone! All SVGs replaced with base64 data URI images.');
