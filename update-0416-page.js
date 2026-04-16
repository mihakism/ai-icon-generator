/**
 * 26-04-16_홍미학 페이지 업데이트
 * - Handoff 에이전트 이미지 업로드 + 본문 추가
 * - WORKS AI 이미지 업로드 + 본문 추가
 * - 기존 사용자 편집 내용 유지
 */

const TOKEN = process.env.CONFLUENCE_TOKEN || '';
const BASE_URL = 'https://wiki.navercorp.com';
const PAGE_ID = '5115377382';
const fs = require('fs');
const path = require('path');
const DIR = path.join(__dirname, 'screenshots');

if (!TOKEN) { console.error('CONFLUENCE_TOKEN 필요'); process.exit(1); }

const headers = {
  'Authorization': `Bearer ${TOKEN}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};
const delay = ms => new Promise(r => setTimeout(r, ms));

async function uploadAttachment(filename) {
  const filePath = path.join(DIR, filename);
  const existing = await fetch(
    `${BASE_URL}/rest/api/content/${PAGE_ID}/child/attachment?filename=${encodeURIComponent(filename)}`,
    { headers: { 'Authorization': `Bearer ${TOKEN}`, 'Accept': 'application/json' } }
  ).then(r => r.json());

  const blob = new Blob([fs.readFileSync(filePath)], { type: 'image/png' });
  const form = new FormData();
  form.append('file', blob, filename);
  form.append('minorEdit', 'true');

  const url = (existing.results?.length > 0)
    ? `${BASE_URL}/rest/api/content/${PAGE_ID}/child/attachment/${existing.results[0].id}/data`
    : `${BASE_URL}/rest/api/content/${PAGE_ID}/child/attachment`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${TOKEN}`, 'X-Atlassian-Token': 'no-check' },
    body: form,
  });
  if (!res.ok) throw new Error(`Upload ${filename} failed ${res.status}: ${(await res.text()).substring(0, 200)}`);
  console.log('  ✅', filename);
}

function img(filename) {
  return `<p><ac:image ac:width="800"><ri:attachment ri:filename="${filename}" /></ac:image></p>`;
}

// ──────────────────────────────────────────────
// 현재 페이지 가져오기
// ──────────────────────────────────────────────
async function getCurrentPage() {
  const res = await fetch(`${BASE_URL}/rest/api/content/${PAGE_ID}?expand=body.storage,version`, { headers });
  return res.json();
}

