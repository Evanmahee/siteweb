import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// Minimal DOM fixture: run the real wizard listeners without a browser or network.
function setup() {
  const classes=()=>({add(){},remove(){},toggle(){},contains(name){return name==='form-wizard';}});
  const field=()=>({valid:true,custom:'',willValidate:true,checkValidity(){return this.valid&&!this.custom;},reportValidity(){},focus(){},setCustomValidity(s){this.custom=s;},closest(){return this.panel.hidden?this.panel:null;}});
  const identity=field(),budget=field();
  const panels=Array.from({length:6},(_,i)=>({hidden:i!==0,classList:classes(),getAttribute(){return String(i+1);},toggleAttribute(name,hidden){this.hidden=hidden;},querySelectorAll(selector){return selector==='[data-required-group]'?[]:i===0?[identity]:i===5?[budget]:[];}}));
  identity.panel=panels[0];budget.panel=panels[5];
  const controls=Object.fromEntries(['.form-wizard__back','.form-wizard__next','.form-wizard__submit'].map(name=>[name,{listeners:{},addEventListener(event,fn){this.listeners[event]=fn;}}]));
  const events={};
  const form={dataset:{},classList:classes(),closest(){return null;},querySelector(selector){if(controls[selector])return controls[selector];const match=selector.match(/data-step="(\d+)"/);if(match && selector.endsWith(']')) return panels[Number(match[1])-1];if(match)return Number(match[1])===1?identity:Number(match[1])===6?budget:null;return null;},querySelectorAll(selector){return selector==='.form-wizard__step'?panels:[];},addEventListener(name,fn){(events[name]??=[]).push(fn);}};
  const window={matchMedia(){return{matches:false};},setTimeout(){}};
  const context={window,document:{readyState:'complete',getElementById(){return form;}}};
  vm.runInNewContext(readFileSync(new URL('../src/contact-wizard.js',import.meta.url),'utf8'),context);
  function submit(){const e={prevented:false,stopped:false,preventDefault(){this.prevented=true;},stopImmediatePropagation(){this.stopped=true;}};events.submit[0](e);return e;}
  return{api:window.contactWizard,identity,budget,submit,form};
}
test('Enter before the last step advances without allowing an email submission',()=>{
  const f=setup();assert.equal(f.api.getStep(),1);const e=f.submit();assert.equal(f.api.getStep(),2);assert.equal(e.prevented,true);assert.equal(e.stopped,true);
});
test('invalid identity cannot advance and earlier panels are checked again on final submit',()=>{
  const f=setup();f.identity.valid=false;assert.equal(f.submit().prevented,true);assert.equal(f.api.getStep(),1);
  f.api.setStep(6);assert.equal(f.submit().prevented,true);assert.equal(f.api.getStep(),1);
});
test('invalid final panel prevents send; a valid complete form proceeds',()=>{
  const f=setup();f.api.setStep(6);f.budget.valid=false;assert.equal(f.submit().prevented,true);assert.equal(f.api.getStep(),6);
  f.budget.valid=true;assert.equal(f.submit().prevented,false);
});
test('step API clamps unexpected values and initialization binds the form once',()=>{
  const f=setup();f.api.setStep(999);assert.equal(f.api.getStep(),6);f.api.setStep('bad');assert.equal(f.api.getStep(),1);assert.equal(f.form.dataset.wizardBound,'true');
});
