import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
const config=JSON.parse(fs.readFileSync(new URL('../app.config.json',import.meta.url),'utf8'));
const source=fs.readFileSync(process.env.LABEL_SHEET_TEST_SOURCE||new URL('../src/index.template.html',import.meta.url),'utf8');
// A dependency-free DOM boundary for executing the complete real application
// initializer. Behavioral suites separately test mutations and deferred work.
function boot(language, savedLanguage=null){
  const storage=new Map(savedLanguage ? [['labelSheetMaker.language',savedLanguage]] : []);
  const nodes=[],ids=new Map(),frames=[];
  class Element {
    constructor(tag='div',attrs={}){this.tagName=tag.toUpperCase();this.attrs={...attrs};this.id=attrs.id||'';this.dataset={};this.childNodes=[];this.style={};this.listeners=new Map();this.value=attrs.value||'';this.textContent='';this.hidden=Object.hasOwn(attrs,'hidden');this.disabled=false;this.open=false;this.clientWidth=680;this.isConnected=true;this.parentElement=null;this.selectedIndex=0;
      for(const [key,value] of Object.entries(attrs))if(key.startsWith('data-'))this.dataset[key.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=value;
      const classes=new Set((attrs.class||'').split(/\s+/));this.classList={contains:c=>classes.has(c),add:(...values)=>values.forEach(c=>classes.add(c)),remove:(...values)=>values.forEach(c=>classes.delete(c)),toggle(c,on){const next=on??!classes.has(c);next?classes.add(c):classes.delete(c);return next;}};
    }
    get options(){return this.childNodes.filter(n=>n.tagName==='OPTION');}get children(){return this.childNodes;}
    setAttribute(key,value){this.attrs[key]=String(value);}getAttribute(key){return this.attrs[key]??null;}removeAttribute(key){delete this.attrs[key];}
    append(...children){this.childNodes.push(...children);for(const child of children)child.parentElement=this;}replaceChildren(...children){this.childNodes=[];this.append(...children);}
    addEventListener(type,fn){this.listeners.set(type,fn);}setCustomValidity(message){this.validationMessage=message;}
    closest(selector){return matches(this,selector)?this:this.parentElement?.closest(selector)||null;}
    querySelectorAll(selector){return this.childNodes.flatMap(child=>[...(matches(child,selector)?[child]:[]),...child.querySelectorAll(selector)]);}querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
    cloneNode(deep=false){const n=new Element(this.tagName,this.attrs);n.textContent=this.textContent;if(deep)n.append(...this.childNodes.map(c=>c.cloneNode(true)));return n;}
    focus(){document.activeElement=this;}scrollIntoView(){}getBoundingClientRect(){return {x:0,y:0,left:0,top:0,right:680,bottom:500,width:680,height:500};}
    getContext(){return {font:'',measureText:text=>({width:text.length*6})};}
    showModal(){this.open=true;}close(){this.open=false;}
  }
  function matches(node,selector){selector=selector.trim();if(selector.includes(','))return selector.split(',').some(s=>matches(node,s));if(selector.includes(' '))return matches(node,selector.split(' ').at(-1));if(selector.startsWith('#'))return node.id===selector.slice(1);if(selector.startsWith('.'))return node.classList.contains(selector.slice(1));const attr=selector.match(/^\[([^=\]]+)(?:=['"]?([^'"\]]+)['"]?)?\]$/);if(attr)return Object.hasOwn(node.attrs,attr[1])&&(attr[2]===undefined||node.attrs[attr[1]]===attr[2]);if(selector==='dialog[open]')return node.tagName==='DIALOG'&&node.open;return node.tagName===selector.toUpperCase();}
  for(const match of source.slice(0,source.indexOf('<script>')).matchAll(/<([a-z][a-z0-9-]*)\b([^>]*)>/gi)){const attrs={};for(const attr of match[2].matchAll(/([a-zA-Z][\w:-]*)(?:="([^"]*)"|='([^']*)')?/g))attrs[attr[1]]=attr[2]??attr[3]??'';const node=new Element(match[1],attrs);nodes.push(node);if(node.id)ids.set(node.id,node);if(node.dataset.dimension||node.dataset.integer)node.parentElement=new Element('div',{class:'field'});}
  const document={documentElement:new Element('html'),body:new Element('body'),head:new Element('head'),activeElement:null,fonts:{ready:Promise.resolve()},querySelectorAll:selector=>nodes.filter(n=>matches(n,selector)),querySelector:selector=>nodes.find(n=>matches(n,selector))||null,getElementById:id=>ids.get(id)||null,createElement:tag=>new Element(tag),createElementNS:(_,tag)=>new Element(tag),addEventListener(){}};
  const window={innerWidth:1360,innerHeight:900,matchMedia:()=>({matches:false}),addEventListener(){},scrollTo(){}};
  const context=vm.createContext({console,window,document,Element,HTMLElement:Element,HTMLInputElement:class extends Element{},HTMLSelectElement:class extends Element{},HTMLTextAreaElement:class extends Element{},navigator:{language},localStorage:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)},requestAnimationFrame:fn=>frames.push(fn),setTimeout:()=>0,clearTimeout(){},Intl,Date,TextEncoder,TextDecoder,Uint8Array,Blob,URL,atob,btoa});
  let html=source.replace('__APP_CONFIG_JSON__',JSON.stringify(config)).replace('__BUILD_MANIFEST_JSON__','{"dependencies":[]}').replace('__EMBEDDED_ASSET_BUNDLE_JSON__','{"dependencies":{}}');
  for(const [,attrs,body] of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)){if(/application\/(?:json|octet-stream)/.test(attrs))continue;vm.runInContext(body,context);}
  while(frames.length)frames.shift()();
  return {ids,window,document,storage};
}
for(const language of ['en','ja'])test(`complete ${language} application initializes controls, translation, preview, and editing`,()=>{const {ids,window}=boot(language);assert.equal(ids.get('versionBadge').textContent,`v${config.version}`);assert.equal(ids.get('labelWidth').value,'66');assert.equal(ids.get('columns').value,'3');assert.equal(ids.get('saveGeneratedPdf').disabled,true);assert.ok(ids.get('paperPreviewSvg').childNodes.length>24);assert.ok(ids.get('paperPage').classList.contains('is-active'));assert.ok(window.AppToast);ids.get('addTextButton').listeners.get('click')();assert.equal(ids.get('editorEmpty').hidden,true);ids.get('languageButton').listeners.get('click')();assert.equal(ids.get('languageButton').textContent,language==='en'?'EN':'JA');});

