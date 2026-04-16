const TOKEN = process.env.CONFLUENCE_TOKEN || '';
const BASE_URL = 'https://wiki.navercorp.com';
const fs = require('fs');
const path = require('path');
const delay = ms => new Promise(r => setTimeout(r, ms));
const screenshotDir = path.join(__dirname, 'screenshots');

const headers = {
  'Authorization': `Bearer ${TOKEN}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

async function uploadAttachment(pageId, filePath, filename) {
  const existing = await fetch(
    `${BASE_URL}/rest/api/content/${pageId}/child/attachment?filename=${encodeURIComponent(filename)}`,
    { headers: { 'Authorization': `Bearer ${TOKEN}`, 'Accept': 'application/json' } }
  ).then(r => r.json());

  const blob = new Blob([fs.readFileSync(filePath)], { type: 'image/png' });
  const formData = new FormData();
  formData.append('file', blob, filename);
  formData.append('minorEdit', 'true');

  const url = (existing.results && existing.results.length > 0)
    ? `${BASE_URL}/rest/api/content/${pageId}/child/attachment/${existing.results[0].id}/data`
    : `${BASE_URL}/rest/api/content/${pageId}/child/attachment`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${TOKEN}`, 'X-Atlassian-Token': 'no-check' },
    body: formData,
  });
  if (!res.ok) throw new Error(`Upload ${filename} failed ${res.status}: ${(await res.text()).substring(0, 200)}`);
  console.log('  ✅', filename);
}

const PAGE_BODY = `<h4 style="text-align: left;"><span style="color:var(--ds-text,#172b4d);">프로젝트 일정</span></h4>
<p style="text-align: left;"><strong>AI 활용 생산성 실험<br /></strong>Phase2 → HCX × 디자이너 AI 기능 제안 <a href="https://wiki.navercorp.com/x/0kYiLgE">위키</a><br /><br /><br /><strong>진행사항<br /></strong>4/9 모델팀에 아이콘 라이브러리 전달 <a href="https://wiki.navercorp.com/spaces/HYPERAIDESIGN/pages/5080833871/%EC%9B%8D%EC%8A%A4+%EB%94%94%EC%9E%90%EC%9D%B8+%EC%8B%9C%EC%8A%A4%ED%85%9C+%EA%B0%80%EC%9D%B4%EB%93%9C+%EA%B3%B5%EC%9C%A0+WDS">WDS</a></p>
<table class="relative-table wrapped" style="width: 1548.0px;"><colgroup><col style="width: 137.0px;" /><col style="width: 888.0px;" /><col style="width: 94.0px;" /><col style="width: 428.0px;" /></colgroup>
<tbody>
<tr>
<td style="text-align: left;vertical-align: top;"><strong><span style="color:var(--ds-text,#172b4d);">WDS 아이콘<br />라이브러리 전달</span></strong></td>
<td style="text-align: left;vertical-align: top;"><div class="content-wrapper">
<p><ac:image ac:width="800"><ri:attachment ri:filename="wds-all.png" /></ac:image></p>
<p><ac:image ac:width="800"><ri:attachment ri:filename="wds-filled.png" /></ac:image></p>
<p><ac:image ac:width="800"><ri:attachment ri:filename="wds-both.png" /></ac:image></p>
</div></td>
<td style="text-align: left;vertical-align: top;"><br /></td>
<td style="text-align: left;vertical-align: top;"><ul style="list-style-type: square;">
<li><a href="https://wiki.navercorp.com/spaces/HYPERAIDESIGN/pages/5080833871/%EC%9B%8D%EC%8A%A4+%EB%94%94%EC%9E%90%EC%9D%B8+%EC%8B%9C%EC%8A%A4%ED%85%9C+%EA%B0%80%EC%9D%B4%EB%93%9C+%EA%B3%B5%EC%9C%A0+WDS">웍스 디자인 시스템 가이드 공유 WDS</a></li>
<li>WDS Icons 총 129~131개 아이콘 라이브러리</li>
<li>카테고리: Service 12, Common 70, AI 6, Communication 7, Media 17, Arrow 12, Alert 8<ul style="list-style-type: square;">
<li>Lined / Filled / Both 3가지 스타일 지원</li>
<li>사이즈 및 컬러 커스텀 가능, SVG 포맷 제공</li>
</ul></li>
</ul></td>
</tr>
</tbody>
</table>`;

(async () => {
  // 1. 빈 페이지 생성
  console.log('📄 페이지 생성 중...');
  const createRes = await fetch(`${BASE_URL}/rest/api/content`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      type: 'page',
      title: '26-04-16_홍미학',
      space: { key: 'HYPERAIDESIGN' },
      ancestors: [{ id: '4667402717' }],
      body: { storage: { value: '<p>초안</p>', representation: 'storage' } },
    }),
  });
  if (!createRes.ok) throw new Error(`Create failed ${createRes.status}: ${(await createRes.text()).substring(0, 300)}`);
  const page = await createRes.json();
  const pageId = page.id;
  console.log(`✅ 페이지 생성: ${pageId}`);
  console.log(`   ${BASE_URL}/pages/viewpage.action?pageId=${pageId}`);

  await delay(2000);

  // 2. WDS 이미지 3장 업로드 (딜레이 포함)
  console.log('\n📸 이미지 업로드...');
  await uploadAttachment(pageId, path.join(screenshotDir, 'wds-all.png'), 'wds-all.png');
  await delay(3500);
  await uploadAttachment(pageId, path.join(screenshotDir, 'wds-filled.png'), 'wds-filled.png');
  await delay(3500);
  await uploadAttachment(pageId, path.join(screenshotDir, 'wds-both.png'), 'wds-both.png');
  await delay(2000);

  // 3. 본문 업데이트
  console.log('\n📝 본문 업데이트 중...');
  const updateRes = await fetch(`${BASE_URL}/rest/api/content/${pageId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      version: { number: 2 },
      type: 'page',
      title: '26-04-16_홍미학',
      body: { storage: { value: PAGE_BODY, representation: 'storage' } },
    }),
  });
  if (!updateRes.ok) throw new Error(`Update failed ${updateRes.status}: ${(await updateRes.text()).substring(0, 300)}`);
  console.log('✅ 본문 업데이트 완료');

  await delay(2000);

  // 4. 나만보기 설정
  console.log('\n🔒 나만보기 설정...');
  const me = await fetch(`${BASE_URL}/rest/api/user/current`, { headers }).then(r => r.json());
  const restrictRes = await fetch(`${BASE_URL}/rest/api/content/${pageId}/restriction`, {
    method: 'PUT',
    headers,
    body: JSON.stringify([
      {
        operation: 'read',
        restrictions: { user: { results: [{ type: 'known', username: me.username, userKey: me.userKey }] }, group: { results: [] } },
      },
      {
        operation: 'update',
        restrictions: { user: { results: [{ type: 'known', username: me.username, userKey: me.userKey }] }, group: { results: [] } },
      },
    ]),
  });
  if (restrictRes.ok) console.log('✅ 나만보기 설정 완료');
  else console.warn(`⚠️  나만보기 실패: ${restrictRes.status}`);

  console.log('\n🎉 모두 완료!');
  console.log(`📎 ${BASE_URL}/pages/viewpage.action?pageId=${pageId}`);
})().catch(e => { console.error('❌', e.message); process.exit(1); });