// ──────────────────────────────────────────────
// 페이지 업데이트
// ──────────────────────────────────────────────
async function updatePage(version, newBody) {
  const res = await fetch(`${BASE_URL}/rest/api/content/${PAGE_ID}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      version: { number: version + 1 },
      type: 'page',
      title: '26-04-16_홍미학',
      body: { storage: { value: newBody, representation: 'storage' } },
    }),
  });
  if (!res.ok) throw new Error(`Update failed ${res.status}: ${(await res.text()).substring(0, 300)}`);
}

async function main() {
  // ── 1. 이미지 업로드 (딜레이 포함)
  const filesToUpload = [
    'handoff-full.png',
    'handoff-demo-spec.png',
    'handoff-demo-jira.png',
    'handoff-demo-qa.png',
    'works-main.png',
    'works-calendar.png',
    'works-calendar-demo1.png',
    'works-calendar-demo2.png',
    'works-messenger.png',
    'works-messenger-summary.png',
    'works-messenger-banner.png',
    'works-messenger-translate.png',
    'works-messenger-batch.png',
  ];

  console.log(`📸 이미지 업로드 (${filesToUpload.length}장)...`);
  for (const f of filesToUpload) {
    await uploadAttachment(f);
    await delay(2500);
  }

  // ── 2. 현재 페이지 내용 가져오기
  console.log('\n📄 현재 페이지 가져오기...');
  const pageData = await getCurrentPage();
  const version = pageData.version.number;
  const existingBody = pageData.body.storage.value;

  // ── 3. 기존 테이블 내 '디자인 handoff 에이전트' 행에 이미지+설명 채우기
  //    + 새 행 '디자인 WORKS AI' 추가
  //    기존 본문의 </tbody></table> 앞에 새 행 삽입하는 방식
  //    단, handoff 에이전트 행은 이미 있으므로 해당 셀만 교체

  // 기존 handoff 행: 이미지 셀 비어있음 → 교체
  const handoffRowOriginal = `<td style="text-align: left;vertical-align: top;"><div class="content-wrapper"><p><br /></p></div></td>`;
  const handoffRowNew = `<td style="text-align: left;vertical-align: top;"><div class="content-wrapper">
${img('handoff-full.png')}
${img('handoff-demo-spec.png')}
${img('handoff-demo-jira.png')}
${img('handoff-demo-qa.png')}
</div></td>`;

  // handoff 설명 셀: 현재 비어있음 → 채우기
  // 기존: <td style="..."><br /></td> 이게 handoff 행의 마지막 td
  // 현재 body에서 handoff 행 전체를 찾아 교체하기가 복잡하니
  // </tbody></table> 앞에 WORKS AI 행 추가 + handoff 이미지 셀 교체

  let newBody = existingBody;

  // handoff 행 이미지 셀 교체 (빈 셀 → 이미지 채움)
  newBody = newBody.replace(
    handoffRowOriginal,
    handoffRowNew
  );

  // handoff 행 설명 셀 채우기
  // 마지막 <td><br /></td> 패턴 (handoff 행)
  const handoffDescOld = `<td style="text-align: left;vertical-align: top;"><br /></td></tr></tbody></table>`;
  const handoffDescNew = `<td style="text-align: left;vertical-align: top;"><ul style="list-style-type: square;">
<li><a href="https://handoff-agent-mu.vercel.app/">https://handoff-agent-mu.vercel.app/</a></li>
<li>Figma 디자인을 스펙 문서·Jira 티켓·QA 체크리스트로 자동 변환하는 AI 핸드오프 에이전트</li>
<li>Claude Vision으로 컴포넌트 스캔, 디자인 토큰 추출, 스펙 시트 자동 렌더링<ul style="list-style-type: square;">
<li>스펙 문서: 컴포넌트별 수치·상태·토큰 자동 정리</li>
<li>Jira 티켓: Story/Task/Sub-task 계층 자동 생성</li>
<li>QA 체크리스트: 접근성·반응형·상태별 항목 자동 도출</li>
</ul></li>
<li>수작업 대비 80% 시간 단축, 평균 처리 ~30초</li>
</ul></td></tr>

<tr>
<td style="text-align: left;vertical-align: top;"><strong><span style="color:var(--ds-text,#172b4d);">WORKS AI<br />기능 제안</span></strong></td>
<td style="text-align: left;vertical-align: top;"><div class="content-wrapper">
${img('works-main.png')}
<p><strong>캘린더</strong></p>
${img('works-calendar.png')}
${img('works-calendar-demo1.png')}
${img('works-calendar-demo2.png')}
<p><strong>메신저</strong></p>
${img('works-messenger.png')}
${img('works-messenger-summary.png')}
${img('works-messenger-banner.png')}
${img('works-messenger-translate.png')}
${img('works-messenger-batch.png')}
</div></td>
<td style="text-align: left;vertical-align: top;"><span style="color:var(--ds-text,#172B4D);">🔗 </span><a href="https://works-ai-three.vercel.app/">WORKS AI</a></td>
<td style="text-align: left;vertical-align: top;"><ul style="list-style-type: square;">
<li><a href="https://works-ai-three.vercel.app/">https://works-ai-three.vercel.app/</a></li>
<li>NAVER WORKS 메신저·캘린더에 AI를 자연스럽게 통합한 9가지 기능 제안 프로토타입</li>
<li>캘린더 AI<ul style="list-style-type: square;">
<li>최적 일정 제안 — 참석자 캘린더 분석, 가용 슬롯 3개 자동 제시</li>
<li>아젠다 초안 생성 — 이전 회의록 참고, 시간 배분 포함 자동 작성</li>
<li>회의록 자동 생성 — 트랜스크립트 기반, 결정사항·발화자별 구조화</li>
<li>후속 태스크 연동 — 액션 아이템 파싱, WORKS 게시판 일괄 등록</li>
</ul></li>
<li>메신저 AI<ul style="list-style-type: square;">
<li>채널 요약 버블 — 미읽 메시지 요약, 결정사항·일정 팝업</li>
<li>일정 감지 트리거 — 날짜 하이라이트, 플로팅 예약 배너</li>
<li>톤 조절 — 격식체·캐주얼·영문·간결하게 즉시 변환</li>
<li>실시간 번역 — 원문 아래 인라인 번역문 표시</li>
<li>대화 기반 일괄 처리 — 예약·회의록·메일 한 번에</li>
</ul></li>
</ul></td>
</tr>

</tbody></table>`;

  newBody = newBody.replace(handoffDescOld, handoffDescNew);

  // 교체 검증
  if (newBody === existingBody) {
    console.warn('⚠️  본문 교체 패턴 불일치. 직접 추가 모드로 전환...');
    // 패턴이 안 맞을 경우 테이블 끝에 새 행만 추가
    newBody = existingBody.replace('</tbody></table>', `
<tr>
<td style="text-align: left;vertical-align: top;"><strong><span style="color:var(--ds-text,#172b4d);">디자인 handoff 에이전트<br />(이미지 추가)</span></strong></td>
<td style="text-align: left;vertical-align: top;"><div class="content-wrapper">
${img('handoff-full.png')}
${img('handoff-demo-spec.png')}
${img('handoff-demo-jira.png')}
${img('handoff-demo-qa.png')}
</div></td>
<td style="text-align: left;vertical-align: top;"><br /></td>
<td style="text-align: left;vertical-align: top;"><ul style="list-style-type: square;">
<li><a href="https://handoff-agent-mu.vercel.app/">https://handoff-agent-mu.vercel.app/</a></li>
<li>Figma 디자인을 스펙 문서·Jira 티켓·QA 체크리스트로 자동 변환하는 AI 핸드오프 에이전트</li>
<li>Claude Vision으로 컴포넌트 스캔, 디자인 토큰 추출, 스펙 시트 자동 렌더링<ul style="list-style-type: square;">
<li>스펙 문서: 컴포넌트별 수치·상태·토큰 자동 정리</li>
<li>Jira 티켓: Story/Task/Sub-task 계층 자동 생성</li>
<li>QA 체크리스트: 접근성·반응형·상태별 항목 자동 도출</li>
</ul></li>
<li>수작업 대비 80% 시간 단축, 평균 처리 ~30초</li>
</ul></td>
</tr>
<tr>
<td style="text-align: left;vertical-align: top;"><strong><span style="color:var(--ds-text,#172b4d);">WORKS AI<br />기능 제안</span></strong></td>
<td style="text-align: left;vertical-align: top;"><div class="content-wrapper">
${img('works-main.png')}
<p><strong>캘린더</strong></p>
${img('works-calendar.png')}
${img('works-calendar-demo1.png')}
${img('works-calendar-demo2.png')}
<p><strong>메신저</strong></p>
${img('works-messenger.png')}
${img('works-messenger-summary.png')}
${img('works-messenger-banner.png')}
${img('works-messenger-translate.png')}
${img('works-messenger-batch.png')}
</div></td>
<td style="text-align: left;vertical-align: top;"><span style="color:var(--ds-text,#172B4D);">🔗 </span><a href="https://works-ai-three.vercel.app/">WORKS AI</a></td>
<td style="text-align: left;vertical-align: top;"><ul style="list-style-type: square;">
<li><a href="https://works-ai-three.vercel.app/">https://works-ai-three.vercel.app/</a></li>
<li>NAVER WORKS 메신저·캘린더에 AI를 자연스럽게 통합한 9가지 기능 제안 프로토타입</li>
<li>캘린더 AI<ul style="list-style-type: square;">
<li>최적 일정 제안 — 참석자 캘린더 분석, 가용 슬롯 3개 자동 제시</li>
<li>아젠다 초안 생성 — 이전 회의록 참고, 시간 배분 포함 자동 작성</li>
<li>회의록 자동 생성 — 트랜스크립트 기반, 결정사항·발화자별 구조화</li>
<li>후속 태스크 연동 — 액션 아이템 파싱, WORKS 게시판 일괄 등록</li>
</ul></li>
<li>메신저 AI<ul style="list-style-type: square;">
<li>채널 요약 버블 — 미읽 메시지 요약, 결정사항·일정 팝업</li>
<li>일정 감지 트리거 — 날짜 하이라이트, 플로팅 예약 배너</li>
<li>톤 조절 — 격식체·캐주얼·영문·간결하게 즉시 변환</li>
<li>실시간 번역 — 원문 아래 인라인 번역문 표시</li>
<li>대화 기반 일괄 처리 — 예약·회의록·메일 한 번에</li>
</ul></li>
</ul></td>
</tr>
</tbody></table>`);
  }

  // ── 4. 페이지 업데이트
  console.log('\n📝 페이지 업데이트 중...');
  await updatePage(version, newBody);
  console.log('✅ 페이지 업데이트 완료');
  console.log(`📎 ${BASE_URL}/pages/viewpage.action?pageId=${PAGE_ID}`);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
