'use client';

import { use } from 'react';
import { Card, Typography, Statistic, Row, Col, Spin, Button } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import Link from 'next/link';

import type { ApiResponse } from '@assessment/types';
import { api } from '@/lib/api';
import styles from './results.module.scss';

const { Title, Text } = Typography;

interface ResultData {
  sessionId: string;
  submittedAt: string;
  score: {
    totalQuestions: number;
    correctAnswers: number;
    scorePct: number;
    totalPoints: number;
    earnedPoints: number;
  };
}

const COLORS = ['#10B981', '#EF4444'];
// Complexity colors reserved for future per-question breakdown
// const COMPLEXITY_COLORS = { easy: '#10B981', medium: '#F59E0B', hard: '#EF4444' };

export default function ResultsPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);

  const { data, isLoading } = useQuery({
    queryKey: ['results', sessionId],
    queryFn: async () => {
      const res = await api.get<ApiResponse<ResultData>>(`/exam/sessions/${sessionId}/results`);
      return res.data.data!;
    },
  });

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <Spin size="large" />
      </div>
    );
  }

  if (!data) return null;

  const { score } = data;
  const passed = score.scorePct >= 65;

  const pieData = [
    { name: 'Correct', value: score.correctAnswers },
    { name: 'Incorrect', value: score.totalQuestions - score.correctAnswers },
  ];

  const barData = [
    { name: 'Easy', correct: 0, total: 0 },
    { name: 'Medium', correct: 0, total: 0 },
    { name: 'Hard', correct: 0, total: 0 },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <TrophyOutlined className={`${styles.trophy} ${passed ? styles.passed : styles.failed}`} />
        <Title level={2}>{passed ? 'Congratulations!' : 'Keep Practicing!'}</Title>
        <Text type="secondary">
          {passed ? 'You passed the exam!' : 'You need 65% to pass. Try again!'}
        </Text>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} md={6}>
          <Card className={styles.statCard}>
            <Statistic
              title="Score"
              value={score.scorePct}
              suffix="%"
              valueStyle={{ color: passed ? '#10B981' : '#EF4444' }}
              prefix={passed ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className={styles.statCard}>
            <Statistic
              title="Correct Answers"
              value={score.correctAnswers}
              suffix={`/ ${score.totalQuestions}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className={styles.statCard}>
            <Statistic
              title="Points Earned"
              value={score.earnedPoints}
              suffix={`/ ${score.totalPoints}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className={styles.statCard}>
            <Statistic
              title="Status"
              value={passed ? 'PASSED' : 'FAILED'}
              valueStyle={{ color: passed ? '#10B981' : '#EF4444' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} className={styles.charts}>
        <Col xs={24} md={12}>
          <Card title="Score Distribution" className={styles.chartCard}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Performance by Complexity" className={styles.chartCard}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="correct" name="Correct" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="total" name="Total" fill="#E5E7EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <div className={styles.actions}>
        <Link href="/papers">
          <Button size="large" type="primary" id="browse-papers-btn">
            Browse More Papers
          </Button>
        </Link>
      </div>
    </div>
  );
}
