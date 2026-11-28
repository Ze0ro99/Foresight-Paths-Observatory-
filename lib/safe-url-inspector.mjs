import dns from 'node:dns/promises';
import http from 'node:http';
import https from 'node:https';
import { isIP } from 'node:net';

const REDIRECT_STATUSES = new Set([301,302,303,307,308]);
const DEFAULT_MAX_REDIRECTS = 3;
const DEFAULT_MAX_BYTES = 64 * 1024;
const DEFAULT_TIMEOUT_MS = 3500;
const DEFAULT_TOTAL_TIMEOUT_MS = 10000;
const DEFAULT_DNS_TIMEOUT_MS = 2500;

export class UrlInspectionError extends Error {
  constructor(code,message=code){ super(message); this.name='UrlInspectionError'; this.code=code; }
}
function ipv4Octets(address){
  const parts=address.split('.');
  if(parts.length!==4) return null;
  const octets=parts.map((part)=>(/^(0|[1-9]\d{0,2})$/.test(part)?Number(part):NaN));
  if(octets.some((part)=>!Number.isInteger(part)||part<0||part>255)) return null;
  return octets;
}
function isPublicIpv4(address){
  const octets=ipv4Octets(address); if(!octets) return false;
  const [a,b,c]=octets;
  if(a===0||a===10||a===127||a>=224) return false;
  if(a===100&&b>=64&&b<=127) return false;
  if(a===169&&b===254) return false;
  if(a===172&&b>=16&&b<=31) return false;
  if(a===192&&b===0&&c===0) return false;
  if(a===192&&b===0&&c===2) return false;
  if(a===192&&b===88&&c===99) return false;
  if(a===192&&b===168) return false;
  if(a===198&&(b===18||b===19)) return false;
  if(a===198&&b===51&&c===100) return false;
  if(a===203&&b===0&&c===113) return false;
  return true;
}
function ipv6ToBigInt(address){
  let value=address.toLowerCase(); if(value.includes('%')) return null;
  if(value.includes('.')){
    const lastColon=value.lastIndexOf(':'); if(lastColon<0) return null;
    const octets=ipv4Octets(value.slice(lastColon+1)); if(!octets) return null;
    const first=((octets[0]<<8)|octets[1]).toString(16);
    const second=((octets[2]<<8)|octets[3]).toString(16);
    value=value.slice(0,lastColon+1)+first+':'+second;
  }
  const halves=value.split('::'); if(halves.length>2) return null;
  const left=halves[0]?halves[0].split(':'):[];
  const right=halves.length===2&&halves[1]?halves[1].split(':'):[];
  if([...left,...right].some((part)=>!/^[0-9a-f]{1,4}$/.test(part))) return null;
  let groups;
  if(halves.length===2){const missing=8-left.length-right.length;if(missing<1)return null;groups=[...left,...Array(missing).fill('0'),...right];}
  else {if(left.length!==8)return null;groups=left;}
  if(groups.length!==8)return null;
  return groups.reduce((result,part)=>(result<<16n)|BigInt('0x'+part),0n);
}
function isPublicIpv6(address){
  const value=ipv6ToBigInt(address); if(value===null||(value>>125n)!==1n)return false;
  const first32=value>>96n;
  if((first32&0xfffffe00n)===0x20010000n)return false;
  if(first32===0x20010db8n)return false;
  if((first32>>16n)===0x2002n)return false;
  if((value>>108n)===0x3fff0n)return false;
  return true;
}
export function isPublicIpAddress(address){
  const family=isIP(address);
  if(family===4)return isPublicIpv4(address);
  if(family===6)return isPublicIpv6(address);
  return false;
}
function normalizedHostname(url){return url.hostname.replace(/^\[|\]$/g,'').replace(/\.$/,'').toLowerCase();}
export function validateHttpUrl(input){
  if(typeof input!=='string'||input.length>2048)throw new UrlInspectionError('INVALID_URL','Enter a URL up to 2,048 characters.');
  let url; try{url=new URL(input.trim());}catch{throw new UrlInspectionError('INVALID_URL','The supplied URL is not valid.');}
  if(url.protocol!=='https:'&&url.protocol!=='http:')throw new UrlInspectionError('UNSUPPORTED_PROTOCOL','Only HTTP and HTTPS URLs are supported.');
  if(url.username||url.password)throw new UrlInspectionError('URL_CREDENTIALS_NOT_ALLOWED','URLs containing embedded credentials are not accepted.');
  if(url.port&&!((url.protocol==='http:'&&url.port==='80')||(url.protocol==='https:'&&url.port==='443')))throw new UrlInspectionError('PORT_NOT_ALLOWED','Only standard HTTP and HTTPS ports are accepted.');
  const host=normalizedHostname(url),suffixes=['.localhost','.local','.internal','.test','.invalid','.example','.onion'];
  if(!host||host==='localhost'||suffixes.some((suffix)=>host.endsWith(suffix)))throw new UrlInspectionError('LOCAL_HOSTNAME_NOT_ALLOWED','Local, private, and reserved hostnames are not accepted.');
  if(!isIP(host)&&(!host.includes('.')||host.length>253))throw new UrlInspectionError('INVALID_HOSTNAME','Enter a fully qualified public hostname.');
  if(isIP(host)&&!isPublicIpAddress(host))throw new UrlInspectionError('NON_PUBLIC_ADDRESS','Private or reserved IP addresses are not accepted.');
  url.hash=''; return url;
}
async function resolvePublicAddresses(host,lookup){
  const family=isIP(host);
  const rows=family?[{address:host,family}]:await lookup(host);
  if(!Array.isArray(rows)||rows.length===0)throw new UrlInspectionError('DNS_NO_ADDRESS','The hostname did not resolve to a public address.');
  const addresses=rows.map((row)=>({address:row.address,family:row.family||isIP(row.address)}));
  if(addresses.some((row)=>!isPublicIpAddress(row.address)))throw new UrlInspectionError('NON_PUBLIC_ADDRESS','The hostname resolves to a private or reserved address.');
  return addresses;
}
function pinnedLookup(addresses){
  return (_hostname,options,callback)=>{
    if(options&&options.all){callback(null,addresses.map((item)=>({address:item.address,family:item.family})));return;}
    callback(null,addresses[0].address,addresses[0].family);
  };
}
function requestOnce({url,addresses,timeoutMs,maxBytes}){
  return new Promise((resolve,reject)=>{
    const transport=url.protocol==='https:'?https:http,hostname=normalizedHostname(url);
    const request=transport.request({
      protocol:url.protocol,hostname,port:url.port||(url.protocol==='https:'?443:80),
      method:'GET',path:(url.pathname||'/')+url.search,
      headers:{Host:url.host,Accept:'text/html,application/xhtml+xml,application/json;q=0.8,*/*;q=0.2','Accept-Encoding':'identity','User-Agent':'ForesightPaths-LinkInspector/1.0',Connection:'close'},
      lookup:pinnedLookup(addresses),servername:url.protocol==='https:'&&!isIP(hostname)?hostname:undefined,timeout:timeoutMs,
    },(response)=>{
      const chunks=[];let size=0;
      response.on('data',(chunk)=>{size+=chunk.length;if(size>maxBytes){request.destroy(new UrlInspectionError('RESPONSE_TOO_LARGE','The remote page exceeded the inspection size limit.'));return;}chunks.push(chunk);});
      response.on('end',()=>resolve({statusCode:response.statusCode||0,headers:response.headers,body:Buffer.concat(chunks).toString('utf8')}));
      response.on('error',reject);
    });
    request.on('timeout',()=>request.destroy(new UrlInspectionError('REQUEST_TIMEOUT','The remote page took too long to respond.')));
    request.on('error',reject);request.end();
  });
}
function htmlSignals(contentType,body){
  if(!/text\/html|application\/xhtml\+xml/i.test(contentType||''))return {title:null,description:null,hasViewport:false,hasPiSdk:false,hasPiInit:false,hasPiAuthenticate:false,hasPrivacyPolicy:false};
  const title=body.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().slice(0,180)||null;
  const description=body.match(/<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i)?.[1]?.replace(/\s+/g,' ').trim().slice(0,280)||null;
  return {title,description,
    hasViewport:/<meta\s+[^>]*name=["']viewport["']/i.test(body),
    hasPiSdk:/https:\/\/sdk\.minepi\.com\/pi-sdk\.js/i.test(body),
    hasPiInit:/\bPi\.init\s*\(/.test(body),
    hasPiAuthenticate:/\bPi\.authenticate\s*\(/.test(body),
    hasPrivacyPolicy:/privacy\s+policy|privacy-policy|سياسة\s+الخصوصية/i.test(body)};
}
function withinDeadline(promise,timeoutMs,code,message){
  return new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(new UrlInspectionError(code,message)),timeoutMs);
    Promise.resolve(promise).then(resolve,reject).finally(()=>clearTimeout(timer));
  });
}
export async function inspectPublicUrl(input,options={}){
  const lookup=options.lookup||((hostname)=>dns.lookup(hostname,{all:true,verbatim:true}));
  const request=options.request||requestOnce;
  const maxRedirects=Number.isInteger(options.maxRedirects)?options.maxRedirects:DEFAULT_MAX_REDIRECTS;
  const maxBytes=Number.isInteger(options.maxBytes)?options.maxBytes:DEFAULT_MAX_BYTES;
  const timeoutMs=Number.isInteger(options.timeoutMs)?options.timeoutMs:DEFAULT_TIMEOUT_MS;
  const totalTimeoutMs=Number.isInteger(options.totalTimeoutMs)?options.totalTimeoutMs:DEFAULT_TOTAL_TIMEOUT_MS;
  const dnsTimeoutMs=Number.isInteger(options.dnsTimeoutMs)?options.dnsTimeoutMs:DEFAULT_DNS_TIMEOUT_MS;
  const deadline=Date.now()+totalTimeoutMs,remaining=()=>Math.max(0,deadline-Date.now());
  let current=validateHttpUrl(input),response;const redirects=[];
  for(let hop=0;hop<=maxRedirects;hop+=1){
    const host=normalizedHostname(current),dnsBudget=Math.min(dnsTimeoutMs,remaining());
    if(dnsBudget<=0)throw new UrlInspectionError('REQUEST_TIMEOUT','The inspection exceeded its total time limit.');
    const addresses=await withinDeadline(resolvePublicAddresses(host,lookup),dnsBudget,'DNS_TIMEOUT','The target hostname did not resolve within the inspection time limit.');
    const requestBudget=Math.min(timeoutMs,remaining());
    if(requestBudget<=0)throw new UrlInspectionError('REQUEST_TIMEOUT','The inspection exceeded its total time limit.');
    response=await withinDeadline(request({url:current,addresses,timeoutMs:requestBudget,maxBytes}),requestBudget,'REQUEST_TIMEOUT','The remote page took too long to respond.');
    const location=response.headers?.location;
    if(!REDIRECT_STATUSES.has(response.statusCode)||typeof location!=='string'||!location.trim())break;
    if(hop===maxRedirects)throw new UrlInspectionError('REDIRECT_LIMIT','The page exceeded the permitted redirect limit.');
    redirects.push({statusCode:response.statusCode,host:host});
    let next;try{next=new URL(location,current);}catch{throw new UrlInspectionError('INVALID_REDIRECT','The remote page returned an invalid redirect.');}
    current=validateHttpUrl(next.toString());
  }
  if(!response)throw new UrlInspectionError('UPSTREAM_UNAVAILABLE','The target could not be reached.');
  const headers=response.headers||{},contentType=String(headers['content-type']||'').slice(0,120),signals=htmlSignals(contentType,response.body||''),csp=String(headers['content-security-policy']||'');
  const securityHeaders={
    strictTransportSecurity:current.protocol==='https:'&&typeof headers['strict-transport-security']==='string',
    contentSecurityPolicy:Boolean(csp),
    xContentTypeOptions:String(headers['x-content-type-options']||'').toLowerCase()==='nosniff',
    frameProtection:Boolean(headers['x-frame-options'])||/(?:^|;)\s*frame-ancestors\s+/i.test(csp),
  };
  const recommendations=[];
  if(current.protocol!=='https:')recommendations.push('Enable HTTPS and redirect HTTP traffic to the secure origin.');
  if(!securityHeaders.strictTransportSecurity&&current.protocol==='https:')recommendations.push('Consider a Strict-Transport-Security header after validating HTTPS across all subdomains.');
  if(!securityHeaders.contentSecurityPolicy)recommendations.push('Add a restrictive Content-Security-Policy tailored to the application.');
  if(!securityHeaders.xContentTypeOptions)recommendations.push('Set X-Content-Type-Options: nosniff.');
  if(!securityHeaders.frameProtection)recommendations.push('Set X-Frame-Options or a CSP frame-ancestors directive.');
  if(!signals.hasViewport)recommendations.push('Add a mobile viewport declaration and verify responsive behavior in Pi Browser.');
  if(!signals.hasPiSdk)recommendations.push('For Pi app integration, confirm the official Pi SDK script is loaded on production pages.');
  if(!signals.hasPiInit)recommendations.push('For Pi app integration, confirm Pi.init is called before SDK methods.');
  if(!signals.hasPiAuthenticate)recommendations.push('For Pi app integration, confirm Pi authentication is implemented and server-verified.');
  if(!signals.hasPrivacyPolicy)recommendations.push('Publish an accessible privacy policy and make it discoverable from the app.');
  return {
    status:response.statusCode>=200&&response.statusCode<400?'reachable':'http_error',
    inspectedAtUtc:new Date().toISOString(),
    requestedHost:normalizedHostname(validateHttpUrl(input)),
    finalUrl:(current.origin+current.pathname).slice(0,500),
    httpStatus:response.statusCode,contentType,redirects,transport:{https:current.protocol==='https:'},
    securityHeaders,appSignals:signals,recommendations,
    limitations:[
      'This is a passive, bounded inspection of the public page. It does not execute JavaScript, authenticate to the target, crawl linked pages, or perform penetration testing.',
      'Pi SDK and privacy-policy checks are heuristic source-page indicators, not a certification or Pi Core Team approval.',
      'A successful HTTP response does not establish business, security, or Pi ecosystem compliance.',
    ],
  };
}