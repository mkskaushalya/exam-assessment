// Schema barrel export
export { users, userRoleEnum } from './users';
export type { UserRecord, NewUserRecord } from './users';

export {
  papers,
  questions,
  questionOptions,
  paperTypeEnum,
  questionComplexityEnum,
  papersRelations,
  questionsRelations,
  questionOptionsRelations,
} from './papers';
export type {
  PaperRecord,
  NewPaperRecord,
  QuestionRecord,
  NewQuestionRecord,
  QuestionOptionRecord,
  NewQuestionOptionRecord,
} from './papers';

export { purchases, paymentMethodEnum, purchasesRelations } from './purchases';
export type { PurchaseDBRecord, NewPurchaseDBRecord } from './purchases';

export {
  examSessions,
  sessionAnswers,
  examSessionStatusEnum,
  examSessionsRelations,
  sessionAnswersRelations,
} from './exams';
export type {
  ExamSessionRecord,
  NewExamSessionRecord,
  SessionAnswerRecord,
  NewSessionAnswerRecord,
} from './exams';
