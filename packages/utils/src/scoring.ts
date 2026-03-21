import type { QuestionComplexity, SessionAnswer, Question } from '@assessment/types';

export interface ScoreResult {
  totalQuestions: number;
  correctAnswers: number;
  scorePct: number;
  totalPoints: number;
  earnedPoints: number;
}

/**
 * Calculate exam score from session answers and questions.
 * Server-authoritative — never trust client scoring.
 */
export function calculateScore(
  answers: Pick<SessionAnswer, 'questionId' | 'selectedOptionId' | 'isCorrect'>[],
  questions: Pick<Question, 'id' | 'points'>[],
): ScoreResult {
  const questionMap = new Map(questions.map((q) => [q.id, q]));
  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  let earnedPoints = 0;
  let correctAnswers = 0;

  for (const answer of answers) {
    if (answer.isCorrect) {
      correctAnswers++;
      const question = questionMap.get(answer.questionId);
      if (question) {
        earnedPoints += question.points;
      }
    }
  }

  const scorePct = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 10000) / 100 : 0;

  return {
    totalQuestions: questions.length,
    correctAnswers,
    scorePct,
    totalPoints,
    earnedPoints,
  };
}

/**
 * Get performance breakdown by question complexity.
 */
export function getComplexityBreakdown(
  answers: Pick<SessionAnswer, 'questionId' | 'isCorrect'>[],
  questions: Pick<Question, 'id' | 'complexity'>[],
): Record<QuestionComplexity, { total: number; correct: number }> {
  const breakdown: Record<QuestionComplexity, { total: number; correct: number }> = {
    easy: { total: 0, correct: 0 },
    medium: { total: 0, correct: 0 },
    hard: { total: 0, correct: 0 },
  };

  const questionMap = new Map(questions.map((q) => [q.id, q]));

  for (const answer of answers) {
    const question = questionMap.get(answer.questionId);
    if (question) {
      breakdown[question.complexity].total++;
      if (answer.isCorrect) {
        breakdown[question.complexity].correct++;
      }
    }
  }

  return breakdown;
}
