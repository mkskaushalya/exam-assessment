import {
  pgTable,
  text,
  numeric,
  timestamp,
  integer,
  unique,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

import { papers } from './papers';
import { questions, questionOptions } from './papers';
import { users } from './users';

export const examSessionStatusEnum = pgEnum('exam_session_status', [
  'in_progress',
  'submitted',
  'expired',
]);

// ─── Exam Sessions ───────────────────────────────────────────────────────────

export const examSessions = pgTable(
  'exam_sessions',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    paperId: text('paper_id')
      .notNull()
      .references(() => papers.id, { onDelete: 'cascade' }),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    submittedAt: timestamp('submitted_at', { withTimezone: true }),
    scorePct: numeric('score_pct', { precision: 5, scale: 2 }),
    status: examSessionStatusEnum('status').notNull().default('in_progress'),
  },
  (table) => [
    index('exam_sessions_user_id_idx').on(table.userId),
    index('exam_sessions_paper_id_idx').on(table.paperId),
  ],
);

export const examSessionsRelations = relations(examSessions, ({ one, many }) => ({
  user: one(users, { fields: [examSessions.userId], references: [users.id] }),
  paper: one(papers, { fields: [examSessions.paperId], references: [papers.id] }),
  answers: many(sessionAnswers),
}));

// ─── Session Answers ─────────────────────────────────────────────────────────

export const sessionAnswers = pgTable(
  'session_answers',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    sessionId: text('session_id')
      .notNull()
      .references(() => examSessions.id, { onDelete: 'cascade' }),
    questionId: text('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),
    selectedOptionId: text('selected_option_id').references(() => questionOptions.id),
    isCorrect: integer('is_correct'), // null until scored
    answeredAt: timestamp('answered_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('session_answers_session_question_unique').on(table.sessionId, table.questionId),
    index('session_answers_session_id_idx').on(table.sessionId),
  ],
);

export const sessionAnswersRelations = relations(sessionAnswers, ({ one }) => ({
  session: one(examSessions, {
    fields: [sessionAnswers.sessionId],
    references: [examSessions.id],
  }),
  question: one(questions, {
    fields: [sessionAnswers.questionId],
    references: [questions.id],
  }),
  selectedOption: one(questionOptions, {
    fields: [sessionAnswers.selectedOptionId],
    references: [questionOptions.id],
  }),
}));

export type ExamSessionRecord = typeof examSessions.$inferSelect;
export type NewExamSessionRecord = typeof examSessions.$inferInsert;
export type SessionAnswerRecord = typeof sessionAnswers.$inferSelect;
export type NewSessionAnswerRecord = typeof sessionAnswers.$inferInsert;
