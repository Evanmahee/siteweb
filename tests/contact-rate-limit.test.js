import { test } from 'node:test';
import assert from 'node:assert/strict';
import { contactRateLimited } from '../server/contact-rate-limit.js';
test('shared rate limit is atomic, uses a hashed IP and fails closed on outages',async()=>{
  const names=['UPSTASH_REDIS_REST_URL','UPSTASH_REDIS_REST_TOKEN','CONTACT_RATE_LIMIT_SECRET','VERCEL'];const before=Object.fromEntries(names.map(n=>[n,process.env[n]]));const original=globalThis.fetch;
  process.env.UPSTASH_REDIS_REST_URL='https://redis.example.test';process.env.UPSTASH_REDIS_REST_TOKEN='test-token';process.env.CONTACT_RATE_LIMIT_SECRET='test-secret';delete process.env.VERCEL;
  let count=0;let command;
  globalThis.fetch=async(url,options)=>{assert.equal(url,'https://redis.example.test');command=JSON.parse(options.body);return new Response(JSON.stringify({result:++count}));};
  const req={headers:{'x-vercel-forwarded-for':'forged'},socket:{remoteAddress:'192.0.2.17'}};
  try{
    for(let i=0;i<5;i++) assert.equal(await contactRateLimited(req),false);
    assert.equal(await contactRateLimited(req),true);assert.equal(command[0],'EVAL');assert.ok(!JSON.stringify(command).includes('192.0.2.17'));assert.equal(command[4],'900');
    globalThis.fetch=async()=>new Response('failure',{status:503});await assert.rejects(contactRateLimited(req));
    process.env.VERCEL='1';await assert.rejects(contactRateLimited(req),/trusted client IP/);
  }finally{globalThis.fetch=original;for(const name of names){if(before[name]===undefined)delete process.env[name];else process.env[name]=before[name];}}
});
