export function socketURL(page=location,config=globalThis.SLAP_CONFIG||{}) {
 const url=new URL(config.serverURL||page.origin);if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw Error('Invalid party server origin');
 if(page.protocol==='https:'&&url.protocol!=='https:')throw Error('Secure gameplay requires an HTTPS party server');
 url.protocol=url.protocol==='https:'?'wss:':'ws:';url.pathname='/ws';return url.href;
}
