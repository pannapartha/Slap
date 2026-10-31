export const COLORS=Object.freeze([
 {name:'Original Orange',hex:'#ff743d'},{name:'Sky Blue',hex:'#72c6f1'},
 {name:'Mint Green',hex:'#85dcb2'},{name:'Lavender',hex:'#b4a0e6'},
 {name:'Bubblegum Pink',hex:'#f38fbb'},{name:'Sunshine Yellow',hex:'#f5d266'},
 {name:'Turquoise',hex:'#39bdbb'},{name:'Deep Purple',hex:'#7855ba'}
]);
export const validColor=v=>Number.isInteger(v)&&v>=0&&v<COLORS.length?v:0;
// Original excerpts, at 1x source pacing: fall .6s, down .15s, rise 1.1s, settle .15s.
export const RECOVERY=Object.freeze({duration:2,fall:.6,down:.15,rise:1.1,settle:.15});
