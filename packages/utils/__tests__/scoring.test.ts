import { describe, it, expect } from 'vitest';

import { calculateScore, getComplexityBreakdown } from '../src/scoring';

describe('calculateScore', () => {
  it('should return 100% for all correct answers', () => {
    const answers = [
      { questionId: 'q1', selectedOptionId: 'o1', isCorrect: true },
      { questionId: 'q2', selectedOptionId: 'o2', isCorrect: true },
      { questionId: 'q3', selectedOptionId: 'o3', isCorrect: true },
    ];
    const questions = [
      { id: 'q1', points: 10 },
      { id: 'q2', points: 10 },
      { id: 'q3', points: 10 },
    ];

    const result = calculateScore(answers, questions);
    expect(result.scorePct).toBe(100);
    expect(result.correctAnswers).toBe(3);
    expect(result.totalQuestions).toBe(3);
    expect(result.earnedPoints).toBe(30);
    expect(result.totalPoints).toBe(30);
  });

  it('should return 0% for all incorrect answers', () => {
    const answers = [
      { questionId: 'q1', selectedOptionId: 'o1', isCorrect: false },
      { questionId: 'q2', selectedOptionId: 'o2', isCorrect: false },
    ];
    const questions = [
      { id: 'q1', points: 5 },
      { id: 'q2', points: 5 },
    ];

    const result = calculateScore(answers, questions);
    expect(result.scorePct).toBe(0);
    expect(result.correctAnswers).toBe(0);
    expect(result.earnedPoints).toBe(0);
  });

  it('should calculate partial score correctly', () => {
    const answers = [
      { questionId: 'q1', selectedOptionId: 'o1', isCorrect: true },
      { questionId: 'q2', selectedOptionId: 'o2', isCorrect: false },
      { questionId: 'q3', selectedOptionId: 'o3', isCorrect: true },
      { questionId: 'q4', selectedOptionId: 'o4', isCorrect: false },
    ];
    const questions = [
      { id: 'q1', points: 10 },
      { id: 'q2', points: 10 },
      { id: 'q3', points: 10 },
      { id: 'q4', points: 10 },
    ];

    const result = calculateScore(answers, questions);
    expect(result.scorePct).toBe(50);
    expect(result.correctAnswers).toBe(2);
    expect(result.earnedPoints).toBe(20);
    expect(result.totalPoints).toBe(40);
  });

  it('should handle weighted scoring (different point values)', () => {
    const answers = [
      { questionId: 'q1', selectedOptionId: 'o1', isCorrect: true },
      { questionId: 'q2', selectedOptionId: 'o2', isCorrect: false },
    ];
    const questions = [
      { id: 'q1', points: 30 },
      { id: 'q2', points: 10 },
    ];

    const result = calculateScore(answers, questions);
    expect(result.scorePct).toBe(75);
    expect(result.earnedPoints).toBe(30);
    expect(result.totalPoints).toBe(40);
  });

  it('should handle empty answers array', () => {
    const answers: { questionId: string; selectedOptionId: string | null; isCorrect: boolean }[] = [];
    const questions = [
      { id: 'q1', points: 10 },
      { id: 'q2', points: 10 },
    ];

    const result = calculateScore(answers, questions);
    expect(result.scorePct).toBe(0);
    expect(result.correctAnswers).toBe(0);
    expect(result.totalQuestions).toBe(2);
  });

  it('should handle empty questions array', () => {
    const answers: { questionId: string; selectedOptionId: string | null; isCorrect: boolean }[] = [];
    const questions: { id: string; points: number }[] = [];

    const result = calculateScore(answers, questions);
    expect(result.scorePct).toBe(0);
    expect(result.totalQuestions).toBe(0);
  });

  it('should handle single question exam', () => {
    const answers = [
      { questionId: 'q1', selectedOptionId: 'o1', isCorrect: true },
    ];
    const questions = [{ id: 'q1', points: 100 }];

    const result = calculateScore(answers, questions);
    expect(result.scorePct).toBe(100);
    expect(result.totalQuestions).toBe(1);
  });
});

describe('getComplexityBreakdown', () => {
  it('should break down performance by complexity', () => {
    const answers = [
      { questionId: 'q1', isCorrect: true },
      { questionId: 'q2', isCorrect: false },
      { questionId: 'q3', isCorrect: true },
      { questionId: 'q4', isCorrect: true },
      { questionId: 'q5', isCorrect: false },
    ];
    const questions = [
      { id: 'q1', complexity: 'easy' as const },
      { id: 'q2', complexity: 'easy' as const },
      { id: 'q3', complexity: 'medium' as const },
      { id: 'q4', complexity: 'hard' as const },
      { id: 'q5', complexity: 'hard' as const },
    ];

    const result = getComplexityBreakdown(answers, questions);
    expect(result.easy).toEqual({ total: 2, correct: 1 });
    expect(result.medium).toEqual({ total: 1, correct: 1 });
    expect(result.hard).toEqual({ total: 2, correct: 1 });
  });

  it('should handle all easy questions', () => {
    const answers = [
      { questionId: 'q1', isCorrect: true },
      { questionId: 'q2', isCorrect: true },
    ];
    const questions = [
      { id: 'q1', complexity: 'easy' as const },
      { id: 'q2', complexity: 'easy' as const },
    ];

    const result = getComplexityBreakdown(answers, questions);
    expect(result.easy).toEqual({ total: 2, correct: 2 });
    expect(result.medium).toEqual({ total: 0, correct: 0 });
    expect(result.hard).toEqual({ total: 0, correct: 0 });
  });

  it('should handle empty input', () => {
    const result = getComplexityBreakdown([], []);
    expect(result.easy).toEqual({ total: 0, correct: 0 });
    expect(result.medium).toEqual({ total: 0, correct: 0 });
    expect(result.hard).toEqual({ total: 0, correct: 0 });
  });
});
