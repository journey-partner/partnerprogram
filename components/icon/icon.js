// ═══════════════════════════════════════
//  统一 SVG Icon 组件
//  所有图标统一 24×24 viewBox，描边 2px
// ═══════════════════════════════════════

// SVG 模板：{0}=stroke色, {1}=fill色(需要时)
const ICONS = {
  // ── 导航/操作类（线型描边）──
  'arrow-left':  '<path d="M19 12H5M12 19l-7-7 7-7"/>',
  'plus':        '<path d="M12 5v14M5 12h14"/>',
  'close':       '<path d="M18 6L6 18M6 6l12 12"/>',
  'check':       '<path d="M20 6L9 17l-5-5"/>',
  'dots':        '<circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/>',

  // ── 功能类 ──
  'calendar':    '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h21"/>',
  'clock':       '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  'bell':        '<path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>',
  'chart':       '<path d="M18 20V10M12 20V4M6 20v-6"/>',
  'mic':         '<path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8"/>',
  'mic-off':     '<path d="M1 1l22 22M9 9v-5a3 3 0 016 0v6m-6 7a7 7 0 008-5M12 19v4m-4 0h8"/>',
  'image':       '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>',
  'share':       '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/>',
  'copy':        '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>',
  'undo':        '<path d="M3 10h10a5 5 0 010 10H9M3 10l4-4M3 10l4 4"/>',
  'search':      '<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>',
  'settings':    '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>',

  // ── 线型实心装饰类 ──
  'star':        '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.86L12 17.77l-6.18 3.23L7 14.14 2 9.27l6.91-1.01L12 2z"/>',
  'heart':       '<path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>',
  'sparkle':     '<path d="M12 2l1.5 5h4.5l-3.7 2.7 1.5 5L12 12l-3.8 2.7 1.5-5L6 7h4.5z"/><circle cx="12" cy="12" r="8" fill="none" stroke-width="1.5" stroke-dasharray="3 3"/>',
  'sun':         '<circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>',
  'moon':        '<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>',
  'lightbulb':   '<path d="M9 18h6M10 22h4M12 2a7 7 0 00-7 7c0 2.38 1.19 4.47 3 5.74V17a2 2 0 002 2h4a2 2 0 002-2v-2.26A6.98 6.98 0 0019 9a7 7 0 00-7-7z"/>',
  'gift':        '<polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><path d="M12 22V7M12 7H7.5a2.5 2.5 0 110-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/>',
  'pin':         '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>',
  'tasks':       '<path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M9 13l2 2 4-4"/>',
  'journal':     '<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>',
  'trophy':      '<path d="M6 9H4.5a2.5 2.5 0 010-5C6 4 6 7 6 9zM18 9h1.5a2.5 2.5 0 000-5C18 4 18 7 18 9zM4 22h16M12 18V5a4 4 0 00-8 0v4.18M12 18V5a4 4 0 018 0v4.18"/>',
  'bolt':        '<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>',
  'hands':       '<path d="M7 11v8a2 2 0 002 2h0"/><path d="M12 5v16"/><path d="M7 11a5 5 0 015-5h0a5 5 0 015 5v8a2 2 0 01-2 2H7"/><path d="M17 11v8a2 2 0 01-2 2h0"/>',
};

// 标准描边样式模板
const STROKE_WRAP = (content, color) => {
  const strokeWidth = 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${content}</svg>`;
};

// 填充样式模板（star/heart等）
const FILL_WRAP = (content, color) => {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="${color}" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${content}</svg>`;
};

// 需要填充的图标
const FILL_ICONS = ['star', 'heart', 'bolt', 'trophy', 'sun', 'moon', 'hands'];

function buildSVG(name, color) {
  const path = ICONS[name];
  if (!path) return '';
  const wrap = FILL_ICONS.includes(name) ? FILL_WRAP : STROKE_WRAP;
  return wrap(path, color);
}

function toDataURI(svg) {
  const encoded = encodeURIComponent(svg)
    .replace(/%23/g, '#')
    .replace(/%3D/g, '=')
    .replace(/%2F/g, '/')
    .replace(/%3A/g, ':');
  return 'data:image/svg+xml,' + encoded;
}

Component({
  properties: {
    name: {
      type: String,
      value: ''
    },
    size: {
      type: Number,
      value: 40
    },
    color: {
      type: String,
      value: '#111827'
    }
  },

  data: {
    iconSrc: '',
    iconSize: 40
  },

  observers: {
    'name,size,color': function(name, size, color) {
      if (!name) return;
      const svg = buildSVG(name, color || '#111827');
      this.setData({
        iconSrc: toDataURI(svg),
        iconSize: size || 40
      });
    }
  },

  lifetimes: {
    attached() {
      const svg = buildSVG(this.properties.name, this.properties.color || '#111827');
      this.setData({
        iconSrc: toDataURI(svg),
        iconSize: this.properties.size || 40
      });
    }
  }
});
