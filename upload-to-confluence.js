const fs = require('fs');
const path = require('path');

// ─────────────────────────────────────────────
// 설정
// ─────────────────────────────────────────────
const CONFIG = {
  baseUrl: process.env.CONFLUENCE_BASE_URL || 'https://wiki.navercorp.com',
  token: process.env.CONFLUENCE_TOKEN || '',
  parentPageId: '4667402717',
  spaceKey: 'HYPERAIDESIGN',
  pageTitle: '26-04-09_홍미학',
  // 기존에 생성된 페이지 ID (업데이트 시 사용)
  existingPageId: process.env.PAGE_ID || '',
};

if (!CONFIG.token) {
  console.error('❌ CONFLUENCE_TOKEN 환경변수를 설정해주세요.');
  process.exit(1);
}

const headers = {
  'Authorization': `Bearer ${CONFIG.token}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

async function fetchAPI(endpoint, options = {}) {
  const url = `${CONFIG.baseUrl}/rest/api${endpoint}`;
  const res = await fetch(url, { ...options, headers: { ...headers, ...(options.headers || {}) } });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API 오류 ${res.status}: ${text}`);
  }
  return res.json();
}

// 첨부파일 업로드 (기존 파일이 있으면 교체)
async function uploadAttachment(pageId, filePath, filename) {
  // 기존 첨부파일 목록 확인
  const existing = await fetch(
    `${CONFIG.baseUrl}/rest/api/content/${pageId}/child/attachment?filename=${encodeURIComponent(filename)}`,
    { headers }
  ).then(r => r.json());

  const fileBuffer = fs.readFileSync(filePath);
  const blob = new Blob([fileBuffer], { type: 'image/png' });
  const formData = new FormData();
  formData.append('file', blob, filename);
  formData.append('minorEdit', 'true');
  formData.append('comment', '1500px 캡처 후 800px 리사이즈');

  let url;
  let method = 'POST';

  if (existing.results && existing.results.length > 0) {
    // 기존 파일 교체
    const attachId = existing.results[0].id;
    url = `${CONFIG.baseUrl}/rest/api/content/${pageId}/child/attachment/${attachId}/data`;
    method = 'POST';
  } else {
    url = `${CONFIG.baseUrl}/rest/api/content/${pageId}/child/attachment`;
  }

  const res = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${CONFIG.token}`,
      'X-Atlassian-Token': 'no-check',
    },
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`첨부파일 업로드 오류 ${res.status}: ${text}`);
  }
  const data = await res.json();
  return data.results ? data.results[0] : data;
}

async function restrictPageToSelf(pageId) {
  const meRes = await fetch(`${CONFIG.baseUrl}/rest/api/user/current`, { headers });
  const me = await meRes.json();
  const username = me.username || me.name;
  const userKey = me.userKey;

  const url = `${CONFIG.baseUrl}/rest/api/content/${pageId}/restriction`;
  const res = await fetch(url, {
    method: 'PUT',
    headers,
    body: JSON.stringify([
      {
        operation: 'read',
        restrictions: {
          user: { results: [{ type: 'known', username, userKey }] },
          group: { results: [] },
        },
      },
      {
        operation: 'update',
        restrictions: {
          user: { results: [{ type: 'known', username, userKey }] },
          group: { results: [] },
        },
      },
    ]),
  });

  if (!res.ok) {
    const text = await res.text();
    console.warn(`⚠️  나만보기 설정 실패: ${res.status} ${text}`);
  } else {
    console.log('✅ 나만보기 설정 완료');
  }
}

// 기존 페이지 최신 버전 번호 가져오기
async function getPageVersion(pageId) {
  const data = await fetchAPI(`/content/${pageId}?expand=version`);
  return data.version.number;
}

async function main() {
  console.log('🚀 Confluence 업무보고 업데이트 시작...\n');

  const pageId = CONFIG.existingPageId || '5079630427';
  const screenshotDir = path.join(__dirname, 'screenshots');

  // 1. 스크린샷 업로드 (교체)
  console.log('📸 스크린샷 업로드(교체) 중...');
  await uploadAttachment(pageId, path.join(screenshotDir, 'auto-qa-800.png'), 'auto-qa-800.png');
  console.log('  ✅ auto-qa-800.png 업로드 완료');

  await uploadAttachment(pageId, path.join(screenshotDir, 'ai-icon-generator-800.png'), 'ai-icon-generator-800.png');
  console.log('  ✅ ai-icon-generator-800.png 업로드 완료\n');

  // 2. 본문 — 기존 26-04-02 포맷과 동일한 스타일 적용
  const bodyContent = `<h4 style="text-align: left;"><span style="color:var(--ds-text,#172b4d);">프로젝트 일정</span></h4>
<p style="text-align: left;"><strong><span style="color:var(--ds-text,#172b4d);">AI 활용 생산성 실험</span></strong><strong><span style="color:var(--ds-text,#172b4d);"><br /></span></strong>Phase2 진행 중<br /><br /><br /><strong>진행사항<br /></strong>4/9~ 데모 사이트 리서치 및 기능 분석 진행</p>
<table class="relative-table" style="width: 1548.0px;"><colgroup><col style="width: 137.0px;" /><col style="width: 888.0px;" /><col style="width: 94.0px;" /><col style="width: 428.0px;" /></colgroup>
<tbody>
<tr>
<td style="text-align: left;vertical-align: top;"><strong><span style="color:var(--ds-text,#172b4d);">Auto QA<br />Figma 플러그인</span></strong></td>
<td style="text-align: left;vertical-align: top;"><div class="content-wrapper"><p><ac:image ac:width="800"><ri:attachment ri:filename="auto-qa-800.png" /></ac:image></p></div></td>
<td style="text-align: left;vertical-align: top;"><br /></td>
<td style="text-align: left;vertical-align: top;"><ul style="list-style-type: square;">
<li data-uuid="a1b2c3d4-0001-0001-0001-000000000001"><a href="https://auto-qa-demo.vercel.app/">https://auto-qa-demo.vercel.app/</a></li>
<li data-uuid="a1b2c3d4-0001-0001-0001-000000000002">Figma 디자인 품질 자동 점검 플러그인 데모 사이트</li>
<li data-uuid="a1b2c3d4-0001-0001-0001-000000000003">총 10가지 항목 자동 검사: 색상 대비(WCAG), 터치 타겟, 소수점 수치, DS 미등록 색상, Detached 컴포넌트, 기본 레이어명, 텍스트 스타일, 간격 체계, Export 설정, AI 시각 분석</li>
<li data-uuid="a1b2c3d4-0001-0001-0001-000000000004">WCAG 2.1 AA/AAA + Apple HIG + Material 3 기준 적용<ul style="list-style-type: square;">
<li data-uuid="a1b2c3d4-0001-0001-0001-000000000005">Claude Vision AI 연동 — 상태 커버리지, Lorem ipsum, 레이아웃 불일치 탐지</li>
<li data-uuid="a1b2c3d4-0001-0001-0001-000000000006">WCAG 위반 색상 자동 대체색 추천 / Jira 티켓 원클릭 생성</li>
</ul></li>
</ul></td>
</tr>
<tr>
<td style="text-align: left;vertical-align: top;"><strong><span style="color:var(--ds-text,#172b4d);">AI Icon<br />Generator</span></strong></td>
<td style="text-align: left;vertical-align: top;"><div class="content-wrapper"><p><ac:image ac:width="800"><ri:attachment ri:filename="ai-icon-generator-800.png" /></ac:image></p></div></td>
<td style="text-align: left;vertical-align: top;"><br /></td>
<td style="text-align: left;vertical-align: top;"><ul style="list-style-type: square;">
<li data-uuid="a1b2c3d4-0002-0001-0001-000000000001"><a href="https://ai-icon-generator-sandy.vercel.app/">https://ai-icon-generator-sandy.vercel.app/</a></li>
<li data-uuid="a1b2c3d4-0002-0001-0001-000000000002">AI 기반 아이콘 이미지 생성 웹 도구</li>
<li data-uuid="a1b2c3d4-0002-0001-0001-000000000003">스타일 레퍼런스 이미지 첨부 또는 텍스트 입력으로 아이콘 생성<ul style="list-style-type: square;">
<li data-uuid="a1b2c3d4-0002-0001-0001-000000000004">Line / Solid / 3D 스타일 옵션 지원</li>
<li data-uuid="a1b2c3d4-0002-0001-0001-000000000005">생성 아이콘 개별 · 일괄 다운로드 가능</li>
</ul></li>
</ul></td>
</tr>
</tbody></table>`;

  // 3. 페이지 본문 업데이트
  console.log('📝 본문 업데이트 중...');
  const currentVersion = await getPageVersion(pageId);
  await fetchAPI(`/content/${pageId}`, {
    method: 'PUT',
    body: JSON.stringify({
      version: { number: currentVersion + 1 },
      type: 'page',
      title: CONFIG.pageTitle,
      body: {
        storage: {
          value: bodyContent,
          representation: 'storage',
        },
      },
    }),
  });
  console.log('✅ 본문 업데이트 완료\n');

  console.log('🎉 완료!');
  console.log(`📎 페이지 URL: ${CONFIG.baseUrl}/pages/viewpage.action?pageId=${pageId}`);
}

main().catch((err) => {
  console.error('❌ 오류:', err.message);
  process.exit(1);
});
