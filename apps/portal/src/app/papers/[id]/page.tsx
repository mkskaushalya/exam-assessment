'use client';

import { use, useState } from 'react';
import { Card, Tag, Typography, Button, List, Divider, Spin, App as AntApp } from 'antd';
import { LockOutlined, BookOutlined, ClockCircleOutlined, FileTextOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import type { ApiResponse, Paper, Question } from '@assessment/types';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import styles from './detail.module.scss';

const { Title, Text, Paragraph } = Typography;

interface PaperDetailData {
  paper: Paper;
  questions: (Question & { locked?: boolean })[];
  hasPurchased: boolean;
  totalQuestions: number;
}

export default function PaperDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { message } = AntApp.useApp();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [purchasing, setPurchasing] = useState(false);

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    setPurchasing(true);
    try {
      await api.post(`/papers/${id}/purchase`);
      message.success('Paper purchased successfully!');
      refetch();
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? 'Failed to purchase paper';
      message.error(errorMsg);
    } finally {
      setPurchasing(false);
    }
  };

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['paper', id],
    queryFn: async () => {
      const res = await api.get<ApiResponse<PaperDetailData>>(`/papers/${id}`);
      return res.data.data!;
    },
  });

  const handleStartExam = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    try {
      const res = await api.post('/exam/sessions', { paperId: id });
      const sessionId = res.data.data.session.id;
      router.push(`/exam/${sessionId}`);
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? 'Failed to start exam';
      message.error(errorMsg);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <Spin size="large" />
      </div>
    );
  }

  if (!data) return null;

  const { paper, questions, hasPurchased, totalQuestions } = data;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <Tag color="blue">{paper.type.replace('_', ' ')}</Tag>
          <Title level={2}>{paper.title}</Title>
          <Paragraph type="secondary">{paper.description}</Paragraph>
          <div className={styles.metadata}>
            <span><BookOutlined /> {paper.subject}</span>
            <span><ClockCircleOutlined /> {paper.year}</span>
            <span><FileTextOutlined /> {totalQuestions} Questions</span>
          </div>
        </div>
        <Card className={styles.actionCard}>
          <Text className={styles.price}>LKR {paper.priceLkr}</Text>
          {hasPurchased ? (
            <Button
              type="primary"
              size="large"
              block
              onClick={handleStartExam}
              id="start-exam-btn"
            >
              Start Exam
            </Button>
          ) : (
            <Button 
              type="primary" 
              size="large" 
              block 
              id="purchase-paper-btn"
              onClick={handlePurchase}
              loading={purchasing}
            >
              Purchase Paper
            </Button>
          )}
        </Card>
      </div>

      <Divider />

      <Title level={4}>Questions</Title>
      <List
        dataSource={questions}
        renderItem={(question, index) => (
          <List.Item className={styles.questionItem} id={`question-item-${index}`}>
            <div className={styles.questionContent}>
              <div className={styles.questionHeader}>
                <Text strong>Q{index + 1}.</Text>
                <Tag>{question.complexity}</Tag>
                <Text type="secondary">{question.points} pts</Text>
              </div>
              {question.locked ? (
                <div className={styles.lockOverlay}>
                  <LockOutlined className={styles.lockIcon} />
                  <Text type="secondary">Purchase this paper to view this question</Text>
                </div>
              ) : (
                <Paragraph>{question.questionText}</Paragraph>
              )}
            </div>
          </List.Item>
        )}
      />
    </div>
  );
}
