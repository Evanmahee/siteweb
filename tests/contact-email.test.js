import { test } from 'node:test';
import assert from 'node:assert/strict';
import { collectContactFormData, sendContactEmail } from '../src/contact-email.js';
function form() {
  return {elements:{prenom:{value:' Test '},nom:{value:'Contact'},email:{value:'test@example.test'},message:{value:'Salut'},confiance:{value:'0'}},querySelectorAll(selector){return selector.includes('type_accompagnement')?[{value:'distanciel'},{value:'complet'}]:[];}};
}
test('collect preserves zero scales, trims identity and combines checkbox answers',()=>{
  const data=collectContactFormData(form());
  assert.equal(data.prenom,'Test');assert.equal(data.confiance,'0');assert.equal(data.type_accompagnement,'distanciel, complet');assert.equal(data.website,'');
});
test('retries keep the same request ID; altered or completed submissions receive a new one',async()=>{
  const original=globalThis.fetch;const sent=[];let success=false;
  globalThis.fetch=async(url,options)=>{assert.equal(url,'/api/send-email');assert.ok(options.signal);sent.push(JSON.parse(options.body));return new Response(JSON.stringify(success?{success:true}:{error:'Trop de tentatives.'}),{status:success?200:429});};
  try{
    const f=form();await assert.rejects(sendContactEmail(f),/Trop de tentatives/);await assert.rejects(sendContactEmail(f));
    assert.equal(sent[0].requestId,sent[1].requestId);
    f.elements.message.value='Autre message';success=true;await sendContactEmail(f);assert.notEqual(sent[1].requestId,sent[2].requestId);
    await sendContactEmail(f);assert.notEqual(sent[2].requestId,sent[3].requestId);
  }finally{globalThis.fetch=original;}
});
test('invalid JSON, null responses, false success and connection failures reject cleanly',async()=>{
  const original=globalThis.fetch;
  try{
    for(const text of ['<html>Bad gateway</html>','null','{"success":false}']){
      globalThis.fetch=async()=>new Response(text);await assert.rejects(sendContactEmail(form()));
    }
    globalThis.fetch=async()=>{throw new TypeError('network failed');};await assert.rejects(sendContactEmail(form()),/Connexion interrompue/);
  }finally{globalThis.fetch=original;}
});
