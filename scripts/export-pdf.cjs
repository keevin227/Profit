// Renders the deck to a PDF backup: one page per key moment, captured from the live animation.
// Usage: node scripts/export-pdf.cjs [out.pdf]   (needs Playwright with Chromium)
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const SITE = path.join(__dirname, '..', 'site');
const OUT = path.resolve(process.argv[2] || path.join(SITE, 'ValueGram-Profit.pdf'));
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
// [slide, step, wait ms]: the moments worth a page
const SHOTS = [[1,0,3200],[2,1,4200],[2,2,4200],[3,1,3200],[4,0,3500],[4,1,3500],[4,2,3500],[4,3,3500],[4,4,3500],[5,0,9500],[5,1,9500],
  [6,2,4200],[7,1,3200],[8,2,3000],[9,0,7500],[9,1,6500],[10,0,3000],[10,3,2600],[10,4,2600],[10,5,2600],[11,0,5200],[11,1,4000],
  [12,0,3000],[12,1,4200],[13,0,4000],[13,1,3200],[13,2,4000],[13,3,4000],[14,0,3500],[14,1,3500],[14,2,3500]];

const server = http.createServer((req, res) => {
  const p = path.join(SITE, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
  if (!p.startsWith(SITE) || !fs.existsSync(p)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
}).listen(0, async () => {
  const url = `http://localhost:${server.address().port}/`;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto(url + '#1');
  await page.waitForTimeout(1500);
  const imgs = [];
  for (const [i, s, wait] of SHOTS) {
    await page.evaluate(([a, b]) => { Deck.go(a, 0, 0); Deck.go(a, b, 1); }, [i - 1, s]);
    await page.waitForTimeout(wait);
    await page.evaluate(() => { document.querySelector('.hud').style.opacity = 0; document.querySelector('.hint') && (document.querySelector('.hint').style.opacity = 0); });
    imgs.push((await page.screenshot({ type: 'jpeg', quality: 82 })).toString('base64'));
    process.stdout.write('.');
  }
  const doc = await browser.newPage();
  await doc.setContent(`<style>@page{size:1920px 1080px;margin:0}body{margin:0;background:#06070a}img{display:block;width:1920px;height:1080px;page-break-after:always}</style>` +
    imgs.map(b => `<img src="data:image/jpeg;base64,${b}">`).join(''));
  await doc.pdf({ path: OUT, width: '1920px', height: '1080px', printBackground: true });
  await browser.close(); server.close();
  console.log(`\nWrote ${OUT} (${(fs.statSync(OUT).size / 1e6).toFixed(1)} MB, ${imgs.length} pages)`);
});
