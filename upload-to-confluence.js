const fs = require('fs');
const path = require('path');

// ─────────────────────────────────────────────
// 설정 (실행 전 .env 또는 직접 값 입력)
// ─────────────────────────────────────────────
const CONFIG = {
  baseUrl: process.env.CONFLUENCE_BASE_URL || 'https://wiki.navercorp.com',
  token: process.env.CONFLUENCE_TOKEN || '',
  parentPageId: '4667402717',
  spaceKey: 'HYPERAIDESIGN',
  pageTitle: '26-04-09_홍미학',
};

if (!CONFIG.token) {
  console.error('❌ CONFLUENCE_TOKEN 환경변수를 설정해주세요.');
  console.error('   export CONFLUENCE_TOKEN="your-token-here"');
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

async function uploadAttachment(pageId, filePath, filename) {
  const formData = new FormData();
  const fileBuffer = fs.readFileSync(filePath);
  const blob = new Blob([fileBuffer], { type: 'image/png' });
  formData.append('file', blob, filename);
  formData.append('minorEdit', 'true');

  const url = `${CONFIG.baseUrl}/rest/api/content/${pageId}/child/attachment`;
  const res = await fetch(url, {
    method: 'POST',
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
  return data.results[0];
}

async function createPage(parentId, spaceKey, title, bodyContent) {
  return fetchAPI('/content', {
    method: 'POST',
    body: JSON.stringify({
      type: 'page',
      title,
      space: { key: spaceKey },
      ancestors: [{ id: parentId }],
      body: {
        storage: {
          value: bodyContent,
          representation: 'storage',
        },
      },
      metadata: {
        properties: {},
      },
    }),
  });
}

async function restrictPageToSelf(pageId) {
  // 현재 사용자 정보 가져오기
  const me = await fetchAPI('/user/current');
  const myAccountId = me.accountId || me.name;

  const url = `${CONFIG.baseUrl}/rest/api/content/${pageId}/restriction`;
  const res = await fetch(url, {
    method: 'PUT',
    headers,
    body: JSON.stringify([
      {
        operation: 'read',
        restrictions: {
          user: { results: [{ type: 'known', accountId: myAccountId }] },
          group: { results: [] },
        },
      },
      {
        operation: 'update',
        restrictions: {
          user: { results: [{ type: 'known', accountId: myAccountId }] },
          group: { results: [] },
        },
      },
    ]),
  });

  if (!res.ok) {
    const text = await res.text();
    console.warn(`⚠️  나만보기 설정 실패 (수동으로 설정 필요): ${res.status} ${text}`);
  } else {
    console.log('✅ 나만보기 설정 완료');
  }
}

async function main() {
  console.log('🚀 Confluence 업무보고 업로드 시작...\n');

  // 1. 빈 페이지 먼저 생성 (첨부 파일 업로드를 위해)
  console.log('📄 페이지 생성 중...');
  const draftContent = '<p>초안</p>';
  const page = await createPage(CONFIG.parentPageId, CONFIG.spaceKey, CONFIG.pageTitle, draftContent);
  const pageId = page.id;
  console.log(`✅ 페이지 생성됨: ${CONFIG.baseUrl}/pages/${pageId}\n`);

  // 2. 스크린샷 업로드
  console.log('📸 스크린샷 업로드 중...');
  const screenshotDir = path.join(__dirname, 'screenshots');

  const autoQaAttachment = await uploadAttachment(
    pageId,
    path.join(screenshotDir, 'auto-qa-800.png'),
    'auto-qa-800.png'
  );
  console.log('  ✅ auto-qa-800.png 업로드 완료');

  const aiIconAttachment = await uploadAttachment(
    pageId,
    path.join(screenshotDir, 'ai-icon-generator-800.png'),
    'ai-icon-generator-800.png'
  );
  console.log('  ✅ ai-icon-generator-800.png 업로드 완료\n');

  const autoQaImgSrc = `/rest/api/content/${pageId}/child/attachment/${autoQaAttachment.id}/download`;
  const aiIconImgSrc = `/rest/api/content/${pageId}/child/attachment/${aiIconAttachment.id}/download`;

  // 3. 본문 작성
  const bodyContent = `
<ac:layout>
  <ac:layout-section ac:type="single">
    <ac:layout-cell>

<h2>업무 내역</h2>
<ul>
  <li>데모 사이트 2종 검토 및 기능 분석 정리</li>
  <li>Auto QA Figma 플러그인 기능 파악 및 활용 방안 검토</li>
  <li>AI Icon Generator 서비스 UI/UX 검토</li>
</ul>

<h2>산출물 및 참고 링크</h2>

<h3>1. Auto QA — Figma 디자인 품질 자동 검사 플러그인</h3>
<p><strong>URL:</strong> <a href="https://auto-qa-demo.vercel.app/">https://auto-qa-demo.vercel.app/</a></p>

<p>
<ac:image ac:width="800">
  <ri:attachment ri:filename="auto-qa-800.png" ri:version-at-save="1"/>
</ac:image>
</p>

<p><strong>요약</strong></p>
<ul>
  <li>Figma 디자인의 품질을 자동으로 점검하는 플러그인 데모 사이트</li>
  <li><strong>총 10가지 항목</strong>을 자동 검사: 색상 대비(WCAG), 터치 타겟, 소수점 수치, DS 미등록 색상, Detached 컴포넌트, 기본 레이어명, 텍스트 스타일, 간격 체계, Export 설정, AI 시각 분석</li>
  <li>WCAG 2.1 AA/AAA 기준 + Apple HIG + Google Material 3 기준 적용</li>
  <li><strong>Claude Vision AI</strong>와 결합하여 상태 커버리지, Lorem ipsum, 레이아웃 불일치 등 규칙 기반으로 잡기 어려운 문제도 탐지</li>
  <li>이슈 발견 시 Jira 티켓 원클릭 생성 가능</li>
  <li>WCAG 위반 색상의 경우 색조 유지하며 통과 색상 자동 추천 기능 포함</li>
</ul>
<p><strong>주목 포인트:</strong> 디자이너가 QA를 직접 수행하거나 개발 핸드오프 전 빠르게 점검할 수 있는 도구. 규칙+AI 하이브리드 방식으로 커버리지가 넓음.</p>

<hr/>

<h3>2. AI Icon Generator</h3>
<p><strong>URL:</strong> <a href="https://ai-icon-generator-sandy.vercel.app/">https://ai-icon-generator-sandy.vercel.app/</a></p>

<p>
<ac:image ac:width="800">
  <ri:attachment ri:filename="ai-icon-generator-800.png" ri:version-at-save="1"/>
</ac:image>
</p>

<p><strong>요약</strong></p>
<ul>
  <li>AI 기반 아이콘 이미지 생성 웹 도구</li>
  <li>스타일 레퍼런스 이미지를 직접 첨부하거나 원하는 형태를 텍스트로 입력하여 아이콘 생성</li>
  <li><strong>스타일 옵션:</strong> Line / Solid / 3D 세 가지 모드 지원</li>
  <li>생성된 아이콘은 개별 다운로드 또는 전체 일괄 다운로드 가능</li>
  <li>Vercel 호스팅, 클라이언트 사이드 + 외부 AI API 연동 구조로 추정</li>
</ul>
<p><strong>주목 포인트:</strong> 레퍼런스 이미지 기반 스타일 매칭 기능이 있어 브랜드 일관성 있는 아이콘 세트 제작에 유용할 것으로 보임.</p>

<hr/>

<h2>정리 및 회고</h2>
<ul>
  <li>두 서비스 모두 디자이너의 반복 작업을 AI로 자동화하는 방향성을 가짐</li>
  <li>Auto QA는 <em>검증/QA 영역</em>, AI Icon Generator는 <em>에셋 제작 영역</em>을 다루는 상호 보완적 도구</li>
  <li>Auto QA의 Claude Vision 연동 방식은 현재 팀 작업에도 적용 가능성 검토 필요</li>
</ul>

<h2>다음 주 계획</h2>
<ul>
  <li>Auto QA 플러그인 실제 Figma 화면에 적용 테스트</li>
  <li>AI Icon Generator로 시안용 아이콘 생성 및 품질 평가</li>
</ul>

    </ac:layout-cell>
  </ac:layout-section>
</ac:layout>
`;

  // 4. 페이지 본문 업데이트
  console.log('📝 본문 업데이트 중...');
  await fetchAPI(`/content/${pageId}`, {
    method: 'PUT',
    body: JSON.stringify({
      version: { number: 2 },
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

  // 5. 나만보기 설정
  console.log('🔒 나만보기 설정 중...');
  await restrictPageToSelf(pageId);

  console.log('\n🎉 완료!');
  console.log(`📎 페이지 URL: ${CONFIG.baseUrl}/pages/viewpage.action?pageId=${pageId}`);
}

main().catch((err) => {
  console.error('❌ 오류:', err.message);
  process.exit(1);
});
