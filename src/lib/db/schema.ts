import {
  pgTable,
  serial,
  varchar,
  decimal,
  text,
  integer,
  boolean,
  timestamp,
  unique,
  index,
} from 'drizzle-orm/pg-core';

// ============================================
// Users
// ============================================
export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    email: varchar('email', { length: 255 }).unique().notNull(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    role: varchar('role', { length: 50 }).default('customer'),
    isActive: boolean('is_active').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    emailIdx: index('idx_users_email').on(table.email),
  })
);

// ============================================
// Manga
// ============================================
export const manga = pgTable(
  'manga',
  {
    id: serial('id').primaryKey(),
    source: varchar('source', { length: 100 }).notNull(),
    sourceUrl: varchar('source_url', { length: 1000 }).notNull(),
    title: varchar('title', { length: 500 }).notNull(),
    slug: varchar('slug', { length: 500 }).notNull(),
    thumbnail: varchar('thumbnail', { length: 1000 }),
    author: varchar('author', { length: 500 }),
    status: varchar('status', { length: 100 }),
    genres: text('genres').array(),
    synopsis: text('synopsis'),
    totalChapters: integer('total_chapters').default(0),
    totalImages: integer('total_images').default(0),
    statusDl: varchar('status_dl', { length: 50 }).default('pending'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    sourceIdx: index('idx_manga_source').on(table.source),
    statusIdx: index('idx_manga_status').on(table.statusDl),
    sourceSlugUnique: unique('manga_source_slug_unique').on(table.source, table.slug),
  })
);

// ============================================
// Chapters
// ============================================
export const chapters = pgTable(
  'chapters',
  {
    id: serial('id').primaryKey(),
    mangaId: integer('manga_id').references(() => manga.id, { onDelete: 'cascade' }),
    chapterNumber: decimal('chapter_number', { precision: 10, scale: 2 }).notNull(),
    title: varchar('title', { length: 500 }),
    sourceUrl: varchar('source_url', { length: 1000 }).notNull(),
    totalImages: integer('total_images').default(0),
    downloadedImages: integer('downloaded_images').default(0),
    status: varchar('status', { length: 50 }).default('pending'),
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    mangaIdx: index('idx_chapters_manga').on(table.mangaId),
    statusIdx: index('idx_chapters_status').on(table.status),
    mangaChapterUnique: unique('chapters_manga_chapter_unique').on(table.mangaId, table.chapterNumber),
  })
);

// ============================================
// Scrape Jobs
// ============================================
export const scrapeJobs = pgTable(
  'scrape_jobs',
  {
    id: serial('id').primaryKey(),
    source: varchar('source', { length: 100 }).notNull(),
    sourceUrl: varchar('source_url', { length: 1000 }).notNull(),
    mangaId: integer('manga_id').references(() => manga.id, { onDelete: 'set null' }),
    startChapter: decimal('start_chapter', { precision: 10, scale: 2 }),
    endChapter: decimal('end_chapter', { precision: 10, scale: 2 }),
    status: varchar('status', { length: 50 }).default('queued'),
    progress: integer('progress').default(0),
    total: integer('total').default(0),
    currentChapter: varchar('current_chapter', { length: 200 }),
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    statusIdx: index('idx_jobs_status').on(table.status),
  })
);

// ============================================
// Reading History
// ============================================
export const readingHistory = pgTable(
  'reading_history',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
    mangaId: integer('manga_id').references(() => manga.id, { onDelete: 'cascade' }),
    chapterNumber: decimal('chapter_number', { precision: 10, scale: 2 }).notNull(),
    lastImage: integer('last_image').default(1),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    userMangaUnique: unique('history_user_manga_unique').on(table.userId, table.mangaId),
    userIdx: index('idx_history_user').on(table.userId),
    mangaIdx: index('idx_history_manga').on(table.mangaId),
  })
);
