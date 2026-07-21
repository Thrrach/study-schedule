# Project Structure Reorganization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move all application source code beneath `src/`, group class and timetable components by responsibility, and leave the repository root clean without changing application behavior.

**Architecture:** Preserve the existing layered modules (`api`, `controllers`, `data`, `lib`, `services`, and `types`) beneath a new `src/` source root. Keep the Next.js App Router at `src/app/`, retain co-located tests, and add only two component subgroups: `classes` and `timetable`.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript 5.7, Tailwind CSS 3, Vitest 4, PowerShell

## Global Constraints

- Do not split large files such as `page.tsx` into smaller modules.
- Do not rename components, functions, types, or public exports.
- Do not change application behavior, UI, styling, persistence, or test expectations.
- Do not introduce new dependencies or architectural layers.
- Keep tests adjacent to the implementation files they cover.
- Keep root configuration, metadata, dependency, documentation, and tool-managed files at the repository root.
- Preserve any unrelated user changes discovered before or during implementation.

---

## File Map

### Files and directories moved without content changes

- `app/` -> `src/app/`: Next.js routes, layout, and global styles.
- `api/` -> `src/api/`: Zustand-backed timetable state access and its test.
- `controllers/` -> `src/controllers/`: timetable UI controller hook.
- `data/` -> `src/data/`: sample timetable settings and classes.
- `lib/` -> `src/lib/`: pure utilities, i18n, import parsing, calendar export, and tests.
- `services/` -> `src/services/`: timetable domain operations and their test.
- `types/` -> `src/types/`: timetable domain types.
- `components/` -> `src/components/`: React components and UI primitives.
- `css.d.ts` -> `src/types/css.d.ts`: CSS import declaration.

### Files modified

- `tsconfig.json`: point `@/*` at `./src/*`.
- `vitest.config.ts`: point the `@` alias at `./src`.
- `tailwind.config.ts`: scan `src/app`, `src/components`, and `src/lib`.
- `src/app/page.tsx`: use the new class and timetable component paths.
- `src/components/classes/ClassForm.tsx`: use the grouped `ColorPicker` path.
- `src/components/timetable/TimeSlot.tsx`: use the grouped `ClassCard` path.
- `src/components/timetable/TimetableGrid.tsx`: use the grouped `ClassCard` path.

### Generated files removed after verification

- `.next/`
- Root-level `*.log` files
- `tsconfig.tsbuildinfo`

---

### Task 1: Establish the `src/` source root

**Files:**

- Move: `app/` -> `src/app/`
- Move: `api/` -> `src/api/`
- Move: `components/` -> `src/components/`
- Move: `controllers/` -> `src/controllers/`
- Move: `data/` -> `src/data/`
- Move: `lib/` -> `src/lib/`
- Move: `services/` -> `src/services/`
- Move: `types/` -> `src/types/`
- Move: `css.d.ts` -> `src/types/css.d.ts`
- Modify: `tsconfig.json`
- Modify: `vitest.config.ts`
- Modify: `tailwind.config.ts`

**Interfaces:**

- Consumes: existing `@/...` imports and the Next.js `app/` route structure.
- Produces: an application source root where `@/x` resolves to `src/x`, Next.js discovers `src/app/`, Vitest resolves the same alias, and Tailwind scans all styled source files.

- [ ] **Step 1: Confirm a clean implementation baseline**

Run:

```powershell
git status --short
npm run typecheck
npm test
```

Expected: `git status --short` prints nothing; type checking exits with code 0; Vitest exits with code 0 and all existing test files pass.

- [ ] **Step 2: Create `src/` and move each existing source directory**

Run from `P:\psu-table-class`:

```powershell
New-Item -ItemType Directory -Path 'src'
Move-Item -LiteralPath 'app' -Destination 'src\app'
Move-Item -LiteralPath 'api' -Destination 'src\api'
Move-Item -LiteralPath 'components' -Destination 'src\components'
Move-Item -LiteralPath 'controllers' -Destination 'src\controllers'
Move-Item -LiteralPath 'data' -Destination 'src\data'
Move-Item -LiteralPath 'lib' -Destination 'src\lib'
Move-Item -LiteralPath 'services' -Destination 'src\services'
Move-Item -LiteralPath 'types' -Destination 'src\types'
Move-Item -LiteralPath 'css.d.ts' -Destination 'src\types\css.d.ts'
```

Expected: every command succeeds; the former root-level source directories and `css.d.ts` no longer exist; `src/app/page.tsx` and `src/types/css.d.ts` exist.

- [ ] **Step 3: Point TypeScript at the new source root**

Modify `tsconfig.json` so the alias block is exactly:

```json
"paths": {
  "@/*": ["./src/*"]
}
```

Keep every other compiler option and include/exclude entry unchanged.

- [ ] **Step 4: Point Vitest at the new source root**

