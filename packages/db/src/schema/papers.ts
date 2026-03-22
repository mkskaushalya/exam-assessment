import { pgTable, text, integer, numeric, timestamp, pgEnum, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

import { users } from './users';

export const paperTypeEnum = pgEnum('paper_type', ['past_paper', 'model_paper', 'ai_predicted']);

export const questionComplexityEnum = pgEnum('question_complexity', ['easy', 'medium', 'hard']);

// ─── Papers ──────────────────────────────────────────────────────────────────

export const papers = pgTable(
  'papers',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    title: text('title').notNull(),
    description: text('description').notNull(),
    subject: text('subject').notNull(),
    language: text('language').notNull(),
    examBoard: text('exam_board').notNull(),
    type: paperTypeEnum('type').notNull(),
    year: integer('year').notNull(),
    durationMinutes: integer('duration_minutes').notNull().default(60),
    priceLkr: numeric('price_lkr', { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('papers_subject_idx').on(table.subject),
    index('papers_exam_board_idx').on(table.examBoard),
    index('papers_type_idx').on(table.type),
  ],
);

export const papersRelations = relations(papers, ({ many }) => ({
  questions: many(questions),
}));

// ─── Questions ───────────────────────────────────────────────────────────────

export const questions = pgTable(
  'questions',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    paperId: text('paper_id')
      .notNull()
      .references(() => papers.id, { onDelete: 'cascade' }),
    questionText: text('question_text').notNull(),
    explanationText: text('explanation_text').notNull().default(''),
    points: integer('points').notNull().default(1),
    complexity: questionComplexityEnum('complexity').notNull().default('medium'),
    orderIndex: integer('order_index').notNull(),
  },
  (table) => [index('questions_paper_id_idx').on(table.paperId)],
);

export const questionsRelations = relations(questions, ({ one, many }) => ({
  paper: one(papers, { fields: [questions.paperId], references: [papers.id] }),
  options: many(questionOptions),
}));

// ─── Question Options ────────────────────────────────────────────────────────

export const questionOptions = pgTable(
  'question_options',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    questionId: text('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),
    optionText: text('option_text').notNull(),
    isCorrect: integer('is_correct').notNull().default(0), // 0 = false, 1 = true
    orderIndex: integer('order_index').notNull(),
  },
  (table) => [index('question_options_question_id_idx').on(table.questionId)],
);

export const questionOptionsRelations = relations(questionOptions, ({ one }) => ({
  question: one(questions, {
    fields: [questionOptions.questionId],
    references: [questions.id],
  }),
}));

export type PaperRecord = typeof papers.$inferSelect;
export type NewPaperRecord = typeof papers.$inferInsert;
export type QuestionRecord = typeof questions.$inferSelect;
export type NewQuestionRecord = typeof questions.$inferInsert;
export type QuestionOptionRecord = typeof questionOptions.$inferSelect;
export type NewQuestionOptionRecord = typeof questionOptions.$inferInsert;
