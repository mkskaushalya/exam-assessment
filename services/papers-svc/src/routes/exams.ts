import { Hono } from 'hono';
import {
  eq,
  and,
  inArray,
  examSessions,
  sessionAnswers,
  questions,
  questionOptions,
  purchases,
  papers,
} from '@assessment/db';
import {
  createSuccessResponse,
  createErrorResponse,
  generateId,
  calculateScore,
  ErrorCode,
} from '@assessment/utils';
import { z } from 'zod';

import type { Env, Variables } from '../types';
import { jwtAuth } from '../middleware/jwt';

export const examRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// All exam routes require authentication
examRoutes.use('*', jwtAuth);

const EXAM_DURATION_MINUTES = 60;

/**
 * POST /exam/sessions
 * Start a new exam session.
 */
const startSessionSchema = z.object({
  paperId: z.string().uuid(),
});

examRoutes.post('/sessions', async (c) => {
  const body = await c.req.json();
  const parsed = startSessionSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      createErrorResponse(ErrorCode.VALIDATION_ERROR, 'Validation failed', parsed.error.flatten()),
      400,
    );
  }

  const { paperId } = parsed.data;
  const userId = c.get('userId');
  const db = c.get('db');

  // Verify purchase
  const purchaseResult = await db
    .select({ id: purchases.id })
    .from(purchases)
    .where(and(eq(purchases.userId, userId), eq(purchases.paperId, paperId)))
    .limit(1);

  if (purchaseResult.length === 0) {
    return c.json(createErrorResponse(ErrorCode.PAPER_NOT_PURCHASED, 'Paper not purchased'), 403);
  }

  // Fetch paper details for duration
  const paperResult = await db
    .select({ durationMinutes: papers.durationMinutes })
    .from(papers)
    .where(eq(papers.id, paperId))
    .limit(1);
  
  const paper = paperResult[0];
  if (!paper) {
    return c.json(createErrorResponse(ErrorCode.NOT_FOUND, 'Paper not found'), 404);
  }

  // Check for existing in-progress session
  const existingSession = await db
    .select()
    .from(examSessions)
    .where(
      and(
        eq(examSessions.userId, userId),
        eq(examSessions.paperId, paperId),
        eq(examSessions.status, 'in_progress'),
      ),
    )
    .limit(1);

  if (existingSession.length > 0) {
    const session = existingSession[0]!;
    // Check if expired
    if (new Date() > session.expiresAt) {
      await db
        .update(examSessions)
        .set({ status: 'expired' })
        .where(eq(examSessions.id, session.id));
    } else {
      return c.json(createSuccessResponse({ session }));
    }
  }

  // Create new session
  const sessionId = generateId();
  const now = new Date();
  const durationMinutes = paper.durationMinutes || EXAM_DURATION_MINUTES;
  const expiresAt = new Date(now.getTime() + durationMinutes * 60 * 1000);

  await db.insert(examSessions).values({
    id: sessionId,
    userId,
    paperId,
    startedAt: now,
    expiresAt,
    status: 'in_progress',
  });

  // Store server-authoritative timer in KV
  await c.env.KV.put(
    `exam_timer:${sessionId}`,
    JSON.stringify({ startedAt: now.toISOString(), expiresAt: expiresAt.toISOString() }),
    { expirationTtl: durationMinutes * 60 + 300 }, // extra 5 min buffer
  );

  // Get questions for this paper
  const paperQuestions = await db
    .select()
    .from(questions)
    .where(eq(questions.paperId, paperId))
    .orderBy(questions.orderIndex);

  const questionsWithOptions = await Promise.all(
    paperQuestions.map(async (q) => {
      const options = await db
        .select({
          id: questionOptions.id,
          optionText: questionOptions.optionText,
          orderIndex: questionOptions.orderIndex,
        })
        .from(questionOptions)
        .where(eq(questionOptions.questionId, q.id))
        .orderBy(questionOptions.orderIndex);
      return {
        id: q.id,
        questionText: q.questionText,
        points: q.points,
        complexity: q.complexity,
        orderIndex: q.orderIndex,
        options,
      };
    }),
  );

  return c.json(
    createSuccessResponse({
      session: {
        id: sessionId,
        paperId,
        startedAt: now,
        expiresAt,
        status: 'in_progress',
      },
      questions: questionsWithOptions,
    }),
    201,
  );
});

