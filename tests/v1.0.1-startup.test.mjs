import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
const config=JSON.parse(fs.readFileSync(new URL('../app.config.json',import.meta.url),'utf8'));
const source=fs.readFileSync(process.env.LABEL_SHEET_TEST_SOURCE||new URL('../src/index.template.html',import.meta.url),'utf8');
import {boot} from './app-harness.mjs';
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
  const restored=boot(initialLanguage,storage.get('browser-kitty:ui-language:v1'));
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
