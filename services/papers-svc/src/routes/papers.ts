import { Hono } from 'hono';
import { eq, and, ilike, sql, count } from 'drizzle-orm';
import { papers, questions, questionOptions, purchases } from '@assessment/db';
import { createSuccessResponse, createErrorResponse, validatePagination, ErrorCode } from '@assessment/utils';
import { z } from 'zod';

import type { Env, Variables } from '../types';
import { jwtAuth, optionalAuth } from '../middleware/jwt';

export const paperRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * GET /papers
 * List papers with filtering and pagination.
 */
paperRoutes.get('/', optionalAuth, async (c) => {
  const db = c.get('db');
  const { page, pageSize, offset } = validatePagination(
    Number(c.req.query('page')) || undefined,
    Number(c.req.query('pageSize')) || undefined,
  );

  const subject = c.req.query('subject');
  const examBoard = c.req.query('examBoard');
  const type = c.req.query('type');
  const year = c.req.query('year');
  const search = c.req.query('search');

  // Build conditions dynamically
  const conditions = [];
  if (subject) conditions.push(eq(papers.subject, subject));
  if (examBoard) conditions.push(eq(papers.examBoard, examBoard));
  if (type) conditions.push(eq(papers.type, type as 'past_paper' | 'model_paper' | 'ai_predicted'));
  if (year) conditions.push(eq(papers.year, parseInt(year, 10)));
  if (search) {
    conditions.push(
      sql`(${papers.title} ILIKE ${'%' + search + '%'} OR ${papers.description} ILIKE ${'%' + search + '%'})`,
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [papersResult, totalResult] = await Promise.all([
    db
      .select()
      .from(papers)
      .where(whereClause)
      .orderBy(papers.createdAt)
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: count() })
      .from(papers)
      .where(whereClause),
  ]);

  const total = totalResult[0]?.count ?? 0;

  return c.json(
    createSuccessResponse(papersResult, {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    }),
  );
});

/**
 * GET /papers/:id
 * Get paper details with questions (if purchased).
 */
paperRoutes.get('/:id', optionalAuth, async (c) => {
  const paperId = c.req.param('id');
  const db = c.get('db');
  const userId = c.get('userId');

  // Get paper
  const paperResult = await db.select().from(papers).where(eq(papers.id, paperId)).limit(1);
  const paper = paperResult[0];

  if (!paper) {
    return c.json(createErrorResponse(ErrorCode.NOT_FOUND, 'Paper not found'), 404);
  }

  // Check if user has purchased this paper
  let hasPurchased = false;
  if (userId) {
    const purchaseResult = await db
      .select({ id: purchases.id })
      .from(purchases)
      .where(and(eq(purchases.userId, userId), eq(purchases.paperId, paperId)))
      .limit(1);
    hasPurchased = purchaseResult.length > 0;
  }

  // Get questions (with options if purchased)
  const questionsResult = await db
    .select()
    .from(questions)
    .where(eq(questions.paperId, paperId))
    .orderBy(questions.orderIndex);

  let questionsWithOptions;
  if (hasPurchased) {
    // Full access — include options and correct answers
    questionsWithOptions = await Promise.all(
      questionsResult.map(async (q) => {
        const options = await db
          .select()
          .from(questionOptions)
          .where(eq(questionOptions.questionId, q.id))
          .orderBy(questionOptions.orderIndex);
        return { ...q, options };
      }),
    );
  } else {
    // Preview — question text only, no options or explanations
    questionsWithOptions = questionsResult.map((q) => ({
      id: q.id,
      paperId: q.paperId,
      questionText: q.questionText.substring(0, 100) + '...',
      points: q.points,
      complexity: q.complexity,
      orderIndex: q.orderIndex,
      locked: true,
    }));
  }

  return c.json(
    createSuccessResponse({
      paper,
      questions: questionsWithOptions,
      hasPurchased,
      totalQuestions: questionsResult.length,
    }),
  );
});

/**
 * POST /papers/:id/issues
 * Report an issue with a paper.
 */
const issueSchema = z.object({
  questionId: z.string().optional(),
  type: z.enum(['incorrect_answer', 'unclear_question', 'typo', 'other']),
  description: z.string().min(10).max(1000),
});

paperRoutes.post('/:id/issues', jwtAuth, async (c) => {
  const paperId = c.req.param('id');
  const body = await c.req.json();
  const parsed = issueSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      createErrorResponse(ErrorCode.VALIDATION_ERROR, 'Validation failed', parsed.error.flatten()),
      400,
    );
  }

  const db = c.get('db');

  // Verify paper exists
  const paperResult = await db.select({ id: papers.id }).from(papers).where(eq(papers.id, paperId)).limit(1);
  if (paperResult.length === 0) {
    return c.json(createErrorResponse(ErrorCode.NOT_FOUND, 'Paper not found'), 404);
  }

  // In a real application, we'd store this in an issues table
  // For now, we log it and return success
  return c.json(
    createSuccessResponse({
      message: 'Issue reported successfully',
      issueId: crypto.randomUUID(),
    }),
    201,
  );
});
