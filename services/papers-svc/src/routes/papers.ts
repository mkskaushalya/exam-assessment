import { Hono } from 'hono';
import { eq, and, ilike, sql, count } from 'drizzle-orm';
import { papers, questions, questionOptions, purchases } from '@assessment/db';
import { createSuccessResponse, createErrorResponse, validatePagination, ErrorCode } from '@assessment/utils';
import { z } from 'zod';

import type { Env, Variables } from '../types';
import { jwtAuth, optionalAuth, adminAuth } from '../middleware/jwt';

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
/**
 * POST /papers
 * Create a new paper (Admin only).
 */
const createPaperSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  subject: z.string().min(1),
  language: z.string().min(1),
  examBoard: z.string().min(1),
  type: z.enum(['past_paper', 'model_paper', 'ai_predicted']),
  year: z.number().int(),
  priceLkr: z.string().regex(/^\d+(\.\d{1,2})?$/),
});

paperRoutes.post('/', jwtAuth, adminAuth, async (c) => {
  const body = await c.req.json();
  const parsed = createPaperSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      createErrorResponse(ErrorCode.VALIDATION_ERROR, 'Validation failed', parsed.error.flatten()),
      400,
    );
  }

  const db = c.get('db');
  const id = crypto.randomUUID();

  await db.insert(papers).values({
    id,
    ...parsed.data,
  });

  return c.json(createSuccessResponse({ id }), 201);
});

/**
 * PUT /papers/:id
 * Update an existing paper (Admin only).
 */
paperRoutes.put('/:id', jwtAuth, adminAuth, async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const parsed = createPaperSchema.partial().safeParse(body);

  if (!parsed.success) {
    return c.json(
      createErrorResponse(ErrorCode.VALIDATION_ERROR, 'Validation failed', parsed.error.flatten()),
      400,
    );
  }

  const db = c.get('db');
  await db.update(papers).set(parsed.data).where(eq(papers.id, id));

  return c.json(createSuccessResponse({ message: 'Paper updated' }));
});

/**
 * DELETE /papers/:id
 * Delete a paper (Admin only).
 */
paperRoutes.delete('/:id', jwtAuth, adminAuth, async (c) => {
  const id = c.req.param('id');
  const db = c.get('db');

  await db.delete(papers).where(eq(papers.id, id));
  return c.json(createSuccessResponse({ message: 'Paper deleted' }));
});

/**
 * GET /papers/:id/questions/admin
 * Get all questions with options for a paper (Admin only).
 */
paperRoutes.get('/:id/questions/admin', jwtAuth, adminAuth, async (c) => {
  const paperId = c.req.param('id');
  const db = c.get('db');

  const questionsResult = await db
    .select()
    .from(questions)
    .where(eq(questions.paperId, paperId))
    .orderBy(questions.orderIndex);

  const fullQuestions = await Promise.all(
    questionsResult.map(async (q) => {
      const options = await db
        .select()
        .from(questionOptions)
        .where(eq(questionOptions.questionId, q.id))
        .orderBy(questionOptions.orderIndex);
      return { ...q, options };
    }),
  );

  return c.json(createSuccessResponse(fullQuestions));
});

/**
 * POST /papers/:id/questions
 * Add a new question to a paper (Admin only).
 */
const createQuestionSchema = z.object({
  questionText: z.string().min(1),
  explanationText: z.string().default(''),
  points: z.number().int().default(1),
  complexity: z.enum(['easy', 'medium', 'hard']).default('medium'),
  orderIndex: z.number().int(),
  options: z.array(z.object({
    optionText: z.string().min(1),
    isCorrect: z.number().min(0).max(1),
    orderIndex: z.number().int(),
  })),
});

