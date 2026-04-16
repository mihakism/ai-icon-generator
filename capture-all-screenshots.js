/**
 * 전체 스크린샷 캡처 스크립트
 * - Handoff 에이전트: 전체 페이지 + 인터랙티브 데모 3탭
 * - WORKS AI: 메인 + 캘린더(페이지+데모2) + 메신저(페이지+데모4)
 * - 1500px × DPR 3 캡처 → sips로 3840px(4K) 리사이즈
 */

const { chromium } = require('playwright');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const DIR = path.join(__dirname, 'screenshots');
fs.mkdirSync(DIR, { recursive: true });

const delay = ms => new Promise(r => setTimeout(r, ms));

async function save4k(page, filename, { fullPage = true, clip = null } = {}) {
  const raw = path.join(DIR, filename + '-raw.png');
  const out = path.join(DIR, filename + '.png');
  const opts = { path: raw };
  if (clip) opts.clip = clip;
  else opts.fullPage = fullPage;
  await page.screenshot(opts);
  execSync(`sips -Z 3840 "${raw}" --out "${out}"`);
  fs.unlinkSync(raw);
  console.log('  ✅', filename + '.png');
  return out;
}

async function run() {
  const browser = await chromium.launch({ headless: true });

  // ──────────────────────────────────────────────
  // 1. Handoff 에이전트
  // ──────────────────────────────────────────────
  console.log('\n=== Handoff 에이전트 ===');
  {
    const ctx = await browser.newContext({ viewport: { width: 1500, height: 900 }, deviceScaleFactor: 3 });
    const p = await ctx.newPage();
    await p.goto('https://handoff-agent-mu.vercel.app/', { waitUntil: 'networkidle', timeout: 30000 });
    await p.waitForTimeout(2000);

    // 1-1. 전체 페이지
    await save4k(p, 'handoff-full', { fullPage: true });

    // 1-2~4. #demo 섹션 포커싱 (스펙문서 / Jira티켓 / QA체크리스트 탭)
    await p.locator('#demo').scrollIntoViewIfNeeded();
    await p.waitForTimeout(500);

    const tabs = [
      { text: '스펙 문서',    filename: 'handoff-demo-spec' },
      { text: 'Jira 티켓',   filename: 'handoff-demo-jira' },
      { text: 'QA 체크리스트', filename: 'handoff-demo-qa' },
    ];

    for (const { text, filename } of tabs) {
      await p.getByRole('button', { name: text }).click();
      await p.waitForTimeout(700);
      // 데모 섹션만 캡처 (뷰포트 기준, fullPage: false)
      await p.locator('#demo').scrollIntoViewIfNeeded();
      await p.waitForTimeout(300);
      await save4k(p, filename, { fullPage: false });
    }

    await ctx.close();
  }

  // ──────────────────────────────────────────────
  // 2. WORKS AI — 메인 페이지
  // ──────────────────────────────────────────────
  console.log('\n=== WORKS AI ===');
  {
    const ctx = await browser.newContext({ viewport: { width: 1500, height: 900 }, deviceScaleFactor: 3 });
    const p = await ctx.newPage();
    await p.goto('https://works-ai-three.vercel.app/', { waitUntil: 'networkidle', timeout: 30000 });
    await p.waitForTimeout(2000);
    await save4k(p, 'works-main', { fullPage: true });
    await ctx.close();
  }

  // ──────────────────────────────────────────────
  // 3. WORKS AI — 캘린더 페이지
  // ──────────────────────────────────────────────
  console.log('\n=== WORKS AI 캘린더 ===');
  {
    const ctx = await browser.newContext({ viewport: { width: 1500, height: 900 }, deviceScaleFactor: 3 });
    const p = await ctx.newPage();
    await p.goto('https://works-ai-three.vercel.app/calendar.html', { waitUntil: 'networkidle', timeout: 30000 });
    await p.waitForTimeout(2000);

    // 캘린더 메인 페이지
    await save4k(p, 'works-calendar', { fullPage: true });

    // 데모 1: 새 일정 만들기 (최적 슬롯 + 아젠다)
    await p.locator('button.demo-btn', { hasText: '새 일정 만들기' }).click();
    await p.waitForTimeout(2000);
    await save4k(p, 'works-calendar-demo1', { fullPage: false });

    // 오버레이 닫기 시도 후 새로고침
    await p.goto('https://works-ai-three.vercel.app/calendar.html', { waitUntil: 'networkidle', timeout: 30000 });
    await p.waitForTimeout(1500);

    // 데모 2: 회의록 + 태스크
    await p.locator('button.demo-btn', { hasText: '회의록' }).click();
    await p.waitForTimeout(2000);
    await save4k(p, 'works-calendar-demo2', { fullPage: false });

    await ctx.close();
  }

  // ──────────────────────────────────────────────
  // 4. WORKS AI — 메신저 페이지
  // ──────────────────────────────────────────────
  console.log('\n=== WORKS AI 메신저 ===');
  {
    const ctx = await browser.newContext({ viewport: { width: 1500, height: 900 }, deviceScaleFactor: 3 });
    const p = await ctx.newPage();
    await p.goto('https://works-ai-three.vercel.app/messenger.html', { waitUntil: 'networkidle', timeout: 30000 });
    await p.waitForTimeout(2000);

    // 메신저 메인 페이지
    await save4k(p, 'works-messenger', { fullPage: true });

    // 데모 1: 채널 요약
    await p.locator('#btn-summary').click();
    await p.waitForTimeout(1500);
    await save4k(p, 'works-messenger-summary', { fullPage: false });

    // 데모 2: 일정 감지 배너
    await p.goto('https://works-ai-three.vercel.app/messenger.html', { waitUntil: 'networkidle', timeout: 30000 });
    await p.waitForTimeout(1500);
    await p.locator('#btn-banner').click();
    await p.waitForTimeout(1500);
    await save4k(p, 'works-messenger-banner', { fullPage: false });

    // 데모 3: 번역 토글
    await p.goto('https://works-ai-three.vercel.app/messenger.html', { waitUntil: 'networkidle', timeout: 30000 });
    await p.waitForTimeout(1500);
    await p.locator('#btn-translate').click();
    await p.waitForTimeout(1500);
    await save4k(p, 'works-messenger-translate', { fullPage: false });

    // 데모 4: AI 일괄 처리
    await p.goto('https://works-ai-three.vercel.app/messenger.html', { waitUntil: 'networkidle', timeout: 30000 });
    await p.waitForTimeout(1500);
    await p.locator('#btn-batch').click();
    await p.waitForTimeout(1500);
    await save4k(p, 'works-messenger-batch', { fullPage: false });

    await ctx.close();
  }

  await browser.close();
  console.log('\n🎉 모든 스크린샷 완료!');

  // 결과 출력
  const files = fs.readdirSync(DIR).filter(f => f.startsWith('handoff-') || f.startsWith('works-'));
  console.log('\n생성된 파일:');
  files.forEach(f => {
    const size = (fs.statSync(path.join(DIR, f)).size / 1024).toFixed(0);
    console.log(`  ${f} (${size}KB)`);
  });
}

run().catch(console.error);
