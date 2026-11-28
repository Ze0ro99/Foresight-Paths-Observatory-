import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { inspectPublicUrl, UrlInspectionError } from '@/lib/safe-url-inspector.mjs';
import { getSupabaseServerHeaders, getSupabaseServerKeyKind } from '@/lib/supabase-server-headers.mjs';

export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=15;
const PI_AUTH_URL='https://api.minepi.com/v2/me';
const MAX_BODY_BYTES=4096;
const RATE_LIMIT=5;
const RATE_WINDOW_SECONDS=60;

function jsonError(error:string,status:number,headers?:HeadersInit){
  return NextResponse.json({ok:false,error},{status,headers:{'Cache-Control':'no-store',...headers}});
}
function getSupabaseConfig(){
  const base=process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(),key=process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if(!base||!key||!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(base))return null;
  const keyKind = getSupabaseServerKeyKind(key);
  if (keyKind !== 'secret_key' && keyKind !== 'legacy_service_role_jwt') return null;
  return {base:base.replace(/\/$/,''),key};
}
async function verifyPioneer(token:string):Promise<string|null>{
  try{
    const response=await fetch(PI_AUTH_URL,{headers:{Authorization:'Bearer '+token,Accept:'application/json'},cache:'no-store',signal:AbortSignal.timeout(5000)});
    if(!response.ok)return null;
    const user=await response.json() as {uid?:unknown};
    return typeof user.uid==='string'&&user.uid.length>0&&user.uid.length<=160?user.uid:null;
  }catch{return null;}
}
async function consumeInspectionSlot(uid:string):Promise<{allowed:boolean;retryAfterSeconds:number}|null>{
  const config=getSupabaseConfig();if(!config)return null;
  const subjectHash=createHash('sha256').update('foresight-paths:url-inspection:v1:'+uid).digest('hex');
  const headers:Record<string,string>={...getSupabaseServerHeaders(config.key),'Content-Type':'application/json',Accept:'application/json'};
  try{
    const response=await fetch(config.base+'/rest/v1/rpc/consume_url_inspection_slot',{
      method:'POST',headers,body:JSON.stringify({p_subject_hash:subjectHash,p_limit:RATE_LIMIT,p_window_seconds:RATE_WINDOW_SECONDS}),
      cache:'no-store',signal:AbortSignal.timeout(3500),
    });
    if(!response.ok)return null;
    const payload=await response.json() as Array<{allowed?:unknown;retry_after_seconds?:unknown}>;
    const row=Array.isArray(payload)?payload[0]:null;
    if(typeof row?.allowed!=='boolean')return null;
    return {allowed:row.allowed,retryAfterSeconds:typeof row.retry_after_seconds==='number'?Math.max(1,Math.min(3600,Math.ceil(row.retry_after_seconds))):RATE_WINDOW_SECONDS};
  }catch{return null;}
}
export async function POST(request:NextRequest){
  const authorization=request.headers.get('authorization')||'',token=authorization.match(/^Bearer\s+(\S{20,4096})$/i)?.[1];
  if(!token)return jsonError('Sign in with Pi Browser before inspecting an application URL.',401);
  const declaredLength=Number(request.headers.get('content-length')||'0');
  if(declaredLength>MAX_BODY_BYTES)return jsonError('Request is too large.',413);
  let rawBody:string;try{rawBody=await request.text();}catch{return jsonError('The request body could not be read.',400);}
  if(new TextEncoder().encode(rawBody).byteLength>MAX_BODY_BYTES)return jsonError('Request is too large.',413);
  let body:{url?:unknown};try{body=JSON.parse(rawBody) as {url?:unknown};}catch{return jsonError('Send a valid JSON object containing a URL.',400);}
  if(typeof body.url!=='string'||body.url.trim().length===0)return jsonError('Enter the public application URL you want to inspect.',400);

  const uid=await verifyPioneer(token);
  if(!uid)return jsonError('Pi could not verify this session. Sign in again and retry.',401);
  const slot=await consumeInspectionSlot(uid);
  if(!slot)return jsonError('The secure inspection quota service is unavailable. No target request was made.',503);
  if(!slot.allowed)return jsonError('Inspection limit reached. Please retry after the indicated interval.',429,{'Retry-After':String(slot.retryAfterSeconds)});

  try{
    const report=await inspectPublicUrl(body.url,{maxRedirects:2,maxBytes:64*1024,timeoutMs:3500,dnsTimeoutMs:2500,totalTimeoutMs:10000});
    return NextResponse.json({ok:true,report},{headers:{'Cache-Control':'no-store'}});
  }catch(error){
    if(error instanceof UrlInspectionError){
      const clientErrors=new Set(['INVALID_URL','UNSUPPORTED_PROTOCOL','URL_CREDENTIALS_NOT_ALLOWED','PORT_NOT_ALLOWED','LOCAL_HOSTNAME_NOT_ALLOWED','INVALID_HOSTNAME','NON_PUBLIC_ADDRESS','DNS_NO_ADDRESS','REDIRECT_LIMIT','INVALID_REDIRECT']);
      const status=clientErrors.has(error.code)?422:(error.code==='REQUEST_TIMEOUT'||error.code==='DNS_TIMEOUT')?504:502;
      return jsonError(error.message,status);
    }
    const reason=error instanceof Error?error.name:'UnknownError';
    console.warn('Link inspection failed',{reason});
    return jsonError('The target could not be safely inspected. No code was executed and no external action was taken.',502);
  }
}