paperRoutes.post('/:id/questions', jwtAuth, adminAuth, async (c) => {
  const paperId = c.req.param('id');
  const body = await c.req.json();
  const parsed = createQuestionSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      createErrorResponse(ErrorCode.VALIDATION_ERROR, 'Validation failed', parsed.error.flatten()),
      400,
    );
  }

  const db = c.get('db');
  const questionId = crypto.randomUUID();

  // Insert question and options in a transaction if possible, but neon-http doesn't support them easily with drizzle-orm yet in some versions.
  // We'll do it sequentially for now.
  await db.insert(questions).values({
    id: questionId,
    paperId,
    questionText: parsed.data.questionText,
    explanationText: parsed.data.explanationText,
    points: parsed.data.points,
    complexity: parsed.data.complexity,
    orderIndex: parsed.data.orderIndex,
  });

  if (parsed.data.options.length > 0) {
    await db.insert(questionOptions).values(
      parsed.data.options.map((opt) => ({
        id: crypto.randomUUID(),
        questionId,
        ...opt,
      }))
    );
  }

  return c.json(createSuccessResponse({ id: questionId }), 201);
});

/**
 * PUT /papers/questions/:questionId
 * Update an existing question (Admin only).
 */
paperRoutes.put('/questions/:questionId', jwtAuth, adminAuth, async (c) => {
  const questionId = c.req.param('questionId');
  const body = await c.req.json();
  const parsed = createQuestionSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      createErrorResponse(ErrorCode.VALIDATION_ERROR, 'Validation failed', parsed.error.flatten()),
      400,
    );
  }

  const db = c.get('db');

  // Update question
  await db.update(questions).set({
    questionText: parsed.data.questionText,
    explanationText: parsed.data.explanationText,
    points: parsed.data.points,
    complexity: parsed.data.complexity,
    orderIndex: parsed.data.orderIndex,
  }).where(eq(questions.id, questionId));

  // Update options: delete all and re-insert (simplest for CRUD)
  await db.delete(questionOptions).where(eq(questionOptions.questionId, questionId));
  
  if (parsed.data.options.length > 0) {
    await db.insert(questionOptions).values(
      parsed.data.options.map((opt) => ({
        id: crypto.randomUUID(),
        questionId,
        optionText: opt.optionText,
        isCorrect: opt.isCorrect,
        orderIndex: opt.orderIndex,
      }))
    );
  }

  return c.json(createSuccessResponse({ message: 'Question updated' }));
});

/**
 * DELETE /questions/:id
 * Delete a question (Admin only).
 */
paperRoutes.delete('/questions/:questionId', jwtAuth, adminAuth, async (c) => {
  const questionId = c.req.param('questionId');
  const db = c.get('db');

  await db.delete(questions).where(eq(questions.id, questionId));
  return c.json(createSuccessResponse({ message: 'Question deleted' }));
});
/**
 * POST /papers/:id/purchase
 * Purchase a paper (Simulated).
 */
paperRoutes.post('/:id/purchase', jwtAuth, async (c) => {
  const paperId = c.req.param('id');
  const userId = c.get('userId');
  const db = c.get('db');

  if (!userId) {
    return c.json(createErrorResponse(ErrorCode.UNAUTHORIZED, 'Authentication required'), 401);
  }

  // Check if paper exists
  const paperResult = await db.select().from(papers).where(eq(papers.id, paperId)).limit(1);
  const paper = paperResult[0];

  if (!paper) {
    return c.json(createErrorResponse(ErrorCode.NOT_FOUND, 'Paper not found'), 404);
  }

  // Check if already purchased
  const existingPurchase = await db
    .select()
    .from(purchases)
    .where(and(eq(purchases.userId, userId), eq(purchases.paperId, paperId)))
    .limit(1);

  if (existingPurchase.length > 0) {
    return c.json(createSuccessResponse({ message: 'Paper already purchased' }));
  }

  // Record simulated purchase
  await db.insert(purchases).values({
    id: crypto.randomUUID(),
    userId,
    paperId,
    amountPaidLkr: paper.priceLkr,
    paymentMethod: 'card',
    paymentRef: `simulated_${Date.now()}_${Math.random().toString(36).substring(7)}`,
  });

  return c.json(createSuccessResponse({ message: 'Purchase successful' }), 201);
});
