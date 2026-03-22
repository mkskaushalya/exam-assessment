import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { 
  users, 
  papers, 
  questions, 
  questionOptions, 
  purchases, 
  examSessions, 
  sessionAnswers 
} from './schema';
import { hashPassword, generateId } from '@assessment/utils';

async function seed() {
  console.log('🌱 Starting comprehensive database seed routines...');

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set in .env');
  }

  const sql = neon(databaseUrl);
  // Using a simpler drizzle init if types are being difficult, but let's try this first
  const db = drizzle(sql, { 
    schema: { 
      users, papers, questions, questionOptions, purchases, examSessions, sessionAnswers 
    } 
  });

  console.log('🧹 Clearing existing data (respecting FK order)...');
  try {
    await db.delete(sessionAnswers);
    await db.delete(examSessions);
    await db.delete(purchases);
    await db.delete(questionOptions);
    await db.delete(questions);
    await db.delete(papers);
    await db.delete(users);
    console.log('✅ Database cleared.');
  } catch (err) {
    console.warn('⚠️ Warning during cleanup (could be empty DB):', err);
  }

  const adminEmail = 'admin@assessment.dev';
  const adminPassword = 'password123';
  const hashedPassword = await hashPassword(adminPassword);

  console.log('Inserting admin record...');
  await db.insert(users).values({
    id: generateId(),
    name: 'System Administrator',
    email: adminEmail,
    passwordHash: hashedPassword,
    role: 'admin',
  } as any);

  const subjects = ['Physics', 'Chemistry', 'Biology', 'Mathematics', 'Computer Science'];
  const complexities: ('easy' | 'medium' | 'hard')[] = ['easy', 'medium', 'hard'];

  console.log('Generating 10 papers with 10 questions each...');

  for (let i = 1; i <= 10; i++) {
    const subject = subjects[i % subjects.length];
    const paperId = generateId();
    const questionCount = 10;
    const timePerQuestion = 2; // 2 minutes per question
    const totalDuration = questionCount * timePerQuestion;

    console.log(`  📄 Creating Paper ${i}: ${subject} Mock Paper...`);
    await db.insert(papers).values({
      id: paperId,
      title: `${subject} Advanced Mock Paper ${2023 + (i % 3)}`,
      description: `A comprehensive practice paper for ${subject} with ${questionCount} questions.`,
      subject,
      language: 'English',
      examBoard: 'General Education Board',
      type: i % 2 === 0 ? 'model_paper' : 'past_paper',
      year: 2023 - (i % 5),
      durationMinutes: totalDuration,
      priceLkr: (250 + (i * 50)).toFixed(2),
    } as any);

    for (let j = 1; j <= questionCount; j++) {
      const questionId = generateId();
      const complexity = complexities[j % 3];
      
      await db.insert(questions).values({
        id: questionId,
        paperId,
        questionText: `Question ${j}: What is the fundamental concept of ${subject} topic ${j}?`,
        explanationText: `This is a detailed explanation for question ${j} in the ${subject} paper.`,
        points: complexity === 'easy' ? 2 : complexity === 'medium' ? 3 : 5,
        complexity,
        orderIndex: j - 1,
      } as any);

      const options = [];
      const correctIndex = Math.floor(Math.random() * 4);
      for (let k = 0; k < 4; k++) {
        options.push({
          id: generateId(),
          questionId,
          optionText: `Option ${k + 1} for ${subject} Q${j}`,
          isCorrect: k === correctIndex ? 1 : 0,
          orderIndex: k,
        });
      }
      await db.insert(questionOptions).values(options as any);
    }
  }

  console.log(`🎉 Successfully seeded 10 papers, 100 questions, and 400 options!`);
  console.log(`-----------------------------------`);
  console.log(`Admin Email:    ${adminEmail}`);
  console.log(`Admin Password: ${adminPassword}`);
  console.log(`-----------------------------------`);
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
