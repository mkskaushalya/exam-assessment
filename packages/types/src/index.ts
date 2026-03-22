// ─── User ────────────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

// ─── Paper ───────────────────────────────────────────────────────────────────

export type PaperType = 'past_paper' | 'model_paper' | 'ai_predicted';

export type QuestionComplexity = 'easy' | 'medium' | 'hard';

export interface Paper {
  id: string;
  title: string;
  description: string;
  subject: string;
  language: string;
  examBoard: string;
  type: PaperType;
  year: number;
  durationMinutes: number;
  priceLkr: number;
  createdAt: Date;
}

export interface Question {
  id: string;
  paperId: string;
  questionText: string;
  explanationText: string;
  points: number;
  complexity: QuestionComplexity;
  orderIndex: number;
  options?: QuestionOption[];
}

export interface QuestionOption {
  id: string;
  questionId: string;
  optionText: string;
  isCorrect: boolean;
  orderIndex: number;
}

// ─── Purchase ────────────────────────────────────────────────────────────────

export type PaymentMethod = 'card' | 'bank_transfer' | 'mobile_payment';

export interface PurchaseRecord {
  id: string;
  userId: string;
  paperId: string;
  amountPaidLkr: number;
  paymentMethod: PaymentMethod;
  paymentRef: string;
  purchasedAt: Date;
}

// ─── Exam Session ────────────────────────────────────────────────────────────

export type ExamSessionStatus = 'in_progress' | 'submitted' | 'expired';

export interface ExamSession {
  id: string;
  userId: string;
  paperId: string;
  startedAt: Date;
  expiresAt: Date;
  submittedAt: Date | null;
  scorePct: number | null;
  status: ExamSessionStatus;
}

export interface SessionAnswer {
  id: string;
  sessionId: string;
  questionId: string;
  selectedOptionId: string | null;
  isCorrect: boolean | null;
  answeredAt: Date;
}

// ─── API Response ────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
    totalPages?: number;
  };
}

// ─── Filters / Pagination ────────────────────────────────────────────────────

export interface PaperFilters {
  subject?: string;
  examBoard?: string;
  type?: PaperType;
  year?: number;
  language?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

// ─── Exam Results ────────────────────────────────────────────────────────────

export interface ExamResult {
  sessionId: string;
  paperId: string;
  paperTitle: string;
  scorePct: number;
  totalQuestions: number;
  correctAnswers: number;
  timeTaken: number;
  submittedAt: Date;
  breakdownByComplexity: {
    easy: { total: number; correct: number };
    medium: { total: number; correct: number };
    hard: { total: number; correct: number };
  };
}