Modify `vitest.config.ts` so the resolve block is:

```ts
resolve: {
  alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) }
},
```

Keep the Node test environment and coverage reporters unchanged.

- [ ] **Step 5: Point Tailwind at the new source root**

Modify the `content` array in `tailwind.config.ts` to:

```ts
content: [
  "./src/app/**/*.{ts,tsx}",
  "./src/components/**/*.{ts,tsx}",
  "./src/lib/**/*.{ts,tsx}"
],
```

Keep the existing theme and plugin configuration unchanged.

- [ ] **Step 6: Verify the source-root move**

Run:

```powershell
npm run typecheck
npm test
```

Expected: both commands exit with code 0; all existing tests pass without test or snapshot changes.

- [ ] **Step 7: Review and commit the source-root move**

Run:

```powershell
git diff --check
git status --short
git add src tsconfig.json vitest.config.ts tailwind.config.ts app api components controllers data lib services types css.d.ts
git commit -m "refactor: move application code under src"
```

Expected: `git diff --check` prints nothing; Git records source moves plus three configuration edits; the commit succeeds.

---

### Task 2: Group class-management components

**Files:**

- Move: `src/components/BulkImportDialog.tsx` -> `src/components/classes/BulkImportDialog.tsx`
- Move: `src/components/ClassForm.tsx` -> `src/components/classes/ClassForm.tsx`
- Move: `src/components/ColorPicker.tsx` -> `src/components/classes/ColorPicker.tsx`
- Move: `src/components/SubjectDetailDialog.tsx` -> `src/components/classes/SubjectDetailDialog.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/components/classes/ClassForm.tsx`

**Interfaces:**

- Consumes: the existing named exports `BulkImportDialog`, `ClassForm`, `ColorPicker`, and `SubjectDetailDialog`.
- Produces: the same named exports at `@/components/classes/<ComponentName>` with unchanged props and behavior.

- [ ] **Step 1: Create the component group and move the four files**

Run:

```powershell
New-Item -ItemType Directory -Path 'src\components\classes'
Move-Item -LiteralPath 'src\components\BulkImportDialog.tsx' -Destination 'src\components\classes\BulkImportDialog.tsx'
Move-Item -LiteralPath 'src\components\ClassForm.tsx' -Destination 'src\components\classes\ClassForm.tsx'
Move-Item -LiteralPath 'src\components\ColorPicker.tsx' -Destination 'src\components\classes\ColorPicker.tsx'
Move-Item -LiteralPath 'src\components\SubjectDetailDialog.tsx' -Destination 'src\components\classes\SubjectDetailDialog.tsx'
```

Expected: the four files exist only in `src/components/classes/`.

- [ ] **Step 2: Update class-component imports**

In `src/app/page.tsx`, replace the three class-management component imports with:

```ts
import { ClassForm } from "@/components/classes/ClassForm";
import { BulkImportDialog } from "@/components/classes/BulkImportDialog";
import { SubjectDetailDialog } from "@/components/classes/SubjectDetailDialog";
```

`ColorPicker` is not imported by `page.tsx`. In `src/components/classes/ClassForm.tsx`, replace its component import with:

```ts
import { ColorPicker } from "@/components/classes/ColorPicker";
```

Keep import ordering changes limited to what ESLint requires.

- [ ] **Step 3: Prove no old class-component paths remain**

Run:

```powershell
rg -n '@/components/(BulkImportDialog|ClassForm|ColorPicker|SubjectDetailDialog)' src
```

Expected: no matches and exit code 1, because all imports now include `/classes/`.

- [ ] **Step 4: Verify and commit the class-component grouping**

Run:

```powershell
npm run typecheck
npm test
git diff --check
git add src/app/page.tsx src/components/classes src/components/BulkImportDialog.tsx src/components/ClassForm.tsx src/components/ColorPicker.tsx src/components/SubjectDetailDialog.tsx
git commit -m "refactor: group class management components"
```

Expected: type checking and tests exit with code 0; whitespace validation prints nothing; Git records four component moves and import-only edits; the commit succeeds.

---

### Task 3: Group timetable-rendering components

**Files:**

- Move: `src/components/ClassCard.tsx` -> `src/components/timetable/ClassCard.tsx`
- Move: `src/components/TimeSlot.tsx` -> `src/components/timetable/TimeSlot.tsx`
- Move: `src/components/TimetableGrid.tsx` -> `src/components/timetable/TimetableGrid.tsx`
- Move: `src/components/TimetableListView.tsx` -> `src/components/timetable/TimetableListView.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/components/timetable/TimeSlot.tsx`
- Modify: `src/components/timetable/TimetableGrid.tsx`

**Interfaces:**

- Consumes: the existing named exports `ClassCard`, `TimeSlot`, `TimetableGrid`, and `TimetableListView`.
- Produces: the same named exports at `@/components/timetable/<ComponentName>` with unchanged props and behavior.

