import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectPublicUrl,isPublicIpAddress,UrlInspectionError,validateHttpUrl} from '../lib/safe-url-inspector.mjs';

const publicLookup=async()=>[{address:'93.184.216.34',family:4}];
const htmlResponse=(overrides={})=>({
 statusCode:200,
 headers:{'content-type':'text/html; charset=utf-8','strict-transport-security':'max-age=31536000','content-security-policy':"default-src 'self'",'x-content-type-options':'nosniff','x-frame-options':'DENY',...overrides.headers},
 body:'<html><head><title>Example App</title><meta name="description" content="A public demo"><meta name="viewport" content="width=device-width"><script src="https://sdk.minepi.com/pi-sdk.js"></script></head><body>Pi.init({version: "2.0"}); Pi.authenticate(["username"]); Privacy Policy</body></html>',
 ...overrides,
});
test('accepts only public HTTP(S) URLs on standard ports',()=>{
 assert.equal(validateHttpUrl('https://example.com/path#fragment').hash,'');
 assert.equal(validateHttpUrl('http://example.com:80').hostname,'example.com');
 for(const value of ['javascript:alert(1)','file:///etc/passwd','ftp://example.com','https://user:pass@example.com','https://localhost','https://a.localhost','https://example.local','https://example.com:8443','https://127.0.0.1','http://169.254.169.254/latest/meta-data'])assert.throws(()=>validateHttpUrl(value),UrlInspectionError,value);
});
test('rejects IPv4 private, loopback, link-local, carrier-grade NAT and reserved ranges',()=>{
 for(const address of ['0.0.0.0','10.0.0.1','100.64.0.1','100.127.255.254','127.0.0.1','169.254.169.254','172.16.0.1','172.31.255.254','192.168.1.1','192.0.2.1','198.18.0.1','198.51.100.2','203.0.113.8','224.0.0.1'])assert.equal(isPublicIpAddress(address),false,address);
 assert.equal(isPublicIpAddress('93.184.216.34'),true);assert.equal(isPublicIpAddress('1.1.1.1'),true);
});
test('accepts only IPv6 global unicast and rejects local or documentation ranges',()=>{
 for(const address of ['::','::1','fc00::1','fe80::1','ff02::1','2001:db8::1','2002::1','::ffff:192.0.2.1'])assert.equal(isPublicIpAddress(address),false,address);
 assert.equal(isPublicIpAddress('2606:4700:4700::1111'),true);
});
test('rejects a DNS answer set if any address resolves to private space',async()=>{
 await assert.rejects(inspectPublicUrl('https://example.com',{lookup:async()=>[{address:'93.184.216.34',family:4},{address:'10.0.0.9',family:4}],request:async()=>assert.fail('request must not run for mixed public/private DNS')}),(error)=>error instanceof UrlInspectionError&&error.code==='NON_PUBLIC_ADDRESS');
});
test('pins the validated DNS result and returns passive Pi/app readiness signals',async()=>{
 let requestedAddress;
 const report=await inspectPublicUrl('https://example.com/app?access_token=secret',{lookup:publicLookup,request:async({addresses})=>{requestedAddress=addresses[0].address;return htmlResponse();}});
 assert.equal(requestedAddress,'93.184.216.34');assert.equal(report.status,'reachable');assert.equal(report.requestedHost,'example.com');assert.equal(report.finalUrl,'https://example.com/app');
 assert.equal(report.appSignals.hasPiSdk,true);assert.equal(report.appSignals.hasPiInit,true);assert.equal(report.appSignals.hasPiAuthenticate,true);assert.equal(report.appSignals.hasPrivacyPolicy,true);
 assert.equal(report.securityHeaders.contentSecurityPolicy,true);assert.ok(report.limitations.length>=2);
});
test('revalidates redirect destinations and blocks redirects to metadata IPs',async()=>{
 let calls=0;
 await assert.rejects(inspectPublicUrl('https://example.com',{lookup:publicLookup,request:async()=>{calls++;return {statusCode:302,headers:{location:'http://169.254.169.254/latest/meta-data'},body:''};}}),(error)=>error instanceof UrlInspectionError&&error.code==='NON_PUBLIC_ADDRESS');
 assert.equal(calls,1);
});
test('enforces redirect and response limits',async()=>{
 await assert.rejects(inspectPublicUrl('https://example.com',{lookup:publicLookup,maxRedirects:1,request:async({url})=>({statusCode:302,headers:{location:url.origin+'/again'},body:''})}),(error)=>error instanceof UrlInspectionError&&error.code==='REDIRECT_LIMIT');
 await assert.rejects(inspectPublicUrl('https://example.com',{lookup:publicLookup,maxBytes:10,request:async()=>{throw new UrlInspectionError('RESPONSE_TOO_LARGE');}}),(error)=>error instanceof UrlInspectionError&&error.code==='RESPONSE_TOO_LARGE');
});
test('revalidates every redirect URL before following it',async()=>{
 let count=0;
 const report=await inspectPublicUrl('https://example.com',{lookup:async(host)=>host==='example.com'?[{address:'93.184.216.34',family:4}]:[{address:'1.1.1.1',family:4}],request:async({url})=>{count++;if(url.hostname==='example.com')return {statusCode:301,headers:{location:'https://other.example.org/final'},body:''};return htmlResponse({headers:{'content-type':'text/plain'},body:'ok'});}});
 assert.equal(count,2);assert.equal(report.redirects.length,1);assert.equal(report.finalUrl,'https://other.example.org/final');
});
test('enforces a total inspection deadline across DNS resolution and redirects',async()=>{
 await assert.rejects(inspectPublicUrl('https://example.com',{dnsTimeoutMs:15,totalTimeoutMs:30,lookup:async()=>new Promise(()=>{}),request:async()=>assert.fail('request must not run after DNS deadline')}),(error)=>error instanceof UrlInspectionError&&error.code==='DNS_TIMEOUT');
});
test('does not count a generic Content-Security-Policy as frame protection',async()=>{
 const report=await inspectPublicUrl('https://example.com',{lookup:publicLookup,request:async()=>htmlResponse({headers:{'content-security-policy':"default-src 'self'",'x-frame-options':undefined}})});
 assert.equal(report.securityHeaders.contentSecurityPolicy,true);assert.equal(report.securityHeaders.frameProtection,false);
});