/**
 * GET /exam/sessions/:id
 * Get an existing exam session and its questions.
 */
examRoutes.get('/sessions/:id', async (c) => {
  const sessionId = c.req.param('id');
  const userId = c.get('userId');
  const db = c.get('db');

  // Get session
  const sessionResult = await db
    .select()
    .from(examSessions)
    .where(and(eq(examSessions.id, sessionId), eq(examSessions.userId, userId)))
    .limit(1);

  const session = sessionResult[0];
  if (!session) {
    return c.json(createErrorResponse(ErrorCode.NOT_FOUND, 'Session not found'), 404);
  }

  // Get questions for this paper
  const paperQuestions = await db
    .select()
    .from(questions)
    .where(eq(questions.paperId, session.paperId))
    .orderBy(questions.orderIndex);

  const questionsWithOptions = await Promise.all(
    paperQuestions.map(async (q) => {
      const options = await db
        .select({
          id: questionOptions.id,
          optionText: questionOptions.optionText,
          orderIndex: questionOptions.orderIndex,
        })
        .from(questionOptions)
        .where(eq(questionOptions.questionId, q.id))
        .orderBy(questionOptions.orderIndex);
      return {
        id: q.id,
        questionText: q.questionText,
        points: q.points,
        complexity: q.complexity,
        orderIndex: q.orderIndex,
        options,
      };
    }),
  );

  return c.json(
    createSuccessResponse({
      session,
      questions: questionsWithOptions,
    }),
  );
});

/**
 * POST /exam/sessions/:id/answer
 * Autosave an answer for a question.
 */
const answerSchema = z.object({
  questionId: z.string().uuid(),
  selectedOptionId: z.string().uuid(),
});

examRoutes.post('/sessions/:id/answer', async (c) => {
  const sessionId = c.req.param('id');
  const body = await c.req.json();
  const parsed = answerSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      createErrorResponse(ErrorCode.VALIDATION_ERROR, 'Validation failed', parsed.error.flatten()),
      400,
    );
  }

  const { questionId, selectedOptionId } = parsed.data;
  const userId = c.get('userId');
  const db = c.get('db');

  // Verify session belongs to user and is in progress
  const sessionResult = await db
    .select()
    .from(examSessions)
    .where(and(eq(examSessions.id, sessionId), eq(examSessions.userId, userId)))
    .limit(1);

  const session = sessionResult[0];
  if (!session) {
    return c.json(createErrorResponse(ErrorCode.NOT_FOUND, 'Session not found'), 404);
  }

  if (session.status !== 'in_progress') {
    return c.json(
      createErrorResponse(ErrorCode.SESSION_ALREADY_SUBMITTED, 'Session already completed'),
      400,
    );
  }

  // Check server timer via KV
  const timerData = await c.env.KV.get(`exam_timer:${sessionId}`);
  if (timerData) {
    const timer = JSON.parse(timerData) as { expiresAt: string };
    if (new Date() > new Date(timer.expiresAt)) {
      await db.update(examSessions).set({ status: 'expired' }).where(eq(examSessions.id, sessionId));
      return c.json(createErrorResponse(ErrorCode.SESSION_EXPIRED, 'Session has expired'), 400);
    }
  }

  // Upsert answer (unique on session_id + question_id)
  const existingAnswer = await db
    .select({ id: sessionAnswers.id })
    .from(sessionAnswers)
    .where(
      and(eq(sessionAnswers.sessionId, sessionId), eq(sessionAnswers.questionId, questionId)),
    )
    .limit(1);

  if (existingAnswer.length > 0) {
    await db
      .update(sessionAnswers)
      .set({ selectedOptionId, answeredAt: new Date() })
      .where(eq(sessionAnswers.id, existingAnswer[0]!.id));
  } else {
    await db.insert(sessionAnswers).values({
      id: generateId(),
      sessionId,
      questionId,
      selectedOptionId,
      answeredAt: new Date(),
    });
  }

  return c.json(createSuccessResponse({ saved: true }));
});

/**
 * POST /exam/sessions/:id/submit
 * Finalize exam session and calculate score.
 */
