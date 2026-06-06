(() => {
  'use strict';
  window.Cromo = window.Cromo || {};
  const C = window.Cromo;

  C.ICON = {
    gem: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 3h12l3 6-9 12L3 9l3-6Z" fill="#F0D77B" stroke="#A8842A" stroke-width="1"/><path d="M3 9h18M9 3 7 9l5 12M15 3l2 6-5 12" stroke="#A8842A" stroke-width="1" opacity=".7"/></svg>',
    flame: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2s5 4 5 9a5 5 0 0 1-10 0c0-1 .3-2 .8-2.8C7.5 9 8 11 9 11c0-3 2-5 3-9Z"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="#F0D77B" aria-hidden="true"><path d="m12 2 2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8L2.2 9l6.9-.7L12 2Z"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l8 3v6c0 5-3.6 8-8 9-4.4-1-8-4-8-9V6l8-3z"/></svg>',
    midfield: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2.4"/><circle cx="19" cy="12" r="2"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 19L19 5M9 5h10v10"/></svg>',
    chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
    scroll: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><path d="M6 4h11a3 3 0 0 1 3 3v11a2 2 0 0 1-2 2H8a4 4 0 0 1-4-4V6a2 2 0 0 1 2-2z"/><path d="M9 9h7M9 13h7"/></svg>',
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2H4.5L6 16z"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    trophy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><path d="M8 4h8v5a4 4 0 0 1-8 0V4z"/><path d="M16 5h3v2a3 3 0 0 1-3 3M8 5H5v2a3 3 0 0 0 3 3"/><path d="M9 16h6l1 4H8l1-4z"/></svg>'
  };

  C.FLAGS = {
    arg: '<svg viewBox="0 0 24 16" class="flag" aria-hidden="true"><rect width="24" height="16" fill="#74ACDF"/><rect y="5.33" width="24" height="5.34" fill="#fff"/><circle cx="12" cy="8" r="1.7" fill="#F6B40E"/></svg>',
    bra: '<svg viewBox="0 0 24 16" class="flag" aria-hidden="true"><rect width="24" height="16" fill="#009C3B"/><polygon points="12,2 22,8 12,14 2,8" fill="#FFDF00"/><circle cx="12" cy="8" r="3" fill="#002776"/></svg>',
    fra: '<svg viewBox="0 0 24 16" class="flag" aria-hidden="true"><rect width="8" height="16" fill="#0055A4"/><rect x="8" width="8" height="16" fill="#fff"/><rect x="16" width="8" height="16" fill="#EF4135"/></svg>'
  };

  C.flag = (id) => C.FLAGS[id] || '';
})();
