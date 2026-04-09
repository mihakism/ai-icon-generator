# G SaaS UI Icon Library — 규칙 문서

> 총 **260개** 아이콘 (lined 131개 / filled 129개), 7개 카테고리

---

## 1. 파일 구조

```
icons/
├── lined/          # 아웃라인(선) 스타일
│   ├── 01_Service/
│   ├── 02_Common/
│   ├── 03_AI/
│   ├── 04_Communication/
│   ├── 05_Media/
│   ├── 06_Arrow/
│   └── 07_Alert/
└── filled/         # 채움(면) 스타일
    ├── 01_Service/
    ├── 02_Common/
    ├── 03_AI/
    ├── 04_Communication/
    ├── 05_Media/
    ├── 06_Arrow/
    └── 07_Alert/
```

---

## 2. SVG 기본 규격

| 항목 | 값 |
|------|-----|
| `width` / `height` | `24` / `24` (px) |
| `viewBox` | `0 0 120 120` |
| 루트 `fill` | `none` |
| `xmlns` | `http://www.w3.org/2000/svg` |

```xml
<svg xmlns="http://www.w3.org/2000/svg"
     width="24" height="24"
     viewBox="0 0 120 120"
     fill="none">
  <g transform="translate(-X, -Y)">
    <!-- icon paths -->
  </g>
</svg>
```

> **주의:** `viewBox="0 0 120 120"`이지만 실제 렌더링 크기는 `24×24px`입니다.  
> 내부 좌표계는 원본 스프라이트 시트의 절대 좌표를 그대로 유지하며,  
> `<g transform="translate(-X, -Y)">` 로 뷰포트 원점(0,0)으로 이동시킵니다.

---

## 3. 색상 규칙

| 용도 | 값 |
|------|----|
| 선(stroke) 기본 색상 | `#222222` |
| 채움(fill) 기본 색상 | `#222222` |
| 반전 채움 (내부 여백) | `white` |
| 강조 액센트 | `#FD472B` (일부 아이콘에만 사용) |

- 모든 아이콘은 단색(`#222222`) 기반입니다.
- CSS의 `color` 속성이 아닌 하드코딩된 hex 값을 사용합니다.  
  색상을 동적으로 변경하려면 SVG를 inline으로 삽입 후 stroke/fill 속성을 직접 교체해야 합니다.

---

## 4. 스트로크 규칙

| 항목 | 값 |
|------|----|
| `stroke-linecap` | `round` |
| `stroke-linejoin` | `round` |
| `stroke-width` | 주로 `1.5` ~ `2` (일부 `2.5`) |

- **lined** 아이콘: 대부분 `stroke-width: 1.5` 또는 `2` 사용
- **filled** 아이콘: 외곽선 path에 `stroke-width: 2` ~ `2.5` 사용, 내부는 `fill`로 처리
- 일부 아이콘에서 렌더링 아티팩트로 인한 미세한 소수점 값(`1.745`, `1.9147` 등)이 존재하나 시각적으로는 2px으로 표시됨

---

## 5. Lined vs Filled 차이

| 스타일 | 특징 |
|--------|------|
| **lined** | 외곽선(stroke) 위주. `stroke="#222222"` + `fill="none"` |
| **filled** | 면 채움(fill) 위주. `fill="#222222"` + 내부 여백은 `fill="white"` |

- filled 아이콘이 외곽선을 함께 사용하는 경우도 있음 (stroke + fill 혼용)
- 같은 아이콘명이라도 lined/filled 간 path 구조가 다름

---

## 6. SVG 내부 요소 타입

| 요소 | 사용 수 | 용도 |
|------|---------|------|
| `<path>` | 563 | 대부분의 아이콘 형태 |
| `<circle>` | 63 | 원형 요소 (알림 뱃지, 돋보기 원 등) |
| `<rect>` | 36 | 사각형 요소 |
| `<line>` | 2 | 단순 직선 |
| `<ellipse>` | 2 | 타원 |

---

## 7. 카테고리별 아이콘 목록

