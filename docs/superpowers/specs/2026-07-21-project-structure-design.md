# Project Structure Reorganization Design

## Goal

Reorganize the PSU Timetable Builder repository so application code is easy to locate and the repository root remains focused on project configuration. The change must preserve existing runtime behavior and avoid splitting or rewriting implementation code.

## Scope

This work will:

- Move application source files under `src/`.
- Group timetable and class-related React components by responsibility.
- Keep unit tests beside the source files they cover.
- Update TypeScript, Vitest, and Tailwind paths for the new source root.
- Update all affected imports without changing exported APIs or behavior.
- Remove ignored build artifacts and development logs that can be regenerated.
- Verify the reorganized project with type checking, linting, unit tests, and a production build.

This work will not:

- Split large files such as `page.tsx` into smaller modules.
- Rename components, functions, types, or public exports.
- Change application behavior, UI, styling, persistence, or test expectations.
- Introduce new dependencies or architectural layers.

## Target Structure

```text
src/
|-- app/
|-- api/
|-- components/
|   |-- classes/
|   |   |-- BulkImportDialog.tsx
|   |   |-- ClassForm.tsx
|   |   |-- ColorPicker.tsx
|   |   `-- SubjectDetailDialog.tsx
|   |-- timetable/
|   |   |-- ClassCard.tsx
|   |   |-- TimeSlot.tsx
|   |   |-- TimetableGrid.tsx
|   |   `-- TimetableListView.tsx
|   |-- ui/
|   |-- ExportButton.tsx
|   |-- ThemeToggle.tsx
|   `-- toast.tsx
|-- controllers/
|-- data/
|-- lib/
|-- services/
`-- types/
    |-- css.d.ts
    `-- timetable.ts
```

The repository root will retain configuration and metadata files that conventionally belong there, including `package.json`, lockfiles, Next.js configuration, TypeScript configuration, Tailwind configuration, PostCSS configuration, ESLint configuration, Vitest configuration, `README.md`, and Next.js-generated declaration files.

## File Placement Rules

- Next.js routes, layouts, and global styles belong in `src/app/`.
- Reusable low-level interface primitives remain in `src/components/ui/`.
- Components used to create, import, edit, or inspect classes belong in `src/components/classes/`.
- Components that render timetable grid or list views belong in `src/components/timetable/`.
- Cross-cutting top-level components remain directly in `src/components/` to avoid unnecessary nesting.
- API state access, controllers, services, data, utilities, domain types, and the CSS module declaration retain their current layer names under `src/`.
- Test files remain adjacent to the implementation they test.

## Configuration and Imports

The TypeScript alias `@/*` will resolve to `./src/*`. Vitest will resolve `@` to the same `src/` directory. Tailwind will scan source files beneath `src/app/`, `src/components/`, and `src/lib/`.

All imports affected by component grouping or the new source root will be updated. Existing module exports and filenames will remain unchanged.

## Generated-File Cleanup

The following ignored, reproducible artifacts may be removed from the working directory:

- `.next/`
- `*.log`
- `tsconfig.tsbuildinfo`

`node_modules/` will remain because dependency removal is not required for repository organization.

## Safety and Verification

File moves will be performed as explicit, repository-scoped operations. No unrelated user changes will be overwritten. After the moves and path updates, the following checks must pass:

1. `npm run typecheck`
2. `npm run lint`
3. `npm test`
4. `npm run build`

The final Git diff will also be reviewed to confirm that changes consist only of moves, import/configuration updates, documentation, and approved generated-file cleanup.

## Success Criteria

- All application source code is under `src/` and follows the target structure.
- The repository root contains only configuration, metadata, dependency, documentation, and tool-managed directories/files.
- No application behavior or public API changes.
- Type checking, linting, unit tests, and production build all pass.
