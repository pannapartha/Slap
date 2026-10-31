import {isIP} from 'node:net';
export function productionOrigin(value){
 if(!value)throw Error('Set SLAP_SERVER_URL to the actual public HTTPS game-server origin before building');
 let u;try{u=new URL(value)}catch{throw Error('SLAP_SERVER_URL must be an HTTPS origin')}
 const h=u.hostname.toLowerCase(),ip=h.replace(/^\[|\]$/g,'');
 const reserved=/(^|\.)(localhost|local|example|invalid|test)$/.test(h)||/(^|\.)example\.(com|net|org)$/.test(h)||!h.includes('.');
 // The production target is a real DNS hostname with TLS, never a local/test address.
 if(u.protocol!=='https:'||u.username||u.password||u.pathname!=='/'||u.search||u.hash||reserved||isIP(ip)||!h.split('.').every(p=>/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(p)))throw Error('SLAP_SERVER_URL requires a real public HTTPS hostname; local, IP and example/test targets are forbidden');
 return u.origin;
}