// Removing the finite-number display guard must expose NaN/Infinity here.
// Run the real input/change/blur handlers and complete application renderer.
for(const language of ['ja','en'])for(const unit of ['mm','in'])test(`${language}/${unit}: invalid paper dimension drafts show an unavailable metric without committing work`,()=>{
  const {ids,storage}=boot(language);
  ids.get('paperSizeSelect').listeners.get('change')({target:{value:'custom'}});
  if(unit==='in')ids.get('unitIn').listeners.get('click')();
  ids.get('addTextButton').listeners.get('click')();
  for(const key of ['paperWidth','paperHeight','labelWidth','labelHeight']){
    const input=ids.get(key),original=input.value,metric=ids.get(key.startsWith('paper')?'paperMetric':'labelMetric');
    const originalMetric=metric.textContent;
    const stored=storage.get('labelSheetMaker.settings.v1');
    const editorMetric=ids.get('labelCanvasMetric').textContent;
    const editorViewBox=ids.get('labelEditorSvg').getAttribute('viewBox');
    for(const draft of ['', ' ', '-', '1e', 'NaN', 'Infinity', '-Infinity', '1e999']){
      input.value=draft;
      for(const event of ['input','change','blur']){
        input.listeners.get(event)();
        assert.match(metric.textContent,/—/,`${key}/${JSON.stringify(draft)}/${event}`);
        assert.doesNotMatch(metric.textContent,/NaN|Infinity|∞/);
        assert.equal(input.value,draft,'do not replace an unfinished input');
        assert.equal(input.getAttribute('aria-invalid'),'true');
        assert.ok(input.validationMessage);
        assert.equal(ids.get('saveGeneratedPdf').disabled,true);
        assert.equal(storage.get('labelSheetMaker.settings.v1'),stored);
        assert.equal(ids.get('labelCanvasMetric').textContent,editorMetric);
        assert.equal(ids.get('labelEditorSvg').getAttribute('viewBox'),editorViewBox);
        assert.equal(ids.get('editorEmpty').hidden,true);
      }
    }
    input.value=original;
    input.listeners.get('input')();
    input.listeners.get('change')();
    assert.equal(metric.textContent,originalMetric);
    assert.equal(input.getAttribute('aria-invalid'),'false');
  }
});

for(const language of ['ja','en'])test(`${language}: finite zero and negative draft values stay visible with validation`,()=>{
  const {ids,storage}=boot(language),input=ids.get('labelWidth'),stored=storage.get('labelSheetMaker.settings.v1');
  for(const draft of ['0','-5']){
    input.value=draft;input.listeners.get('input')();input.listeners.get('change')();
    assert.equal(ids.get('labelMetric').textContent,`${language==='ja'?'ラベル':'Label'} ${draft} × 33.9 mm`);
    assert.equal(input.getAttribute('aria-invalid'),'true');
    assert.equal(storage.get('labelSheetMaker.settings.v1'),stored);
  }
});

for(const initialLanguage of ['ja','en'])test(`${initialLanguage}: header labels, accessibility, privacy and version survive toggles and saved language`,()=>{
  const {ids,document,storage}=boot(initialLanguage),button=ids.get('languageButton');
  for(let count=0;count<4;count++){
    const language=count%2?(initialLanguage==='ja'?'en':'ja'):initialLanguage;
    const hint=language==='ja'?'英語に切り替え':'Switch to Japanese';
    assert.equal(button.textContent,language==='ja'?'EN':'JA');
    assert.equal(button.getAttribute('aria-label'),hint);
    assert.equal(button.title,hint);
    assert.equal(document.documentElement.lang,language);
    assert.equal(document.querySelector('[data-i18n="localBadge"]').textContent,language==='ja'?'完全ローカル処理':'Fully local processing');
    assert.equal(ids.get('versionBadge').textContent,`v${config.version}`);
    button.listeners.get('click')();
  }
  button.listeners.get('click')();
  const restored=boot(initialLanguage,storage.get('labelSheetMaker.language'));
  assert.equal(restored.document.documentElement.lang,initialLanguage==='ja'?'en':'ja');
  assert.equal(restored.ids.get('languageButton').textContent,initialLanguage==='ja'?'JA':'EN');
});
test('initial Japanese header matches its canonical version and target language',()=>{
  assert.equal(source.match(/id="versionBadge">([^<]+)</)[1],`v${config.version}`);
  const button=source.match(/<button[^>]*id="languageButton"[^>]*>[^<]*<\/button>/)[0];
  assert.match(button,/>EN<\/button>/);
  assert.match(button,/aria-label="英語に切り替え"/);
  assert.match(button,/title="英語に切り替え"/);
});
