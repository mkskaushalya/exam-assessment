'use client';

import { use, useState, useEffect, useCallback, useRef } from 'react';
import { Card, Radio, Button, Typography, Progress, App as AntApp, Tag } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import type { ApiResponse } from '@assessment/types';
import { api } from '@/lib/api';
import { formatDuration } from '@assessment/utils';
import styles from './exam.module.scss';

const { Title, Text } = Typography;

interface ExamQuestion {
  id: string;
  questionText: string;
  points: number;
  complexity: string;
  orderIndex: number;
  options: { id: string; optionText: string; orderIndex: number }[];
}

interface ExamSessionData {
  session: { id: string; paperId: string; startedAt: string; expiresAt: string; status: string };
  questions: ExamQuestion[];
}

export default function ExamPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const router = useRouter();
  const { message, modal } = AntApp.useApp();

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['exam-session', sessionId],
    queryFn: async () => {
      const res = await api.get<ApiResponse<ExamSessionData>>(`/exam/sessions/${sessionId}`);
      return res.data.data;
    },
    staleTime: Infinity,
  });

  // Timer countdown
  useEffect(() => {
    if (!data?.session) return;
    const expiresAt = new Date(data.session.expiresAt).getTime();

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        handleSubmit();
      }
    }, 1000);

    setTimeLeft(Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)));

    return () => clearInterval(interval);
  }, [data?.session]);

  // Autosave on answer change
  const autosave = useCallback(
    async (questionId: string, optionId: string) => {
      try {
        await api.post(`/exam/sessions/${sessionId}/answer`, {
          questionId,
          selectedOptionId: optionId,
        });
      } catch {
        // Silent fail for autosave
      }
    },
    [sessionId],
  );

  const handleAnswer = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));

    // Debounced autosave
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => autosave(questionId, optionId), 500);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await api.post(`/exam/sessions/${sessionId}/submit`);
      message.success('Exam submitted successfully!');
      router.push(`/results/${sessionId}`);
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? 'Failed to submit exam';
      message.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const confirmSubmit = () => {
    const unanswered = (data?.questions?.length ?? 0) - Object.keys(answers).length;
    modal.confirm({
      title: 'Submit Exam?',
      content: unanswered > 0
        ? `You have ${unanswered} unanswered question(s). Are you sure you want to submit?`
        : 'Are you sure you want to submit your exam?',
      onOk: handleSubmit,
      okText: 'Submit',
      cancelText: 'Continue Exam',
    });
  };

  if (isLoading || !data) {
    return <div className={styles.loading}>Loading exam...</div>;
  }

  const questions = data.questions ?? [];
  const question = questions[currentQuestion];
  const isWarning = timeLeft <= 300; // 5 min warning

  return (
    <div className={styles.container}>
      {/* Timer Bar */}
      <div className={`${styles.timerBar} ${isWarning ? styles.warning : ''}`}>
        <div className={styles.timerLeft}>
          <ClockCircleOutlined />
          <Text strong className={styles.timerText}>
            {formatDuration(timeLeft)}
          </Text>
        </div>
        <Progress
          percent={Math.round((Object.keys(answers).length / questions.length) * 100)}
          size="small"
          className={styles.progressBar}
          format={() => `${Object.keys(answers).length}/${questions.length}`}
        />
        <Button
          type="primary"
          danger
          onClick={confirmSubmit}
          loading={submitting}
          id="submit-exam-btn"
        >
          Submit Exam
        </Button>
      </div>

      <div className={styles.examLayout}>
        {/* Question Navigator */}
        <div className={styles.navigator}>
          <Title level={5}>Questions</Title>
          <div className={styles.questionGrid}>
            {questions.map((q, i) => (
              <button
                key={q.id}
                className={`${styles.questionDot} ${i === currentQuestion ? styles.active : ''} ${answers[q.id] ? styles.answered : ''}`}
                onClick={() => setCurrentQuestion(i)}
                id={`question-nav-${i}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Question Content */}
        {question && (
          <Card className={styles.questionCard}>
            <div className={styles.questionHeader}>
              <Text strong>Question {currentQuestion + 1} of {questions.length}</Text>
              <div>
                <Tag color={question.complexity === 'easy' ? 'green' : question.complexity === 'medium' ? 'orange' : 'red'}>
                  {question.complexity}
                </Tag>
                <Text type="secondary">{question.points} pts</Text>
              </div>
            </div>

            <Title level={4} className={styles.questionText}>
              {question.questionText}
            </Title>

            <Radio.Group
              value={answers[question.id]}
              onChange={(e) => handleAnswer(question.id, e.target.value as string)}
              className={styles.options}
            >
              {question.options.map((opt) => (
                <Radio key={opt.id} value={opt.id} className={styles.option} id={`option-${opt.id}`}>
                  {opt.optionText}
                </Radio>
              ))}
            </Radio.Group>

            <div className={styles.navigation}>
              <Button
                disabled={currentQuestion === 0}
                onClick={() => setCurrentQuestion((p) => p - 1)}
                id="prev-question-btn"
              >
                Previous
              </Button>
              {currentQuestion < questions.length - 1 ? (
                <Button
                  type="primary"
                  onClick={() => setCurrentQuestion((p) => p + 1)}
                  id="next-question-btn"
                >
                  Next
                </Button>
              ) : (
                <Button type="primary" danger onClick={confirmSubmit} id="finish-exam-btn">
                  Finish Exam
                </Button>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
