import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../stage.js', import.meta.url), 'utf8').replace("import { gsap } from 'gsap';", '');
const boot = readFileSync(new URL('../public/stage-boot.js', import.meta.url), 'utf8');
function setup({path='/',entered=false,reduced=false,pending=null,blocked=false}={}) {
  const events={}, data=new Map(), timers=[], animations=[];
  if(entered)data.set('reiandraaStageEntered','true');
  if(pending)data.set('reiandraaStageTransition',JSON.stringify(pending));
  const root={dataset:{},classList:{add(){},remove(){}}};
  const button={addEventListener(){}};
  const hint={hidden:true,style:{},querySelector:()=>button};
  const panels=[{},{}].map(panel => ({...panel, querySelector:()=>({setAttribute(){}})}));
  const content={inert:false};
  const overlay={querySelectorAll:()=>panels,querySelector:()=>hint,contains:()=>false};
  const document={documentElement:root,body:{children:[content],append(){}},createElement:()=>overlay,addEventListener:(n,cb)=>events['document:'+n]=cb,readyState:'complete',fonts:{ready:Promise.resolve()}};
  const location={href:'https://example.com'+path,pathname:path,assign(to){this.assigned=to;}};
  const context={document,location,URL,Date,innerHeight:800,sessionStorage:{getItem:k=>data.get(k)||null,setItem(k,v){if(blocked)throw Error();data.set(k,v)},removeItem:k=>data.delete(k)},matchMedia:()=>({matches:reduced,addEventListener(){}}),setTimeout:cb=>timers.push(cb),clearTimeout(){},gsap:{set:(el,props)=>Object.assign(el,props),to:(state,opts)=>{animations.push(()=>{state.value=opts.value;opts.onUpdate();opts.onComplete();});return{kill(){}};}}};
  context.window={scrollTo(){},addEventListener:(n,cb)=>events[n]=cb};
  vm.createContext(context);vm.runInContext(boot,context);vm.runInContext(source,context);
  const fire=(name,props={})=>{const event={preventDefault(){this.prevented=true},stopImmediatePropagation(){},...props};events[name]?.(event);return event;};
  const click=(href,props={})=>fire('document:click',{button:0,target:{closest:()=>({href,target:'',hasAttribute:()=>false})},...props});
  return {root,panels,content,data,animations,location,fire,click, quiet:()=>timers.at(-1)()};
}
test('wheel scrubs reversibly, locks content, then permanently releases',()=>{
 const s=setup();assert.equal(s.root.dataset.kelir,'intro');assert.equal(s.content.inert,true);
 s.fire('wheel',{deltaY:375,deltaMode:0});assert.equal(s.panels[0].xPercent,-50);
 s.fire('wheel',{deltaY:-150,deltaMode:0});assert.equal(s.panels[0].xPercent,-30);
 s.fire('wheel',{deltaY:600,deltaMode:0});assert.equal(s.root.dataset.kelir,'handoff');
 for (const deltaY of [180,90,45,12,3,-1]) { assert.equal(s.fire('wheel',{deltaY,deltaMode:0}).prevented,true);assert.equal(s.root.dataset.kelir,'handoff'); }
 s.quiet();assert.equal(s.root.dataset.kelir,undefined);assert.equal(s.content.inert,false);
 assert.equal(s.data.get('reiandraaStageEntered'),'true');s.fire('wheel',{deltaY:-900,deltaMode:0});assert.equal(s.panels[0].xPercent,-100);
});
test('touch supports repeated swipes and reverse movement',()=>{
 const s=setup();s.fire('touchstart',{touches:[{clientY:600}]});s.fire('touchmove',{touches:[{clientY:225}]});assert.equal(s.panels[0].xPercent,-50);
 s.fire('touchmove',{touches:[{clientY:375}]});assert.equal(s.panels[0].xPercent,-30);
 s.fire('touchend');s.fire('touchstart',{touches:[{clientY:700}]});s.fire('touchmove',{touches:[{clientY:100}]});assert.equal(s.root.dataset.kelir,'handoff');
 assert.equal(s.fire('touchmove',{touches:[{clientY:50}]}).prevented,true);s.fire('touchend');assert.equal(s.root.dataset.kelir,undefined);
});
test('refresh and reduced motion bypass intro; keyboard can skip',()=>{
 assert.equal(setup({entered:true}).root.dataset.kelir,undefined);
 assert.equal(setup({reduced:true}).root.dataset.kelir,undefined);
 const s=setup();s.fire('keydown',{key:'Tab'});assert.equal(s.content.inert,false);assert.equal(s.root.dataset.kelir,undefined);
});
test('home crossing navigates only after closing; duplicate clicks are blocked',()=>{
 const s=setup({entered:true});s.click('https://example.com/projects/');assert.equal(s.location.assigned,undefined);assert.equal(s.root.dataset.kelir,'closing');
 s.click('https://example.com/projects/rei/');assert.equal(s.animations.length,1);s.animations[0]();assert.ok(s.panels[0].xPercent === 0);assert.equal(s.location.assigned,'https://example.com/projects/');
});
test('inner to inner, modified clicks and same-page anchors stay native',()=>{
 const s=setup({path:'/projects/'});assert.equal(s.click('https://example.com/projects/rei/').prevented,undefined);
 assert.equal(s.click('https://example.com/',{ctrlKey:true}).prevented,undefined);assert.equal(s.animations.length,0);
 const h=setup({entered:true});assert.equal(h.click('https://example.com/#projects').prevented,undefined);
});
test('arrival opens automatically and back-forward cache unlocks content',async()=>{
 const s=setup({pending:{to:'https://example.com/',at:Date.now()}});assert.equal(s.root.dataset.kelir,'arrival');
 await new Promise(resolve=>setImmediate(resolve));s.animations[0]();assert.equal(s.root.dataset.kelir,undefined);
 s.click('https://example.com/projects/');s.fire('pageshow',{persisted:true});assert.equal(s.content.inert,false);assert.equal(s.root.dataset.kelir,undefined);
});
test('unavailable storage leaves navigation usable',()=>{
 const s=setup({entered:true,blocked:true});assert.equal(s.click('https://example.com/projects/').prevented,undefined);assert.equal(s.root.dataset.kelir,undefined);
});

test('held keyboard opening waits for release before page input',()=>{
 const s=setup(); for(let i=0;i<7;i++)s.fire('keydown',{key:'ArrowDown'});
 assert.equal(s.root.dataset.kelir,'handoff'); assert.equal(s.fire('keydown',{key:'ArrowDown',repeat:true}).prevented,true);
 s.fire('keyup',{key:'ArrowDown'});assert.equal(s.root.dataset.kelir,undefined);
 assert.equal(s.fire('wheel',{deltaY:120,deltaMode:0}).prevented,undefined);
});
