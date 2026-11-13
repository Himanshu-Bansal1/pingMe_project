import test from 'node:test';
import assert from 'node:assert/strict';

test('uses current Supabase secret keys only in the apikey header',async()=>{
  const oldFetch=globalThis.fetch,oldUrl=process.env.SUPABASE_URL,oldSecret=process.env.SUPABASE_SECRET_KEY,oldLegacy=process.env.SUPABASE_SERVICE_ROLE_KEY;let sent;
  try{process.env.SUPABASE_URL='https://example.supabase.co';process.env.SUPABASE_SECRET_KEY='sb_secret_unit_test';delete process.env.SUPABASE_SERVICE_ROLE_KEY;globalThis.fetch=async(_url,options)=>{sent=options.headers;return new Response('[]',{status:200,headers:{'content-type':'application/json'}})};const {supaSelect}=await import('../server/db/supabase.js?modern-key-test');await supaSelect('airpool_fare_rates',{select:'*'});assert.equal(sent.apikey,'sb_secret_unit_test');assert.equal(sent.Authorization,undefined)}finally{globalThis.fetch=oldFetch;if(oldUrl===undefined)delete process.env.SUPABASE_URL;else process.env.SUPABASE_URL=oldUrl;if(oldSecret===undefined)delete process.env.SUPABASE_SECRET_KEY;else process.env.SUPABASE_SECRET_KEY=oldSecret;if(oldLegacy===undefined)delete process.env.SUPABASE_SERVICE_ROLE_KEY;else process.env.SUPABASE_SERVICE_ROLE_KEY=oldLegacy}
});
