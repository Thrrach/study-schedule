# PSU Timetable Builder

A modern Next.js timetable builder inspired by Prince of Songkla University registration/SIS workflows. It helps students manually create a weekly class schedule, keep it in localStorage, and export the timetable as an image.

## Features

- Horizontal weekly timetable with days as sticky left rows and time slots as sticky top columns.
- Hour-only timetable header using fixed-width hour columns as the visual reference.
- Custom start time, end time, interval minutes, and editable ordered time slots.
- PSU-style time support, including slots such as `08:00`, `08:50`, `09:00`, `09:50`, `10:00`, and `10:50`. The default `50` minute interval uses this `:00` / `:50` PSU-style pattern.
- Add, edit, duplicate, delete, and drag classes between cells.
- Multiple classes in the same day/time cell are stacked by `createdAt` ascending.
- Add, edit, remove, and reorder custom PSU-style time columns.
- Class cards are absolutely positioned from `startTime` and `endTime` using timeline math, so width is proportional to real duration.
- Required-field validation and overlap warnings that do not block saving.
- Preset colors and custom color picker.
- Export the full timetable grid as high-resolution PNG or JPEG with `html-to-image`, including horizontally scrollable columns.
- Export and import JSON backups.
- localStorage persistence.
- Print-friendly timetable view.
- Sample data included.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui-style local components using Radix primitives
- Zustand
- html-to-image

## Setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Verification

```bash
npm run typecheck
npm run build
```
