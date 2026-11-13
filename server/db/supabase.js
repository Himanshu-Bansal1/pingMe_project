const baseUrl=process.env.SUPABASE_URL?.replace(/\/+$/,'');
const apiKey=process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY;
export const supabaseEnabled=Boolean(baseUrl&&apiKey);

export async function supaRequest(table,{method='GET',query={},body,prefer}={}){
  if(!supabaseEnabled)throw new Error('Supabase is not configured. Set SUPABASE_URL and SUPABASE_SECRET_KEY in .env.');
  const url=new URL(`${baseUrl}/rest/v1/${table}`);
  for(const [key,value] of Object.entries(query))if(value!==undefined&&value!==null)url.searchParams.set(key,String(value));
  const headers={apikey:apiKey,Accept:'application/json','User-Agent':'AirPool-server/1.0'};
  // New sb_secret keys are API keys, not JWTs. Only legacy service_role keys use Bearer auth.
  if(!apiKey.startsWith('sb_secret_'))headers.Authorization=`Bearer ${apiKey}`;
  if(body!==undefined)headers['Content-Type']='application/json';
  if(prefer)headers.Prefer=prefer;
  const response=await fetch(url,{method,headers,body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(8000)});
  const text=await response.text();
  let payload;try{payload=text?JSON.parse(text):null}catch{payload={message:text}}
  if(!response.ok){const err=new Error(payload?.message||payload?.hint||`Supabase request failed (${response.status}).`);err.status=response.status;err.code=payload?.code;throw err;}
  return payload;
}

export const supaSelect=(table,query)=>supaRequest(table,{query});
export const supaInsert=(table,body)=>supaRequest(table,{method:'POST',body,prefer:'return=representation'});
export const supaUpsert=(table,body,onConflict)=>supaRequest(table,{method:'POST',body,query:{on_conflict:onConflict},prefer:'resolution=merge-duplicates,return=representation'});
export const supaPatch=(table,query,body)=>supaRequest(table,{method:'PATCH',query,body,prefer:'return=representation'});
export const supaDelete=(table,query)=>supaRequest(table,{method:'DELETE',query,prefer:'return=minimal'});
