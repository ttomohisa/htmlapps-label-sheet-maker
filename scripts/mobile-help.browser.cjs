'use strict';
// Run against the official generated files in the unprivileged PR build job.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');
const buildSelector = 'details.build-details';


async function prepareApp(page,width,label){
 assert.equal(await page.locator('.app-mobile-bottom-bar').isVisible(),width<=600,label+': functional workflow navigation preserved');
 if(width<=600) assert.ok(await page.locator('.app-mobile-bottom-bar').evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight+1;}),label+': functional bar fits viewport');
}
async function smoke(page,results,file){
 await page.locator('.app-mobile-bottom-bar [data-page="labelPage"]').click();await page.locator('#addTextButton').click();
 await page.locator('.app-mobile-bottom-bar [data-page="outputPage"]').click();await page.locator('#outputFilename').fill('mobile-help-labels.pdf');
 await page.locator('#createPrintPdf').click();await page.locator('#outputResult').waitFor({state:'visible',timeout:40000});
 const pending=page.waitForEvent('download');await page.locator('#saveGeneratedPdf').click();const download=await pending;assert.equal(download.suggestedFilename(),'mobile-help-labels.pdf');
 const target=path.join(results,file.includes('self-extract')?'synthetic-loader.pdf':'synthetic-readable.pdf');await download.saveAs(target);const bytes=fs.readFileSync(target);assert.ok(bytes.length>500);assert.equal(bytes.subarray(0,5).toString(),'%PDF-');assert.match(bytes.toString('latin1'),/\/Type\s*\/Page\b/);
 console.log('PASS synthetic label to edited-name PDF '+file);
}

