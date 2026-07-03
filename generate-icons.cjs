const { chromium } = require('playwright')
const fs = require('fs')
const path = require('path')

async function main() {
  const dir = path.join(__dirname, 'client/public')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  const browser = await chromium.launch()
  const page = await browser.newPage()

  const html = (size) => `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
* { margin:0; padding:0; box-sizing:border-box; }
body {
  width:${size}px; height:${size}px; overflow:hidden;
  background:#0F0A1E;
  display:flex; align-items:center; justify-content:center;
}
.badge {
  width:${Math.round(size * 0.72)}px;
  height:${Math.round(size * 0.72)}px;
  border-radius:${Math.round(size * 0.18)}px;
  background: linear-gradient(135deg, #A855F7 0%, #EC4899 100%);
  display:flex; align-items:center; justify-content:center;
  box-shadow: 0 ${Math.round(size*0.05)}px ${Math.round(size*0.12)}px rgba(168,85,247,0.55);
}
.letter {
  color:#fff;
  font-size:${Math.round(size * 0.4)}px;
  font-weight:800;
  font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;
  letter-spacing:-0.02em;
  line-height:1;
}
</style></head>
<body><div class="badge"><span class="letter">N</span></div></body>
</html>`

  const targets = [
    { size: 180, name: 'apple-touch-icon.png' },
    { size: 192, name: 'icon-192.png' },
    { size: 512, name: 'icon-512.png' },
  ]

  for (const { size, name } of targets) {
    await page.setViewportSize({ width: size, height: size })
    await page.setContent(html(size), { waitUntil: 'load' })
    const outPath = path.join(dir, name)
    await page.screenshot({ path: outPath })
    console.log(`✓ ${name} (${size}x${size})`)
  }

  await browser.close()
  console.log('\nアイコン生成完了 → client/public/')
}

main().catch(e => { console.error(e); process.exit(1) })
