import { pgTable, serial, text, timestamp, integer, uuid } from 'drizzle-orm/pg-core';

// Players 테이블
export const players = pgTable('players', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  level: integer('level').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

// Matches 테이블
export const matches = pgTable('matches', {
  id: serial('id').primaryKey(),
  matchDate: timestamp('match_date').notNull(),
  winnerId: uuid('winner_id').notNull().references(() => players.id),
  loserId: uuid('loser_id').notNull().references(() => players.id),
  winnerSets: integer('winner_sets').notNull(),
  loserSets: integer('loser_sets').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

// 테이블 타입 정의
export type Player = typeof players.$inferSelect;
export type Match = typeof matches.$inferSelect;

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