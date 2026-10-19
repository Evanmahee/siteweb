import { test } from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/send-email.js';
let serial = 0;
async function request(body, options = {}) {
  const req = {method:'POST', headers:{host:'example.test',origin:'https://example.test','content-type':'application/json'}, body, socket:{remoteAddress:`test-${++serial}`}, ...options};
  const res = {headers:{}, setHeader(k,v){this.headers[k]=v;}, status(n){this.code=n;return this;}, json(body){this.body=body;}};
  await handler(req,res); return res;
}
const valid = {prenom:'Test',nom:'Contact',email:'test@example.test',type_accompagnement:'distanciel',budget_mensuel:'moins-150'};
test('reject malformed, foreign-origin, oversized and invalid fields before sending',async()=>{
  assert.equal((await request(valid,{method:'GET'})).code,405);
  assert.equal((await request(valid,{headers:{host:'example.test',origin:'https://attacker.test','content-type':'application/json'}})).code,403);
  assert.equal((await request(valid,{headers:{host:'example.test','content-type':'text/plain'}})).code,415);
  for(const body of [null,[], '{', {...valid,email:'bad'}, {...valid,prenom:{x:1}}, {...valid,nom:'A\r\nB'}, {...valid,message:'x'.repeat(5001)}]) assert.equal((await request(body)).code,400);
  assert.equal((await request({...valid,message:'x'.repeat(65536)})).code,413);
});
test('honeypot does not contact provider; throttling rejects repeated submissions',async()=>{
  assert.deepEqual((await request({...valid,website:'spam'})).body,{success:true});
  const options={socket:{remoteAddress:'repeated-client'}};
  for(let i=0;i<5;i++) await request({},options);
  assert.equal((await request({},options)).code,429);
});
test('provider errors never appear as success; HTML is escaped and reply-to fixed',async()=>{
  const previousFetch=globalThis.fetch; const oldKey=process.env.RESEND_API_KEY;
  process.env.RESEND_API_KEY='re_test_only';
  let payload;
  try{
    globalThis.fetch=async(url,options)=>{payload=JSON.parse(options.body);return new Response(JSON.stringify({name:'validation_error',message:'rejected'}),{status:422,headers:{'content-type':'application/json'}});};
    assert.equal((await request(valid)).code,500);
    globalThis.fetch=async(url,options)=>{payload=JSON.parse(options.body);return new Response(JSON.stringify({id:'mock-email-id'}),{status:200,headers:{'content-type':'application/json'}});};
    const res=await request({...valid,message:'<img src=x onerror=alert(1)>',to:'attacker@example.test'});
    assert.equal(res.code,200);assert.equal(res.body.success,true);
    assert.ok(payload.html.includes('&lt;img'));assert.ok(!payload.html.includes('<img'));
    assert.ok(!JSON.stringify(payload.to).includes('attacker'));assert.equal(payload.reply_to,valid.email);
  }finally{globalThis.fetch=previousFetch;if(oldKey===undefined)delete process.env.RESEND_API_KEY;else process.env.RESEND_API_KEY=oldKey;}
});
test('mandatory choices, invalid request IDs and numeric limits cannot be bypassed',async()=>{
  for(const body of [{...valid,type_accompagnement:''},{...valid,type_accompagnement:'spam'},{...valid,budget_mensuel:'invalid'},{...valid,requestId:'not-a-uuid'},{...valid,age:'999'},{...valid,poids_kg:'NaN'}]) assert.equal((await request(body)).code,400);
});
test('same request and payload use an identical Resend idempotency key on retries',async()=>{
  const original=globalThis.fetch;const oldKey=process.env.RESEND_API_KEY;process.env.RESEND_API_KEY='re_test_only';const keys=[];
  globalThis.fetch=async(url,options)=>{keys.push(options.headers.get('Idempotency-Key'));assert.ok(options.signal);return new Response(JSON.stringify({id:'mock-id'}),{status:200});};
  try{
    const payload={...valid,requestId:'b09aa653-87cd-4d74-88d6-563119a42907'};
    assert.equal((await request(payload)).code,200);assert.equal((await request(payload)).code,200);
    assert.ok(keys[0].startsWith('contact/'));assert.equal(keys[0],keys[1]);
    await request({...payload,message:'changed'});assert.notEqual(keys[1],keys[2]);
  }finally{globalThis.fetch=original;if(oldKey===undefined)delete process.env.RESEND_API_KEY;else process.env.RESEND_API_KEY=oldKey;}
});
test('streamed JSON preserves multibyte names split across network chunks',async()=>{
  const original=globalThis.fetch;const oldKey=process.env.RESEND_API_KEY;process.env.RESEND_API_KEY='re_test_only';let payload;
  globalThis.fetch=async(url,options)=>{payload=JSON.parse(options.body);return new Response(JSON.stringify({id:'mock-id'}));};
  const buffer=Buffer.from(JSON.stringify({...valid,prenom:'Néfélie'}));const split=buffer.indexOf(Buffer.from('é'))+1;
  try{
    const res=await request(undefined,{async *[Symbol.asyncIterator](){yield buffer.subarray(0,split);yield buffer.subarray(split);}});
    assert.equal(res.code,200);assert.ok(payload.subject.includes('Néfélie'));
  }finally{globalThis.fetch=original;if(oldKey===undefined)delete process.env.RESEND_API_KEY;else process.env.RESEND_API_KEY=oldKey;}
});
