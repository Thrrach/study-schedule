# Timetable Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (\`- [ ]\`) syntax for tracking.

**Goal:** Build a full-page \`/blank\` preview that shows the current timetable in export-ready form and lets the user download PNG or JPEG after reviewing it.

**Architecture:** Keep timetable data in the existing persisted Zustand store. Add a focused client page component for \`/blank\`, reuse \`TimetableGrid\` and \`ExportButton\`, and give the grid an explicit read-only mode so the editor remains interactive while the preview is not. Change the editor's image-export entry points to navigate to \`/blank\`, passing the selected format in the query string.

**Tech Stack:** Next.js App Router, React, TypeScript, Zustand persist, Tailwind CSS, Radix Select, \`html-to-image\`, Vitest.

## Global Constraints

- The preview must use the same timetable state, visible days, time range, metadata, and export styling as the existing timetable export.
- The preview must not create a second copy of timetable data.
- Preview mode must disable drag-and-drop, add, edit, duplicate, delete, and course-detail actions.
- Preview-only controls must be excluded from the downloaded image.
- Existing editor timetable behavior must remain unchanged.
- PNG and JPEG downloads must remain supported.

## File map

- Create: \`lib/preview.ts\` — pure helpers for parsing the preview format and building the preview route URL.
- Test: \`lib/preview.test.ts\` — unit tests for the pure preview helpers.
- Modify: \`components/TimetableGrid.tsx\` — add a \`readOnly\` prop and remove editor interactions from the rendered grid when enabled.
- Create: \`components/pages/TimetablePreviewPage.tsx\` — client route UI, store hydration/loading state, header, format selection, empty state, and export-ready grid.
- Modify: \`app/blank/page.tsx\` — render the new preview page component instead of the blank shell.
- Modify: \`app/page.tsx\` — route image-export actions to \`/blank\` and preserve the selected image format in the query string.
- Modify: \`lib/i18n.ts\` — add Thai and English strings for preview actions, status, and empty/loading states.

## Task 1: Add tested preview URL and format helpers

**Files:**
- Create: \`lib/preview.ts\`
- Test: \`lib/preview.test.ts\`

**Interfaces:**
- Produces \`parsePreviewFormat(value: string | null | undefined): ImageFormat\`.
- Produces \`buildPreviewHref(format: ImageFormat): string\`.

- [ ] **Step 1: Write the failing tests**

~~~ts
import { describe, expect, it } from "vitest";
import { buildPreviewHref, parsePreviewFormat } from "@/lib/preview";

describe("preview helpers", () => {
  it("accepts png and jpeg formats and defaults invalid values to png", () => {
    expect(parsePreviewFormat("jpeg")).toBe("jpeg");
    expect(parsePreviewFormat("png")).toBe("png");
    expect(parsePreviewFormat("gif")).toBe("png");
    expect(parsePreviewFormat(null)).toBe("png");
  });

  it("builds a preview route with the selected format", () => {
    expect(buildPreviewHref("png")).toBe("/blank?format=png");
    expect(buildPreviewHref("jpeg")).toBe("/blank?format=jpeg");
  });
});
~~~

- [ ] **Step 2: Run the focused test and verify it fails**

Run: \`npm.cmd test -- lib/preview.test.ts\`

Expected: FAIL because \`lib/preview.ts\` does not exist yet.

- [ ] **Step 3: Implement the minimal helpers**

~~~ts
import type { ImageFormat } from "@/types/timetable";

export function parsePreviewFormat(value: string | null | undefined): ImageFormat {
  return value === "jpeg" ? "jpeg" : "png";
}

export function buildPreviewHref(format: ImageFormat) {
  return \`/blank?format=\${format}\`;
}
~~~

- [ ] **Step 4: Run the focused test and verify it passes**

Run: \`npm.cmd test -- lib/preview.test.ts\`

Expected: PASS with 2 tests.

- [ ] **Step 5: Commit the helper and tests**

~~~bash
git add lib/preview.ts lib/preview.test.ts
git commit -m "test: add timetable preview route helpers"
~~~

## Task 2: Make the timetable grid explicitly read-only

**Files:**
- Modify: \`components/TimetableGrid.tsx\`

**Interfaces:**
- Extends \`TimetableGridProps\` with \`readOnly?: boolean\`.
- Existing editor callers continue to omit \`readOnly\` and remain interactive.

- [ ] **Step 1: Add the read-only prop and update the grid render**

Add \`readOnly?: boolean\` to \`TimetableGridProps\`, default it to \`false\` in the component parameters, and pass it through \`DayRow\`. In read-only mode, render the same cards and timeline but omit click/drag handlers and omit card action callbacks. The editor path must continue passing all existing callbacks without \`readOnly\`, so its behavior remains unchanged.

- [ ] **Step 2: Remove interaction affordances in read-only mode**

Use conditional props rather than changing the data model. \`TimelineBackground\` should return a non-interactive background when \`readOnly\` is true. \`ClassCard\` should receive no action callbacks in read-only mode; the card remains visible as part of the exported image.

- [ ] **Step 3: Run typecheck and existing tests**

Run: \`npm.cmd run typecheck\` and \`npm.cmd test\`

Expected: PASS; the editor's existing \`TimetableGrid\` call remains type-correct and all existing tests pass.

- [ ] **Step 4: Commit the read-only grid change**

~~~bash
git add components/TimetableGrid.tsx
git commit -m "feat: support read-only timetable grid"
~~~

## Task 3: Build the full-page preview route

**Files:**
- Create: \`components/pages/TimetablePreviewPage.tsx\`
- Modify: \`app/blank/page.tsx\`
- Modify: \`lib/i18n.ts\`

**Interfaces:**
- \`TimetablePreviewPage\` reads \`format\` from \`useSearchParams\`, reads \`classes\`, \`settings\`, and \`hydrated\` from \`useTimetableController\`, and renders the stable export target id \`timetable-preview-export\`.
- The page uses \`ExportButton targetId="timetable-preview-export"\`.

- [ ] **Step 1: Add preview translations before using them**

Add matching keys to both dictionaries:

~~~ts
"preview.title": "ดูตัวอย่างตารางเรียน",
"preview.description": "ตรวจสอบตารางก่อนดาวน์โหลดเป็นรูปภาพ",
"preview.back": "กลับไปแก้ไข",
"preview.download": "ดาวน์โหลดภาพ",
"preview.emptyTitle": "ยังไม่มีรายวิชาให้แสดง",
"preview.emptyDescription": "กลับไปเพิ่มรายวิชาในตารางก่อนดาวน์โหลดภาพ",
"preview.loading": "กำลังโหลดตาราง...",
"preview.format": "รูปแบบไฟล์ภาพ",
~~~

Use equivalent English values in \`en\` so \`TranslationKey\` remains type-safe.

- [ ] **Step 2: Create the client preview component**

The component should use \`"use client"\` and follow this structure:

~~~tsx
const { classes, settings, hydrated } = useTimetableController();
const { t, language } = useTranslation();
const searchParams = useSearchParams();
const router = useRouter();
const [format, setFormat] = useState<ImageFormat>(() => parsePreviewFormat(searchParams.get("format")));
const [exportDate, setExportDate] = useState(() => formatExportDate(dayjs(), language));
~~~

Render:

1. \`main\` with the existing \`app-shell\` visual treatment.
2. Header with back button, title, semester/student metadata, format \`Select\`, and \`ExportButton\`.
3. Hydration loading state while \`hydrated\` is false.
4. Empty state when hydrated and \`classes.length === 0\`.
5. Otherwise, a scrollable centered canvas containing \`TimetableGrid\` with \`readOnly\`, current settings, current classes, current \`visibleDays\`, and no-op callbacks only where the TypeScript interface requires them.

The export target must contain only the timetable canvas. Header controls, empty-state copy, and back controls must be outside \`timetable-preview-export\` or have \`no-print\` so they cannot enter the downloaded image. The page back action should call \`router.push("/")\`.

- [ ] **Step 3: Replace the blank route shell**

Update \`app/blank/page.tsx\` to:

~~~tsx
import { TimetablePreviewPage } from "@/components/pages/TimetablePreviewPage";

export default function BlankRoutePage() {
  return <TimetablePreviewPage />;
}
~~~

- [ ] **Step 4: Run the focused tests and typecheck**

Run: \`npm.cmd test -- lib/preview.test.ts\` and \`npm.cmd run typecheck\`

Expected: PASS with no TypeScript errors.

- [ ] **Step 5: Commit the preview route**

~~~bash
git add app/blank/page.tsx components/pages/TimetablePreviewPage.tsx lib/i18n.ts
git commit -m "feat: add timetable preview page"
~~~

## Task 4: Route editor export actions into Preview

**Files:**
- Modify: \`app/page.tsx\`

**Interfaces:**
- Existing image-export controls navigate using \`buildPreviewHref(imageFormat)\` instead of invoking \`ExportButton\` directly.
- The existing format selector in the tools dialog remains the source of the selected format.

- [ ] **Step 1: Replace direct export actions with preview navigation**

Import \`useRouter\` and \`buildPreviewHref\`, create \`const router = useRouter()\`, and replace both existing image \`ExportButton\` usages with buttons that navigate to the preview route:

~~~tsx
<Button type="button" variant="outline" onClick={() => router.push(buildPreviewHref(imageFormat))}>
  <Eye className="h-4 w-4" />
  {t("preview.title")}
</Button>
~~~

The tools dialog version should use the same selected \`imageFormat\`. Keep the ICS and JSON backup actions unchanged.

- [ ] **Step 2: Run typecheck and lint**

Run: \`npm.cmd run typecheck\` and \`npm.cmd run lint\`

Expected: PASS with no new warnings/errors.

- [ ] **Step 3: Commit the editor integration**

~~~bash
git add app/page.tsx
git commit -m "feat: open timetable preview before image export"
~~~

## Task 5: Verify the complete flow

**Files:**
- Modify only if verification finds a defect in the files above.

- [ ] **Step 1: Run the full automated checks**

Run:

~~~bash
npm.cmd test
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
~~~

Expected: all commands exit successfully.

- [ ] **Step 2: Manually verify the user flow**

Start the app with \`npm.cmd run dev\`, then verify:

1. \`/\` loads the editor and the preview action opens \`/blank?format=png\`.
2. \`/blank\` shows the current classes and settings, including visible days, semester, and student name.
3. The preview grid cannot add, drag, view, edit, duplicate, or delete a class.
4. Switching to JPEG changes the download format and downloads \`psu-timetable.jpeg\`; PNG downloads \`psu-timetable.png\`.
5. The downloaded image contains only the export timetable, not the preview toolbar.
6. Back returns to \`/\` without losing timetable data.
7. An empty timetable shows the empty state while back and format controls remain usable.

- [ ] **Step 3: Review the final diff**

Run: \`git diff --check\` and \`git status --short\`

Expected: no whitespace errors. Any remaining changes are intentional implementation changes or test artifacts that should not be committed.

- [ ] **Step 4: Commit any final fix**

~~~bash
git add app components lib
git commit -m "fix: polish timetable preview flow"
~~~

