import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {mountDemo} from './demo.js';

// Normal installs use jsdom from this repo; offline review can point to an
// already installed copy without changing the site's dependency lockfile.
const require=createRequire(process.env.REI_DEMO_TEST_PACKAGE || import.meta.url);
const {JSDOM}=require('jsdom');
function setup() {
  const dom=new JSDOM(readFileSync(new URL('./index.html',import.meta.url),'utf8'),{url:'https://example.com/projects/rei/demo/#today',pretendToBeVisual:true});
  const {document}=dom.window;
  dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
  dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;};
  let networkCalls=0;
  dom.window.fetch=()=>{networkCalls++;throw new Error('Network must not be used');};
  mountDemo(document,dom.window);
  const click=selector=>{const el=document.querySelector(selector);assert.ok(el,`Expected ${selector}`);el.click();};
  const route=name=>{dom.window.history.replaceState(null,'',`#${name}`);dom.window.dispatchEvent(new dom.window.HashChangeEvent('hashchange'));};
  return{dom,document,click,route,networkCalls:()=>networkCalls};
}
test('message → sample briefing → approve task → calendar, without duplicates or network',()=>{
  const s=setup();try{
    s.route('messages');s.click('[data-message="worksheet"]');
    assert.equal(s.document.querySelector('#message-dialog').open,true);
    assert.match(s.document.querySelector('#message-content').textContent,/Friday, 23 October at 12:00/);
    s.click('#message-content [data-action="summarize"]');
    // Hash navigation is async in browsers; deliver the event explicitly here.
    s.route('assistant');assert.match(s.document.querySelector('#screen').textContent,/Prewritten, no AI call/);
    s.click('[data-action="approve"]');assert.equal(s.document.querySelectorAll('[data-action="approve"]').length,0);
    s.route('tasks');assert.equal([...s.document.querySelectorAll('strong')].filter(n=>n.textContent==='Submit Worksheet 2').length,1);
    s.route('calendar');s.click('[data-date="2026-10-23"]');
    assert.match(s.document.querySelector('.calendar-detail').textContent,/Submit Worksheet 2/);
    assert.equal(s.networkCalls(),0);
  }finally{s.dom.window.close();}
});
test('add, complete, navigate, reset and refresh preserve only demo-session changes',()=>{
  const s=setup();try{
    s.click('[data-action="add"]');const form=s.document.querySelector('#task-form');
    form.elements.namedItem('title').value='Prepare my presentation';
    form.elements.namedItem('date').value='2026-10-21';form.elements.namedItem('time').value='15:30';
    form.dispatchEvent(new s.dom.window.Event('submit',{bubbles:true,cancelable:true}));
    assert.equal(s.document.querySelector('#editor').open,false);
    assert.match(s.document.querySelector('.timeline').textContent,/Prepare my presentation/);
    s.click('[data-complete="added-1"]');s.route('tasks');
    assert.equal(s.document.querySelector('[data-complete="added-1"]').checked,true);
    s.route('calendar');assert.match(s.document.querySelector('.calendar-detail').textContent,/Prepare my presentation/);
    s.click('#reset-demo');s.route('tasks');assert.doesNotMatch(s.document.querySelector('#screen').textContent,/Prepare my presentation/);
    assert.equal(s.dom.window.localStorage.length,0);assert.equal(s.dom.window.sessionStorage.length,0);
  }finally{s.dom.window.close();}
});
test('scheduled occurrence completion is independent and scheduled list has no due date',()=>{
  const s=setup();try{
    s.click('[data-complete="math:2026-10-19"]');
    assert.equal(s.document.querySelector('[data-complete="math:2026-10-19"]').checked,true);
    s.click('[data-day="2026-10-22"]');assert.equal(s.document.querySelector('[data-complete="math:2026-10-22"]').checked,false);
    s.route('tasks');s.click('[data-filter="scheduled"]');
    assert.match(s.document.querySelector('#screen').textContent,/Every Monday & Thursday/);
    assert.doesNotMatch(s.document.querySelector('#screen').textContent,/due date/i);
  }finally{s.dom.window.close();}
});
test('search, original messages, calendar boundaries, and unknown route work',()=>{
  const s=setup();try{
    s.route('messages');const search=s.document.querySelector('#message-search');search.value='worksheet 2';search.dispatchEvent(new s.dom.window.Event('input',{bubbles:true}));
    assert.equal(s.document.querySelectorAll('.message-row').length,1);
    s.click('.message-row');assert.match(s.document.querySelector('#message-content').textContent,/Fictional demo message/);
    s.route('calendar');s.click('[data-month="1"]');assert.match(s.document.querySelector('.calendar-toolbar').textContent,/November 2026/);
    s.click('[data-action="today"]');assert.match(s.document.querySelector('.calendar-toolbar').textContent,/October 2026/);
    s.route('unknown');assert.match(s.document.querySelector('h1').textContent,/Today/);
  }finally{s.dom.window.close();}
});
test('user input is rendered as text; HTML handlers cannot become active markup',()=>{
  const s=setup();try{
    s.click('[data-action="add"]');const form=s.document.querySelector('#task-form');
    form.elements.namedItem('title').value='<img src=x onerror=alert(1)>';
    form.dispatchEvent(new s.dom.window.Event('submit',{bubbles:true,cancelable:true}));
    assert.equal(s.document.querySelectorAll('#screen img').length,0);
    assert.match(s.document.querySelector('#screen').textContent,/<img src=x onerror=alert\(1\)>/);
  }finally{s.dom.window.close();}
});
