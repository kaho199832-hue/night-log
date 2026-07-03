const { chromium } = require('playwright')
const path = require('path')
const fs = require('fs')

const BASE_URL = 'http://localhost:5173'
const OUT_DIR = path.join(__dirname, 'screenshots')

async function shot(page, name) {
  const file = path.join(OUT_DIR, `${name}.png`)
  await page.screenshot({ path: file })
  console.log(`  saved: screenshots/${name}.png`)
}

async function clickNav(page, text) {
  for (const btn of await page.locator('button').all()) {
    if ((await btn.textContent())?.includes(text)) {
      await btn.click()
      await page.waitForTimeout(800)
      return true
    }
  }
  return false
}

;(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true })

  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page = await ctx.newPage()

  console.log('Connecting to', BASE_URL, '...')
  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 8000 })
  } catch {
    console.error('Error: http://localhost:5173 に接続できません。')
    console.error('先に以下のコマンドでサーバーを起動してください:')
    console.error('  ターミナル1: cd server && npm start')
    console.error('  ターミナル2: cd client && npm run dev')
    await browser.close()
    process.exit(1)
  }

  await page.waitForTimeout(1200)

  // ホーム
  await shot(page, '1_home')

  // 設定
  await clickNav(page, '⚙️')
  await shot(page, '2_settings')
  await clickNav(page, '‹')

  // 顧客一覧
  await clickNav(page, '顧客')
  await shot(page, '3_customers')

  // 売上レポート
  await clickNav(page, 'レポート')
  await shot(page, '4_report')

  await browser.close()
  console.log('\nDone! screenshots/ フォルダを確認してください。')
})()