async function main() {
  const results = path.resolve(__dirname, '..', 'test-results', 'mobile-help');
  fs.mkdirSync(results, { recursive: true });
  const browser = await chromium.launch();
  try {
    for (const file of ['dist/index.html', 'dist/index.self-extract.html', 'label-sheet-maker.html']) {
      for (const language of ['ja', 'en']) {
        for (const [width, height] of [[1360, 900], [821, 700], [820, 700], [601, 568], [600, 568], [390, 844], [360, 640], [320, 568], [393, 252]]) {
          const context = await browser.newContext({ viewport: { width, height }, locale: language, reducedMotion: 'reduce' });
          const page = await context.newPage();
          const errors = [], requests = [];
          page.on('pageerror', error => errors.push(error.message));
          page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
          page.on('request', request => { if (/^https?:/.test(request.url())) requests.push(request.url()); });
          const label = `${file} ${language} ${width}x${height}`;
          try {
            await page.goto(pathToFileURL(path.resolve(__dirname, '..', file)).href);
            await page.locator('#helpButton').waitFor();
            if (await page.locator('html').getAttribute('lang') !== language) await page.locator('#languageButton').click();
            await page.locator('#languageButton').click();await page.locator('#languageButton').click();
            assert.equal(await page.locator('html').getAttribute('lang'),language,label+': repeated language toggles');
            for(const id of ['buildVersion','builtAt','dependencyCount']){assert.equal(await page.locator('#'+id).count(),1,label+': unique metadata after toggles');assert.ok(!['','—','-'].includes((await page.locator('#'+id).textContent()).trim()),label+': populated metadata after toggles');}
            assert.equal(await page.locator('[data-i18n="localBadge"]').textContent(), language === 'en' ? 'Fully local processing' : '完全ローカル処理', label);
            assert.equal(await page.locator('.local-badge').isVisible(),width>820,label+': local badge hidden at narrow-layout breakpoint');
            if(width>820) assert.ok(await page.locator('.local-badge').evaluate(el => {
              const box = el.getBoundingClientRect();
              const range = document.createRange();
              range.selectNodeContents(el.querySelector('[data-i18n="localBadge"]'));
              return box.left >= 0 && box.right <= innerWidth && el.scrollWidth <= el.clientWidth + 1
                && [...range.getClientRects()].every(rect => rect.left >= box.left - 1 && rect.right <= box.right + 1 && rect.top >= box.top - 1 && rect.bottom <= box.bottom + 1);
            }), label + ': badge text fits');
            assert.equal(await page.locator('main #buildVersion').count(), 0, label);
            assert.equal(await page.locator('footer').isVisible(), width > 600, label);
            await prepareApp(page, width, label);
            const intro = page.locator('.page-intro');
            assert.equal(await intro.isVisible(), true, label + ': introduction on Paper');
            assert.equal(await intro.locator('h1').count(), 0, label + ': no redundant hero heading');
            const project = page.locator('#projectDropZone');
            const summary = project.locator('summary');
            assert.equal(await project.getAttribute('open'), null, label + ': project collapsed by default');
            assert.equal(await page.locator('#openProjectButton').isVisible(), false, label + ': open button initially hidden');
            await summary.focus();
            await page.keyboard.press('Enter');
            assert.equal(await project.getAttribute('open'), '', label + ': keyboard disclosure');
            for (const id of ['openProjectButton','saveProjectButton']) {
              const button = page.locator('#'+id);
              assert.equal(await button.isVisible(), true, label + ': '+id+' visible');
              const box = await button.boundingBox();
              assert.ok(box && box.x >= 0 && box.x + box.width <= width + 1, label + ': '+id+' fits');
            }
            await summary.click();
            assert.equal(await project.getAttribute('open'), null, label + ': closes by pointer');
            const nav = page.locator(width <= 600 ? '.app-mobile-bottom-bar' : '#desktopStepNav');
            // Visit Sheet before adding an element, so the empty-label warning is real.
            if(width>600) {
              await nav.locator('[data-page="sheetPage"]').click();
              const warning=page.locator('#sheetStatusMessage');
              await warning.waitFor({state:'visible'});
              const expected=language==='ja'?'ラベルが空です。配置のみ確認できます。':'Empty label — layout preview only.';
              await page.waitForFunction(expected=>document.querySelector('#sheetStatusMessage').textContent===expected,expected);
              const geometry=await warning.evaluate(el=>{const range=document.createRange();range.selectNodeContents(el);return {width:el.clientWidth,lines:new Set([...range.getClientRects()].map(r=>Math.round(r.top))).size};});
              assert.equal(geometry.lines,1,label+': empty-label warning fits on one line '+JSON.stringify(geometry));
            }
            for (const step of ['paperPage','labelPage','sheetPage','outputPage','paperPage']) {
              await nav.locator('[data-page="'+step+'"]').click();
              assert.equal(await page.locator('#'+step).isVisible(), true, label + ': active '+step);
              assert.equal(await intro.isVisible(), false, label + ': introduction stays hidden on '+step);
              assert.equal(await summary.isVisible(), true, label + ': project remains reachable on '+step);
              assert.equal(await page.locator('.local-badge').isVisible(), false, label + ': local badge stays hidden');
              if(width>600) {
                // Wait for the navigation render and explicit scroll reset, then
                // sample both rectangles in one browser frame (not two protocol calls).
                const geometry = await page.evaluate(async () => {
                  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
                  const header = document.querySelector('.app-header').getBoundingClientRect();
                  const tabs = document.querySelector('#desktopStepNav').getBoundingClientRect();
                  const padding = parseFloat(getComputedStyle(document.querySelector('main')).paddingTop);
                  return {headerBottom:header.bottom, tabsTop:tabs.top, gap:tabs.top-header.bottom, scrollY, padding};
                });
                console.log('WORKFLOW '+label+' '+step+' '+JSON.stringify(geometry));
                assert.ok(Math.abs(geometry.scrollY)<=1,label+': scroll reset '+JSON.stringify(geometry));
                assert.ok(Math.abs(geometry.gap-14)<=2,label+': workflow sits just below header '+JSON.stringify(geometry));
              }
              if(step!=='labelPage') {
                assert.equal(await page.locator('#mobileSelectionBar').isVisible(),false,label+': selection bar absent on '+step);
                assert.equal(await page.locator('body').evaluate(el=>el.classList.contains('has-mobile-selection-bar')),false,label+': no stale reserved bottom space');
              }
              if(step==='labelPage' && height>=500) {
                assert.equal(await page.locator('#labelCanvasTitle').count(),0,label+': canvas title removed');
                await page.locator('#addTextButton').click();
                assert.equal(await page.locator('#mobileSelectionBar').isVisible(),width<=600,label+': selected element bar only on mobile Label');
                if(width<=820) {
                  const tool=await page.locator('.editor-toolbar').boundingBox(), first=await page.locator('#undoButton').boundingBox(), last=await page.locator('#deleteElementButton').boundingBox();
                  if(width>380)assert.ok(first&&last&&Math.abs(first.y-last.y)<=2,label+': single action row '+JSON.stringify({first,last,tool}));
                  else assert.equal(last,null,label+': narrow phone uses fixed selection actions');
                }
                const mode=page.locator('#dataModeSelect'),originalMode=await mode.inputValue();
                const drop=page.locator('#dataDropZone');
                await mode.selectOption('merge');
                await drop.waitFor({state:'visible'});
                const dropGeometry=await drop.evaluate(el=>{
                  const box=el.getBoundingClientRect();
                  return {width:box.width,lines:[...el.children].map(child=>{const range=document.createRange();range.selectNodeContents(child);return new Set([...range.getClientRects()].map(r=>Math.round(r.top))).size;})};
                });
                console.log('DATA DROP '+label+' '+JSON.stringify(dropGeometry));
                assert.deepEqual(dropGeometry.lines,[1,1],label+': compact drop zone '+JSON.stringify(dropGeometry));
                await mode.selectOption(originalMode);
                assert.equal(await drop.isVisible(),originalMode==='merge',label+': restored print mode');
                if(width<=767) {
                  assert.equal(await page.locator('#imageFileFallbackButton').isVisible(),false,label+': no stray file selection');
                  await page.locator('#addImageButton').click();
                  assert.equal(await page.locator('#imageSourceDialog').isVisible(),true,label+': mobile image source dialog');
                  assert.equal(await page.locator('#imageFileFallbackButton').isVisible(),true,label+': file choice in dialog');
                  await page.keyboard.press('Escape');
                  assert.equal(await page.locator('#imageSourceDialog').isVisible(),false,label+': source dialog Escape');
                }
                const alignment=page.locator('[data-align-axis="hAlign"][data-align-value="center"]');
                await alignment.evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));
                await alignment.click();
                assert.equal(await alignment.getAttribute('aria-pressed'),'true',label+': alignment selection');
                assert.equal(await page.locator('#hAlign').inputValue(),'center',label+': actual text alignment updated');
                for(const id of ['centerHorizontalButton','centerVerticalButton']) {
                  const control=page.locator('#'+id);
                  await control.evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));
                  await control.click();
                }
              }
              if(step==='sheetPage' && height>=500) {
                await page.locator('#invertUsedButton').click();
                await page.locator('#markAllAvailableButton').click();
              }
            }

            assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), label + ': page width');

            await page.locator('#helpButton').click();
            const body = page.locator('#helpDialog .dialog-body');
            assert.ok(await body.evaluate(el => el.lastElementChild.contains(document.querySelector('#buildVersion'))), label + ': build is final body child');
            assert.equal(await page.locator(buildSelector).count(), 1, label);
            assert.equal(await page.locator(buildSelector).isVisible(), true, label);
            for (const id of ['buildVersion', 'builtAt', 'dependencyCount']) assert.equal(await page.locator('#' + id).count(), 1, label);

            if (await page.locator(buildSelector).getAttribute('open') === null) {
              const summary = page.locator(buildSelector).locator('summary');
              await summary.focus();
              await page.keyboard.press('Enter');
              assert.equal(await page.locator(buildSelector).getAttribute('open'), '', label);
              assert.notEqual(await page.locator('#buildVersion').innerText(), '—', label);
              assert.match(await page.locator('#builtAt').innerText(), /\d{4}/, label + ': populated build timestamp');
            }
            // This existing modal uses the dialog itself as its scroll container.
            await page.locator('#helpDialog').evaluate(el => { el.scrollTop = el.scrollHeight; });
            const finalItem = page.locator('#dependencyCount');
            const finalBox = await finalItem.boundingBox(), bodyBox = await body.boundingBox();
            console.log('GEOMETRY ' + label + ' ' + JSON.stringify({ finalBox, bodyBox, viewportHeight: height }));
            assert.ok(finalBox && bodyBox && finalBox.y >= 0 && finalBox.y + finalBox.height <= height && finalBox.y >= bodyBox.y - 1 && finalBox.y + finalBox.height <= bodyBox.y + bodyBox.height + 1, label + ': final Help item reachable');
            assert.ok(await body.evaluate(el => el.scrollWidth <= el.clientWidth + 1), label + ': Help width');
            const headerBox = await page.locator('#helpDialog .dialog-header').boundingBox();
            assert.ok(headerBox && headerBox.x >= 0 && headerBox.x + headerBox.width <= width && headerBox.y >= 0 && headerBox.y + headerBox.height <= height, label + ': header visible');
            const closeBox=await page.locator('#closeHelpButton').boundingBox();
            assert.ok(closeBox && closeBox.x>=0 && closeBox.x+closeBox.width<=width && closeBox.y>=headerBox.y && closeBox.y+closeBox.height<=headerBox.y+headerBox.height+1,label+': Close fits header');
            if (file === 'dist/index.html' && [1360, 320].includes(width)) {
              await page.screenshot({ path: path.join(results, `help-${language}-${width}.png`) });
            }
            const dialogBox = await page.locator('#helpDialog').boundingBox();
            assert.ok(finalBox.y >= dialogBox.y - 1 && finalBox.y + finalBox.height <= dialogBox.y + dialogBox.height + 1, label + ': final item inside dialog');
            assert.ok(dialogBox.y > 1, label + ': top coordinate is genuine backdrop');
            const beforeScroll = await page.evaluate(() => scrollY);
            await page.mouse.move(2, 1);
            await page.mouse.wheel(0, 400);
            await page.waitForTimeout(100);
            assert.equal(await page.evaluate(() => scrollY), beforeScroll, label + ': background locked');
            await page.keyboard.press('Escape');
            assert.equal(await page.locator('#helpDialog').isVisible(), false, label + ': Escape');
            await page.locator('#helpButton').click();
            await page.locator('#closeHelpButton').click();
            assert.equal(await page.locator('#helpDialog').isVisible(), false, label + ': reopen and Close');
            await page.locator('#helpButton').click();
            await page.mouse.click(2, 1);
            assert.equal(await page.locator('#helpDialog').isVisible(), false, label + ': backdrop');
            if(file!=='label-sheet-maker.html' && language==='ja' && width===360) await smoke(page,results,file);
            assert.deepEqual(errors, [], label + ': console errors');
            assert.deepEqual(requests, [], label + ': external runtime requests');
            console.log('PASS ' + label);
          } catch (error) {
            await page.screenshot({ path: path.join(results, `failure-${file.replace(/[^a-z0-9]/gi, '-')}-${language}-${width}x${height}.png`) }).catch(() => {});
            throw error;
          } finally {
            await context.close();
          }
        }
      }
    }
  } finally {
    await browser.close();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
