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

- Adapter pattern for multiple manga sources (currently Komiku)
- URL validation with test fetch before job creation
- Image download with retry (3x), Referer header, content-type validation
- Configurable chapter range
- Real-time progress tracking
- Check for updates on existing manga

### Manga Reader

- 3 reading modes — LTR, RTL (manga), Vertical Scroll
- Zoom — mouse wheel, +/- keys, double-click toggle
- Drag to pan when zoomed in
- Auto-save reading position (debounced 1s)
- Continue reading from last page
- Chapter navigation with next/prev buttons and selector dropdown
- Chapter complete overlay with next chapter prompt
- Keyboard shortcuts — arrow keys, +/-, 0, ?, Esc

### Dashboard & Management

- Stats panel — manga, chapters, images, active jobs
- Search & filter by title, source, download status
- New Scrape button (admin only)
- Reading history badges on manga cards
- Delete manga with confirmation (admin only)
- Responsive layout for mobile and desktop

### User Management (Admin)

- Role-based access — admin and customer roles
- Approval flow — new users require admin approval
- User management page — approve, reject, change roles
- Mobile-friendly 3-dot dropdown actions

### Reading History

- Per-user tracking with separate history
- History page with all manga and reading progress
- Continue reading from last position

### Navigation

- Avatar dropdown — Profile, History, Logout
- Mobile hamburger drawer
- Desktop nav links — Dashboard, Manage Users (admin)

### Authentication & Security

- Custom JWT auth with register, login, logout
- Role-based route protection via middleware
- Edge-compatible token verification
- Auto-clear stale cookies on 401

### Reusable Components

- **Button** — 6 variants, 3 sizes (sm, md, lg)
- **Badge** — status indicators (pending, downloading, completed, error)
- **DropdownMenu** — icons, dividers, danger items
- **Drawer** — mobile slide-in panel with backdrop
- **Toast** — notification system
- **ConfirmModal** — confirmation dialog

## Prerequisites

- Node.js 18+
- Docker (for PostgreSQL)

## Setup

### 1. Start PostgreSQL

```bash
docker run -d --name manga-db \
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

### 1. Run dev server with network access

```bash
npm run dev:lan
```

### 2. Find your WSL IP

```bash
hostname -I
```

### 3. Set up port forwarding (Windows PowerShell as Admin)

```powershell
netsh interface portproxy add v4tov4 listenport=3000 listenaddress=0.0.0.0 connectport=3000 connectaddress=<WSL_IP>
```

### 4. Access from your phone

Open `http://<WINDOWS_IP>:3000` on your phone browser.

### Useful commands

```powershell
# Show port forwarding rules
netsh interface portproxy show all

# Remove port forwarding
netsh interface portproxy delete v4tov4 listenport=3000 listenaddress=0.0.0.0
```

## Scripts

| Command                 | Description                         |
| ----------------------- | ----------------------------------- |
| `npm run dev`           | Start dev server (localhost only)   |
| `npm run dev:lan`       | Start dev server (all interfaces)   |
| `npm run build`         | Build for production                |
| `npm run start`         | Start production server             |
| `npm run lint`          | Run ESLint                          |
| `npm run db:push`       | Push schema to database             |
| `npm run db:generate`   | Generate migration files            |
| `npm run db:migrate`    | Run migrations                      |
| `npm run db:seed-admin` | Seed admin user                     |

## Project Structure

```
scrmng/
├── drizzle.config.ts
├── next.config.ts
├── package.json
├── output/                         # Downloaded manga images (gitignored)
├── drizzle/                        # Database migrations
└── src/
    ├── middleware.ts               # Auth middleware (Edge runtime)
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx                # Dashboard
    │   ├── globals.css
    │   ├── login/page.tsx
    │   ├── register/page.tsx
    │   ├── history/page.tsx        # Reading history
    │   ├── users/page.tsx          # User management (admin)
    │   ├── manga/[id]/page.tsx     # Manga detail + reader
    │   ├── scrape/[jobId]/page.tsx # Job progress
    │   └── api/
    │       ├── auth/               # login, logout, me, register
    │       ├── images/[...path]/   # Serve manga images
    │       ├── manga/              # CRUD, chapters, history, check-updates
    │       ├── users/              # List, history, update (admin)
    │       └── scrape/             # Create job, get status
    ├── components/
    │   ├── ui/                     # Button, Badge, DropdownMenu, Drawer
    │   ├── AuthProvider.tsx
    │   ├── ChapterList.tsx
    │   ├── ConfirmModal.tsx
    │   ├── Dashboard.tsx
    │   ├── GalleryViewer.tsx       # Fullscreen manga reader
    │   ├── Navbar.tsx
    │   ├── ProgressTracker.tsx
    │   ├── ProtectedRoute.tsx
    │   ├── ScrapeModal.tsx
    │   ├── SearchFilter.tsx
    │   └── Toast.tsx
    └── lib/
        ├── auth.ts                 # Auth functions (jose + bcryptjs)
        ├── auth-edge.ts            # Edge-safe token verification
        ├── db/
        │   ├── index.ts
        │   ├── schema.ts           # Database schema
        │   └── seed-admin.ts
        ├── schemas/                # Zod validation schemas
        └── scrapers/
            ├── base-adapter.ts     # Abstract adapter
            ├── downloader.ts       # Image downloader with retry
            ├── index.ts            # Adapter registry
            └── adapters/
                └── komiku.adapter.ts
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for commit conventions, branch naming, and guidelines.

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
