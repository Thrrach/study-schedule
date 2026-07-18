# PSU Timetable Builder

A modern Next.js timetable builder inspired by Prince of Songkla University registration/SIS workflows. It helps students manually create a weekly class schedule, keep it in localStorage, and export the timetable as an image.

## Features

- Horizontal weekday timetable with Monday-Friday rows and 08:00-16:00 hour columns.
- Hour-only timetable header using fixed-width hour columns as the visual reference.
- Custom start time, end time, interval minutes, and editable ordered time slots.
- PSU-style time support, including slots such as `08:00`, `08:50`, `09:00`, `09:50`, `10:00`, and `10:50`. The default `50` minute interval uses this `:00` / `:50` PSU-style pattern.
- Add, edit, duplicate, delete, and drag classes between cells.
- Select multiple weekdays for one subject; the subject renders independently on every selected weekday row.
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
- Semester start/end dates, no-class dates, and make-up days.
- Finite iCalendar recurrence with `UNTIL`, `EXDATE`, and `RDATE`, plus all-day midterm/final exam events.
- Optional Saturday and Sunday rows with configurable visible days.
- CSV/tab-separated text import with Thai and English headers and row-level validation.
- Multiple schedule plans for comparing course counts, credits, and conflicts.
- Credits, class type, enrollment status, online-class URL, and exam dates.
- Local-first backup sharing through the Web Share API with JSON download fallback.
- A backup reminder when no backup has been saved in the last 14 days.
- Automated unit tests and GitHub Actions CI.

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
npm run lint
npm test
npm run build
```

## CSV / Text Import

Paste comma-separated or tab-separated data. A header row is recommended. Supported headers include `courseCode`, `courseName`, `section`, `days`, `startTime`, `endTime`, `instructor`, `room`, `credits`, `type`, `status`, `url`, `midterm`, `final`, and `note`. Thai header aliases are also supported.

```csv
courseCode,courseName,section,days,startTime,endTime,credits,type,status
344-211,Database Systems,01,Monday/Wednesday,08:00,09:50,3,lecture,enrolled
```

## Manual QA Checklist

1. Create a second schedule plan, switch between plans, and confirm their courses remain independent.
2. Open Settings, enable Saturday and Sunday, and confirm both rows appear in grid and list views.
3. Set semester dates, add a no-class date and a make-up date, then export `.ics`.
4. Import the CSV example above and confirm the preview reports one valid course before importing.
5. Add a course with credits, type, status, online URL, and exam dates; open its detail dialog to verify the fields.
6. Export or share a JSON backup, import it again, and confirm every schedule plan is restored.
