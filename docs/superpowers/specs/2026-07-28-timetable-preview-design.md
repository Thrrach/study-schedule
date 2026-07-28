# Timetable Preview Page Design

## Goal

Add a full-page preview flow at `/blank` so a user can inspect the current timetable exactly as it will be rendered before downloading it as a PNG or JPEG image.

## User flow

1. The user edits the timetable on `/`.
2. The existing image-export entry point becomes a preview action and navigates to `/blank`.
3. `/blank` reads the current timetable and settings from the existing client-side store.
4. The user reviews the rendered timetable, selects PNG or JPEG, and downloads the image.
5. The user can return to `/` to continue editing.

The preview must use the same timetable state, visible days, time range, metadata, and export styling as the existing timetable export. It must not create a second copy of timetable data.

## Page structure

### Preview header

- Back action to return to the editor.
- Clear page title indicating that this is a timetable preview.
- Current semester and student name when available.
- Image format selector for PNG or JPEG.
- Primary download action.
- Existing language and theme preferences remain respected.

### Preview canvas

- Reuse the timetable grid and export header so the preview matches the downloaded image.
- Render the current visible days and configured start/end times.
- Use a centered, scrollable canvas suitable for wide timetable layouts.
- Disable timetable editing interactions in preview mode: no drag-and-drop, add, edit, duplicate, delete, or course-detail actions.
- Provide an accessible empty state when there are no courses to preview.

## Component and data design

- Keep `/blank/page.tsx` as the route entry and move page behavior into a client component under `components/pages/`.
- Reuse `useTimetableController` and `useTranslation`; do not introduce a separate preview store or route payload.
- Extend `TimetableGrid` with an explicit read-only/preview mode, or equivalent optional interaction behavior, while preserving the current editor behavior on `/`.
- Reuse `ExportButton` and `html-to-image` for the download operation. The preview canvas must have a stable target id dedicated to the preview route.
- Change the existing image-export entry points on `/` to navigate to `/blank` instead of downloading immediately. The actual download remains available on the preview page.
- Preserve the current PNG/JPEG selection as the selected format when navigating if the existing flow already has a selected format; otherwise default to PNG.

## Accessibility and responsive behavior

- All controls have visible labels or accessible names.
- Back and download controls remain keyboard reachable.
- The timetable canvas scrolls horizontally on narrow screens without forcing the page itself to overflow.
- Preview-only controls are excluded from the downloaded image.
- Dark-mode app chrome is allowed, but the exported timetable remains the existing light, print-friendly rendering.

## Error and empty states

- If the timetable has no courses, show a helpful empty state while keeping the back and format controls usable.
- If image generation fails, reuse the existing export error treatment and keep the user on the preview page so they can retry.
- If the store is still hydrating, show a lightweight loading state rather than briefly rendering incorrect sample data.

## Verification criteria

- Navigating from the editor opens `/blank` and shows the current timetable.
- Changes made on `/` are reflected in the preview after navigation or refresh through the existing persisted store.
- Preview mode has no editing interactions.
- PNG and JPEG downloads target only the timetable canvas and exclude preview controls.
- Back navigation returns to the editor without losing state.
- Existing editor timetable behavior remains unchanged.
- Tests, typecheck, lint, and production build pass.