examRoutes.post('/sessions/:id/submit', async (c) => {
  const sessionId = c.req.param('id');
  const userId = c.get('userId');
  const db = c.get('db');

  // Get session
  const sessionResult = await db
    .select()
    .from(examSessions)
    .where(and(eq(examSessions.id, sessionId), eq(examSessions.userId, userId)))
    .limit(1);

  const session = sessionResult[0];
  if (!session) {
    return c.json(createErrorResponse(ErrorCode.NOT_FOUND, 'Session not found'), 404);
  }

  if (session.status === 'submitted') {
    return c.json(
      createErrorResponse(ErrorCode.SESSION_ALREADY_SUBMITTED, 'Already submitted'),
      400,
    );
  }

  // Get all answers for this session
  const answers = await db
    .select()
    .from(sessionAnswers)
    .where(eq(sessionAnswers.sessionId, sessionId));

  // Get questions for scoring
  const paperQuestions = await db
    .select()
    .from(questions)
    .where(eq(questions.paperId, session.paperId));

  const allQuestionIds = paperQuestions.map((q) => q.id);
  // Get all options for these questions to check correctness
  const allOptions = await db
    .select()
    .from(questionOptions)
    .where(inArray(questionOptions.questionId, allQuestionIds));
  
  const correctOptionMap = new Map<string, string>();
  for (const opt of allOptions) {
    if (opt.isCorrect === 1) {
      correctOptionMap.set(opt.questionId, opt.id);
    }
  }

  // Score each answer server-side
  const scoredAnswers = answers.map((answer) => {
    const correctOptionId = correctOptionMap.get(answer.questionId);
    const isCorrect = answer.selectedOptionId === correctOptionId;
    return { ...answer, isCorrect };
  });

  // Update answer correctness in DB
  await Promise.all(
    scoredAnswers.map((answer) =>
      db
        .update(sessionAnswers)
        .set({ isCorrect: answer.isCorrect ? 1 : 0 })
        .where(eq(sessionAnswers.id, answer.id)),
    ),
  );

  // Calculate final score
  const scoreResult = calculateScore(
    scoredAnswers.map((a) => ({
      questionId: a.questionId,
      selectedOptionId: a.selectedOptionId,
      isCorrect: a.isCorrect,
    })),
    paperQuestions.map((q) => ({ id: q.id, points: q.points })),
  );

  // Update session
  const submittedAt = new Date();
  await db
    .update(examSessions)
    .set({
      status: 'submitted',
      submittedAt,
      scorePct: scoreResult.scorePct.toString(),
    })
    .where(eq(examSessions.id, sessionId));

  // Clean up KV timer
  await c.env.KV.delete(`exam_timer:${sessionId}`);

  return c.json(
    createSuccessResponse({
      sessionId,
      submittedAt,
      score: scoreResult,
    }),
  );
});

/**
 * GET /exam/sessions/:id/results
 * Get results for a submitted exam session.
 */
examRoutes.get('/sessions/:id/results', async (c) => {
  const sessionId = c.req.param('id');
  const userId = c.get('userId');
  const db = c.get('db');

  const sessionResult = await db
    .select()
    .from(examSessions)
    .where(and(eq(examSessions.id, sessionId), eq(examSessions.userId, userId)))
    .limit(1);

  const session = sessionResult[0];
  if (!session) {
    return c.json(createErrorResponse(ErrorCode.NOT_FOUND, 'Session not found'), 404);
  }

  if (session.status !== 'submitted') {
    return c.json(createErrorResponse(ErrorCode.SESSION_NOT_SUBMITTED, 'Exam not submitted yet'), 400);
  }

  // Calculate stats from answers
  const answers = await db
    .select()
    .from(sessionAnswers)
    .where(eq(sessionAnswers.sessionId, sessionId));

  const paperQuestions = await db
    .select({ id: questions.id, points: questions.points })
    .from(questions)
    .where(eq(questions.paperId, session.paperId));

  const totalQuestions = paperQuestions.length;
  const correctAnswers = answers.filter(a => a.isCorrect === 1).length;
  const totalPoints = paperQuestions.reduce((sum, q) => sum + q.points, 0);
  const earnedPoints = answers.reduce((sum, a) => {
    if (a.isCorrect === 1) {
      const q = paperQuestions.find(pq => pq.id === a.questionId);
      return sum + (q?.points || 0);
    }
    return sum;
  }, 0);

  return c.json(createSuccessResponse({
    sessionId: session.id,
    submittedAt: session.submittedAt,
    score: {
      totalQuestions,
      correctAnswers,
      scorePct: parseFloat(session.scorePct || '0'),
      totalPoints,
      earnedPoints,
    }
  }));
});


