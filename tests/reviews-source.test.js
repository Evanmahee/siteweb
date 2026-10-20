import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fetchAvisData } from '../src/avis-data.js';
const live={googleTotal:30,reviews:[{name:'Test',text:'Avis de test'}]};
test('live reviews take precedence over the static cache',async()=>{
  const original=globalThis.fetch;const calls=[];
  globalThis.fetch=async(url)=>{calls.push(url);return new Response(JSON.stringify(live),{headers:{'content-type':'application/json'}});};
  try{assert.equal((await fetchAvisData()).googleTotal,30);assert.deepEqual(calls,['/api/reviews']);}finally{globalThis.fetch=original;}
});
test('a failed reviews API falls back to local JSON',async()=>{
  const original=globalThis.fetch;const calls=[];
  globalThis.fetch=async(url)=>{calls.push(url);return url==='/api/reviews'?new Response('unavailable',{status:503}):new Response(JSON.stringify(live),{headers:{'content-type':'application/json'}});};
  try{assert.equal((await fetchAvisData()).reviews.length,1);assert.deepEqual(calls,['/api/reviews','/avis.json']);}finally{globalThis.fetch=original;}
});
