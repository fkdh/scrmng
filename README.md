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

- **Stats panel** — total manga, chapters, images, active jobs
- **Search & filter** — by title, source, download status
- **New Scrape button** — integrated in search panel (admin only)
- **Reading history badges** — shows last read chapter + page on manga cards
- **Delete manga** — confirmation modal, removes files from disk (admin only)
- **Responsive design** — optimized layout for mobile and desktop

### User Management (Admin)

- **Role-based access control** — admin and customer roles
- **Approval flow** — new users require admin approval before login
- **User management page** — approve, reject, change roles, activate/deactivate
- **3-dot dropdown menu** — mobile-friendly actions for each user

### Reading History

- **Per-user tracking** — each user has separate reading history
- **History page** — list of all manga with reading progress
- **Lanjut Baca** — continue reading from last position
- **Progress display** — chapter number + page (e.g., "Ch 30 page 7")

### Navigation

- **Avatar dropdown menu** — Profile, History, Logout
- **Mobile hamburger drawer** — slide-in navigation for mobile
- **Desktop nav links** — Dashboard, Manage Users (admin)

### Authentication & Security

- **Custom JWT auth** — register, login, logout
- **Role-based access** — admin-only routes and actions
- **Protected routes** — middleware-based route guard
- **Edge-compatible** — token verification runs on Edge Runtime
- **Stale cookie handling** — auto-clears invalid tokens on 401

### Reusable Components

- **Button** — 6 variants (primary, secondary, danger, success, ghost, icon), 3 sizes (sm, md, lg)
- **Badge** — status indicators (pending, downloading, completed, error)
- **DropdownMenu** — configurable dropdown with icons, dividers, danger items
- **Drawer** — mobile slide-in panel with backdrop
- **Toast** — notification system
- **ConfirmModal** — confirmation dialog

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

### 5. Seed admin user

```bash
npm run db:seed-admin
```

Default admin: `admin@admin.com` / `admin123`

### 6. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Local Network Access (WSL2)

To access the app from other devices on your local network (e.g., phone) while running WSL2:

### 1. Run dev server with network access

```bash
npm run dev:lan
```

### 2. Find your WSL IP

```bash
hostname -I
# Example output: 172.20.169.144
```

### 3. Set up port forwarding (Windows PowerShell as Admin)

```powershell
netsh interface portproxy add v4tov4 listenport=3000 listenaddress=0.0.0.0 connectport=3000 connectaddress=172.20.169.144
```

### 4. Find your Windows IP

Open PowerShell/CMD on Windows:

```cmd
ipconfig
```

Look for `IPv4 Address` under your WiFi/Ethernet adapter (e.g., `192.168.1.100`).

### 5. Access from your phone

Open **`http://<WINDOWS_IP>:3000`** on your phone browser.

### Useful commands

```powershell
# Show port forwarding rules
netsh interface portproxy show all

# Remove port forwarding
netsh interface portproxy delete v4tov4 listenport=3000 listenaddress=0.0.0.0
```

## Scripts

| Command                | Description                         |
| ---------------------- | ----------------------------------- |
| `npm run dev`          | Start dev server (localhost only)   |
| `npm run dev:lan`      | Start dev server (all interfaces)   |
| `npm run build`        | Build for production                |
| `npm run start`        | Start production server             |
| `npm run lint`         | Run ESLint                          |
| `npm run db:push`      | Push schema to database             |
| `npm run db:generate`  | Generate migration files            |
| `npm run db:migrate`   | Run migrations                      |
| `npm run db:seed-admin`| Seed admin user                     |

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
├── drizzle/                      # Database migrations
│   ├── 0000_watery_spiral.sql
│   └── meta/
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
    │   ├── history/page.tsx      # Reading history page
    │   ├── users/page.tsx        # User management (admin)
    │   ├── manga/[id]/page.tsx   # Manga detail + reader
    │   ├── scrape/
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
    │       ├── users/
    │       │   ├── route.ts                 # List users (admin)
    │       │   ├── history/route.ts         # All user history
    │       │   └── [id]/route.ts            # Update user (admin)
    │       └── scrape/
    │           ├── route.ts                 # Create scrape job
    │           └── [jobId]/route.ts         # Get job status
    ├── components/
    │   ├── ui/
    │   │   ├── Button.tsx        # Reusable button (6 variants, 3 sizes)
    │   │   ├── Badge.tsx         # Status badge
    │   │   ├── DropdownMenu.tsx  # Reusable dropdown menu
    │   │   └── Drawer.tsx        # Mobile slide-in drawer
    │   ├── AuthProvider.tsx       # Auth context provider
    │   ├── ChapterList.tsx        # Chapter list with status/history
    │   ├── ConfirmModal.tsx       # Confirmation dialog
    │   ├── Dashboard.tsx          # Manga collection list
    │   ├── GalleryViewer.tsx      # Fullscreen manga reader
    │   ├── Navbar.tsx             # Navigation with avatar dropdown
    │   ├── ProgressTracker.tsx    # Scrape progress display
    │   ├── ProtectedRoute.tsx     # Route guard with role support
    │   ├── ScrapeModal.tsx        # Scrape URL input modal
    │   ├── SearchFilter.tsx       # Search, filter, stats panel
    │   └── Toast.tsx              # Toast notifications
    └── lib/
        ├── auth.ts                # Auth functions (jose + bcryptjs)
        ├── auth-edge.ts           # Edge-safe token verification
        ├── db/
        │   ├── index.ts           # Drizzle DB connection
        │   ├── schema.ts          # Database schema (5 tables)
        │   └── seed-admin.ts      # Admin user seeder
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
