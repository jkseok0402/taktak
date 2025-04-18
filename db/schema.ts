import { pgTable, uuid, timestamp, integer, text } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users 테이블
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  level: integer('level').notNull().default(1),
  name: text('name').notNull()
});

// Matches 테이블
export const matches = pgTable('matches', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  matchDate: timestamp('match_date', { withTimezone: true }).defaultNow().notNull(),
  winnerId: uuid('winner_id').notNull().references(() => users.id),
  loserId: uuid('loser_id').notNull().references(() => users.id),
  winnerSets: integer('winner_sets').notNull(),
  loserSets: integer('loser_sets').notNull()
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  wonMatches: many(matches, { relationName: 'winner' }),
  lostMatches: many(matches, { relationName: 'loser' })
}));

export const matchesRelations = relations(matches, ({ one }) => ({
  winner: one(users, {
    fields: [matches.winnerId],
    references: [users.id],
    relationName: 'winner'
  }),
  loser: one(users, {
    fields: [matches.loserId],
    references: [users.id],
    relationName: 'loser'
  })
}));

// 테이블 타입 정의
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Match = typeof matches.$inferSelect;
export type NewMatch = typeof matches.$inferInsert;

// 명시적으로 NewPlayerStats 타입 정의
export interface NewPlayerStats {
  playerId: string;
  wins?: number;
  losses?: number;
  winRate?: number;
  setsWon?: number;
  setsLost?: number;
  currentStreak?: number;
  recentMatches?: string;
}

// 업데이트용 타입 정의
export interface UpdatePlayerStats {
  wins?: number;
  losses?: number;
  winRate?: number;
  setsWon?: number;
  setsLost?: number;
  currentStreak?: number;
  recentMatches?: string;
} 