- [ ] **Step 1: Create the component group and move the four files**

Run:

```powershell
New-Item -ItemType Directory -Path 'src\components\timetable'
Move-Item -LiteralPath 'src\components\ClassCard.tsx' -Destination 'src\components\timetable\ClassCard.tsx'
Move-Item -LiteralPath 'src\components\TimeSlot.tsx' -Destination 'src\components\timetable\TimeSlot.tsx'
Move-Item -LiteralPath 'src\components\TimetableGrid.tsx' -Destination 'src\components\timetable\TimetableGrid.tsx'
Move-Item -LiteralPath 'src\components\TimetableListView.tsx' -Destination 'src\components\timetable\TimetableListView.tsx'
```

Expected: the four files exist only in `src/components/timetable/`.

- [ ] **Step 2: Update timetable-component imports**

In `src/app/page.tsx`, use:

```ts
import { TimetableGrid } from "@/components/timetable/TimetableGrid";
import { TimetableListView } from "@/components/timetable/TimetableListView";
```

In both `src/components/timetable/TimeSlot.tsx` and `src/components/timetable/TimetableGrid.tsx`, use:

```ts
import { ClassCard } from "@/components/timetable/ClassCard";
```

No current module imports `TimeSlot`; its exported interface remains unchanged.

- [ ] **Step 3: Prove no old timetable-component paths remain**

Run:

```powershell
rg -n '@/components/(ClassCard|TimeSlot|TimetableGrid|TimetableListView)' src
```

Expected: no matches and exit code 1, because all imports now include `/timetable/`.

- [ ] **Step 4: Verify and commit the timetable-component grouping**

Run:

```powershell
npm run typecheck
npm test
git diff --check
git add src/app/page.tsx src/components/timetable src/components/ClassCard.tsx src/components/TimeSlot.tsx src/components/TimetableGrid.tsx src/components/TimetableListView.tsx
git commit -m "refactor: group timetable components"
```

Expected: type checking and tests exit with code 0; whitespace validation prints nothing; Git records four component moves and import-only edits; the commit succeeds.

---

### Task 4: Run full verification and clean generated artifacts

**Files:**

- Verify: all tracked source and configuration files.
- Remove from working directory: `.next/`, root-level `*.log`, and `tsconfig.tsbuildinfo`.

**Interfaces:**

- Consumes: the completed source-root and component-grouping commits.
- Produces: a verified repository whose tracked working tree is clean and whose root has no approved generated build/cache/log artifacts.

- [ ] **Step 1: Run every project verification command**

Run:

```powershell
npm run typecheck
npm run lint
npm test
npm run build
```

Expected: all four commands exit with code 0; ESLint reports no errors; all Vitest tests pass; Next.js reports a successful production build.

- [ ] **Step 2: Review the final tracked diff and repository structure**

Run:

```powershell
git status --short
git log -4 --oneline
rg --files src
Get-ChildItem -Force | Select-Object Mode,Name
```

Expected: the tracked working tree is clean; the latest commits are the design plus the three refactor commits; all application files appear beneath `src/`; no old root-level application source directory appears.

- [ ] **Step 3: Resolve cleanup targets before deletion**

Run:

```powershell
Resolve-Path -LiteralPath 'P:\psu-table-class\.next' -ErrorAction SilentlyContinue
Resolve-Path -LiteralPath 'P:\psu-table-class\tsconfig.tsbuildinfo' -ErrorAction SilentlyContinue
Get-ChildItem -LiteralPath 'P:\psu-table-class' -File -Filter '*.log' | Select-Object FullName
```

Expected: every printed path starts with `P:\psu-table-class\`; no cleanup target is outside the workspace.

- [ ] **Step 4: Remove only the approved reproducible artifacts**

Run:

```powershell
Remove-Item -LiteralPath 'P:\psu-table-class\.next' -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath 'P:\psu-table-class\tsconfig.tsbuildinfo' -Force -ErrorAction SilentlyContinue
Get-ChildItem -LiteralPath 'P:\psu-table-class' -File -Filter '*.log' | Remove-Item -Force
```

Expected: `.next/`, `tsconfig.tsbuildinfo`, and root-level `.log` files no longer exist. They remain covered by `.gitignore` and can be regenerated by normal development commands.

- [ ] **Step 5: Confirm the final clean state without regenerating artifacts**

Run:

```powershell
git status --short
Test-Path -LiteralPath 'P:\psu-table-class\.next'
Test-Path -LiteralPath 'P:\psu-table-class\tsconfig.tsbuildinfo'
Get-ChildItem -LiteralPath 'P:\psu-table-class' -File -Filter '*.log'
```

Expected: Git prints nothing; both `Test-Path` calls print `False`; the log query prints nothing.
