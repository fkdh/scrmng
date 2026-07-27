# Manga Scraper

Multi-source manga scraper with Next.js dashboard, PostgreSQL, and adapter pattern.

## Tech Stack

- **Framework:** Next.js 16 + React 19
- **Database:** PostgreSQL (Docker) + Drizzle ORM
- **Styling:** Tailwind CSS 4
- **Auth:** Custom JWT (jose) + bcryptjs
- **Validation:** Zod + react-hook-form
- **Language:** TypeScript

## Features

- Adapter pattern scraping (easily add new manga sources)
- 3 reading modes: LTR, RTL (Manga), Vertical Scroll
- Reading history with auto-save
- Search & filter manga collection
- Thumbnail gallery with zoom/pan
- Responsive design (mobile + desktop)
- Custom auth (register/login/logout)
- Scrape job progress tracking

## Prerequisites

- Node.js 18+
- Docker (for PostgreSQL)

## Setup

### 1. Start PostgreSQL

```bash
docker run -d --name db-postgre \
  -e POSTGRES_USER=your_username \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=your_database \
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
DB_NAME=your_database
DB_USER=your_username
DB_PASSWORD=your_password
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

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Push schema to database |
| `npm run db:generate` | Generate migration files |
| `npm run db:migrate` | Run migrations |

## Project Structure

```
├── src/
│   ├── app/                # Next.js app routes
│   │   ├── api/            # API routes
│   │   ├── login/          # Login page
│   │   ├── register/       # Register page
│   │   ├── scrape/         # Scrape form & progress
│   │   └── manga/[id]/     # Manga detail + reader
│   ├── components/         # React components
│   │   ├── ui/             # Reusable UI (Button, Badge)
│   │   ├── GalleryViewer.tsx  # Fullscreen manga reader
│   │   ├── ChapterList.tsx    # Chapter list with status
│   │   ├── Dashboard.tsx      # Manga collection grid
│   │   └── ...
│   └── lib/
│       ├── db/             # Drizzle schema & config
│       ├── scrapers/       # Adapter pattern scrapers
│       │   ├── adapters/   # Source-specific adapters
│       │   ├── base-adapter.ts
│       │   └── downloader.ts
│       ├── auth.ts         # Authentication functions
│       └── schemas.ts      # Zod validation schemas
├── output/                 # Downloaded manga images
├── drizzle.config.ts
├── next.config.ts
└── package.json
```