### 01_Service (12개)
서비스 메뉴/앱 아이콘

| 이름 | lined | filled |
|------|:-----:|:------:|
| approval | ✓ | ✓ |
| board | ✓ | ✓ |
| calendar | ✓ | ✓ |
| contact | ✓ | ✓ |
| drive | ✓ | ✓ |
| home | ✓ | ✓ |
| mail | ✓ | ✓ |
| message | ✓ | ✓ |
| my_work | ✓ | ✓ |
| reservation | ✓ | ✓ |
| survey | ✓ | ✓ |
| to-do | ✓ | ✓ |

### 02_Common (70개)
일반 UI 액션 아이콘

`add` `add_circle` `add_folder` `add_member` `add_members` `add_template` `admin` `align` `approve` `apps` `attach` `block` `bookmark` `check` `check_circle` `check_member` `checkbox` `close` `close_circle` `conflict` `copy` `dark_mode` `delete` `download` `edit` `external` `favorite` `file` `fileviewer` `filter` `folder` `globe` `help` `history` `info` `keypad` `light_mode` `like` `link` `list` `lock` `log_out` `member` `members` `menu` `more_circle` `more_hori` `more_vert` `move_to_folder` `new_window` `note` `office` `organization` `pc` `pin` `print` `question` `refresh` `reload` `reply_left` `scan` `search` `search_member` `security` `setting` `share` `sticker` `template` `upload` `write`

### 03_AI (6개)
AI 기능 관련 아이콘

`ai_edit` `ai_shorten` `ai_translate` `edit_length` `improve_text` `style`

### 04_Communication (7개)
커뮤니케이션 아이콘

`call` `comment` `inbox` `mail` `mail_open` `reply_right` `send`

### 05_Media (17개)
미디어 컨트롤 아이콘

`camera` `crop` `edit_video` `hide` `image` `pause` `play` `show` `sound_off` `sound_on` `stop` `video` `video_off` `voice` `voice_off` `zoom_in` `zoom_out`

### 06_Arrow (12개)
방향 아이콘

`arrow_drop_down` `arrow_drop_up` `chevron_down` `chevron_left` `chevron_right` `chevron_up` `down` `left` `redo` `right` `undo` `up`

### 07_Alert (lined 7개 / filled 5개)
알림/상태 아이콘

| 이름 | lined | filled |
|------|:-----:|:------:|
| message_notification | ✓ | ✓ |
| new | ✓ | — |
| notification | ✓ | ✓ |
| notification_all | ✓ | — |
| notification_off | ✓ | ✓ |
| notification_setting | ✓ | ✓ |
| time | ✓ | ✓ |

---

## 8. 사용 가이드

### HTML inline 삽입 (권장)
```html
<!-- SVG를 직접 삽입해야 색상 제어 가능 -->
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 120 120" fill="none">
  <g transform="translate(-600, -740)">
    <path d="..." stroke="#222222" stroke-width="2" />
  </g>
</svg>
```

### 색상 변경 방법
SVG 파일 내 `stroke="#222222"` 및 `fill="#222222"`를 원하는 색상으로 교체합니다.

```javascript
// 예: 파일 읽어서 색상 치환
const svgContent = fs.readFileSync('icons/lined/02_Common/search.svg', 'utf8')
  .replace(/stroke="#222222"/g, 'stroke="currentColor"')
  .replace(/fill="#222222"/g, 'fill="currentColor"');
```

### CSS 크기 조정
`width`/`height` 속성을 원하는 크기로 변경합니다 (viewBox 비율 유지).

```css
.icon {
  width: 20px;
  height: 20px;
}
```

---

## 9. 네이밍 컨벤션

- **소문자 + 언더스코어(`_`)** 구분: `add_circle`, `check_member`
- **예외**: `to-do` (하이픈 사용)
- 스타일 구분은 폴더(`lined/` vs `filled/`)로 처리, 파일명은 동일

---

*Generated from v250826_G SaaS UI icon_filled.svg & v250826_G SaaS UI icon_lined.svg*
