# Manga Scraper

Multi-source manga scraper with Next.js dashboard, PostgreSQL, and adapter pattern. Scrape, organize, and read manga with a clean, responsive UI.

## Tech Stack

- **Framework:** Next.js 16 + React 19
- **Database:** PostgreSQL (Docker) + Drizzle ORM
- **Styling:** Tailwind CSS 4
- **Auth:** Custom JWT (jose) + bcryptjs
- **Validation:** Zod + react-hook-form
- **Language:** TypeScript

## Features

### Scraping & Download

- **Adapter pattern** — easily add new manga sources (currently Komiku)
- **URL validation** — only accepts supported manga URL formats
- **Test fetch** before job creation to verify URL is valid
- **Image download** with retry (3x), Referer header, content-type validation
- **Configurable chapter range** — specify start/end chapter to scrape
- **Real-time progress** — track scrape job status and progress
- **Check for updates** — detect new chapters on existing manga

### Manga Reader

- **3 reading modes** — LTR (left-to-right), RTL (right-to-left/manga), Vertical Scroll
- **Page jump** — type page number to jump directly (auto-select on focus)
- **Zoom** — mouse wheel (Ctrl+scroll in scroll mode), +/- keys, double-click toggle
- **Drag to pan** — click and drag when zoomed in
- **Reading history** — auto-saves current position (debounced 1s)
- **Continue reading** — resume from last read page with one click
- **Chapter navigation** — next/previous chapter buttons, chapter selector dropdown
- **Chapter complete overlay** — prompt to continue to next chapter (closeable)
- **Keyboard shortcuts** — arrow keys, +/-, 0 (reset), ? (help), Esc (close)

### Dashboard & Management

- **Manga collection** — grid view with thumbnails, chapters count, download status
- **Search & filter** — by title, source, download status
- **Delete manga** — confirmation modal, removes files from disk
- **Source link** — quick access to original manga website
- **Responsive design** — works on mobile and desktop
- **Reusable UI components** — Button (6 variants), Badge, Toast, ConfirmModal

### Authentication & Security

- **Custom JWT auth** — register, login, logout
- **Protected routes** — middleware-based route guard
- **Edge-compatible** — token verification runs on Edge Runtime
- **Stale cookie handling** — auto-clears invalid tokens on 401

## Prerequisites

- Node.js 18+
- Docker (for PostgreSQL)

## Setup

### 1. Start PostgreSQL

```bash
docker run -d --name db-postgre-container-name \
  -e POSTGRES_USER=your_username_database \
  -e POSTGRES_PASSWORD=your_password_database \
  -e POSTGRES_DB=your_database_name \
  -p 5432:5432 \
  postgres:16
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

Copy `.env` and edit if needed:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=your_username_database
DB_PASSWORD=your_password_database
```

### 4. Push database schema

```bash
npm run db:push
```

### 5. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Scripts

| Command               | Description              |
| --------------------- | ------------------------ |
| `npm run dev`         | Start dev server         |
| `npm run build`       | Build for production     |
| `npm run start`       | Start production server  |
| `npm run lint`        | Run ESLint               |
| `npm run db:push`     | Push schema to database  |
| `npm run db:generate` | Generate migration files |
| `npm run db:migrate`  | Run migrations           |

## Project Structure

```
scrmng/
├── .env                          # Environment config (gitignored)
├── .gitignore
├── README.md
├── LICENSE                       # MIT License
├── drizzle.config.ts             # Drizzle ORM config
├── eslint.config.mjs             # ESLint config
├── next.config.ts                # Next.js config
├── package.json
├── postcss.config.mjs            # PostCSS (Tailwind)
├── tsconfig.json
├── output/                       # Downloaded manga images (gitignored)
├── public/                       # Static assets
│   └── *.svg
└── src/
    ├── middleware.ts              # Auth middleware (Edge runtime)
    ├── app/
    │   ├── layout.tsx            # Root layout
    │   ├── page.tsx              # Dashboard (home)
    │   ├── globals.css           # Global styles
    │   ├── login/page.tsx        # Login page
    │   ├── register/page.tsx     # Register page
    │   ├── manga/[id]/page.tsx   # Manga detail + reader
    │   ├── scrape/
    │   │   ├── page.tsx          # Scrape form
    │   │   └── [jobId]/page.tsx  # Job progress tracker
    │   └── api/
    │       ├── auth/
    │       │   ├── login/route.ts
    │       │   ├── logout/route.ts
    │       │   ├── me/route.ts
    │       │   └── register/route.ts
    │       ├── images/[...path]/route.ts    # Serve manga images
    │       ├── manga/
    │       │   ├── route.ts                 # List manga
    │       │   └── [id]/
    │       │       ├── route.ts             # Get/Delete manga
    │       │       ├── chapters/route.ts
    │       │       ├── history/route.ts     # Reading history
    │       │       └── check-updates/route.ts
    │       └── scrape/
    │           ├── route.ts                 # Create scrape job
    │           ├── [jobId]/route.ts         # Get job status
    │           └── progress/route.ts        # Job progress SSE
    ├── components/
    │   ├── ui/
    │   │   ├── Button.tsx        # Reusable button (6 variants)
    │   │   └── Badge.tsx         # Status badge
    │   ├── AuthProvider.tsx       # Auth context provider
    │   ├── ChapterList.tsx        # Chapter list with status/history
    │   ├── ConfirmModal.tsx       # Confirmation dialog
    │   ├── Dashboard.tsx          # Manga collection grid
    │   ├── GalleryViewer.tsx      # Fullscreen manga reader
    │   ├── Navbar.tsx             # Navigation bar
    │   ├── ProgressTracker.tsx    # Scrape progress display
    │   ├── ProtectedRoute.tsx     # Route guard wrapper
    │   ├── ScrapeForm.tsx         # Scrape URL input form
    │   ├── SearchFilter.tsx       # Search & filter controls
    │   └── Toast.tsx              # Toast notifications
    └── lib/
        ├── auth.ts                # Auth functions (jose + bcryptjs)
        ├── auth-edge.ts           # Edge-safe token verification
        ├── db/
        │   ├── index.ts           # Drizzle DB connection
        │   └── schema.ts          # Database schema (5 tables)
        ├── schemas/               # Zod validation schemas
        │   ├── auth.schema.ts
        │   ├── chapter.schema.ts
        │   ├── manga.schema.ts
        │   ├── scrape-job.schema.ts
        │   └── index.ts
        └── scrapers/
            ├── base-adapter.ts    # Abstract adapter class
            ├── downloader.ts      # Image downloader with retry
            ├── index.ts           # Adapter registry
            └── adapters/
                └── komiku.adapter.ts  # Komiku source adapter
```

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
