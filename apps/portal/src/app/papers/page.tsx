'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, Tag, Select, Input, Pagination, Row, Col, Typography, Spin, Empty } from 'antd';
import { SearchOutlined, BookOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

import type { Paper, ApiResponse } from '@assessment/types';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import styles from './papers.module.scss';

const { Title, Text } = Typography;
const { Meta } = Card;

const PAPER_TYPE_COLORS: Record<string, string> = {
  past_paper: 'blue',
  model_paper: 'green',
  ai_predicted: 'purple',
};

const PAPER_TYPE_LABELS: Record<string, string> = {
  past_paper: 'Past Paper',
  model_paper: 'Model Paper',
  ai_predicted: 'AI Predicted',
};

function PapersContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const page = Number(searchParams.get('page')) || 1;
  const subject = searchParams.get('subject') ?? undefined;
  const type = searchParams.get('type') ?? undefined;
  const search = searchParams.get('search') ?? undefined;

  const [searchInput, setSearchInput] = useState(search ?? '');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const { data, isLoading: queryLoading } = useQuery({
    queryKey: ['papers', { page, subject, type, search }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('pageSize', '12');
      if (subject) params.set('subject', subject);
      if (type) params.set('type', type);
      if (search) params.set('search', search);

      const res = await api.get<ApiResponse<Paper[]>>(`/papers?${params.toString()}`);
      return res.data;
    },
  });

  const updateFilters = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    params.set('page', '1');
    router.push(`/papers?${params.toString()}`);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Title level={2}>Practice Papers</Title>
        <Text type="secondary">Browse and practice with exam papers</Text>
      </div>

      <div className={styles.filters}>
        <Input
          prefix={<SearchOutlined />}
          placeholder="Search papers..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onPressEnter={() => updateFilters({ search: searchInput || undefined })}
          className={styles.searchInput}
          size="large"
          id="papers-search"
          allowClear
        />
        <Select
          placeholder="Subject"
          value={subject}
          onChange={(val) => updateFilters({ subject: val })}
          allowClear
          style={{ width: 180 }}
          size="large"
          id="papers-subject-filter"
          options={[
            { value: 'mathematics', label: 'Mathematics' },
            { value: 'science', label: 'Science' },
            { value: 'english', label: 'English' },
            { value: 'ict', label: 'ICT' },
            { value: 'commerce', label: 'Commerce' },
          ]}
        />
        <Select
          placeholder="Paper Type"
          value={type}
          onChange={(val) => updateFilters({ type: val })}
          allowClear
          style={{ width: 180 }}
          size="large"
          id="papers-type-filter"
          options={[
            { value: 'past_paper', label: 'Past Paper' },
            { value: 'model_paper', label: 'Model Paper' },
            { value: 'ai_predicted', label: 'AI Predicted' },
          ]}
        />
      </div>

      {authLoading || !isAuthenticated ? (
        <div className={styles.loading}>
          <Spin size="large" />
        </div>
      ) : queryLoading ? (
        <div className={styles.loading}>
          <Spin size="large" />
        </div>
      ) : !data?.data?.length ? (
        <Empty description="No papers found" />
      ) : (
        <>
          <Row gutter={[24, 24]}>
            {data.data.map((paper) => (
              <Col xs={24} sm={12} md={8} lg={6} key={paper.id}>
                <Link href={`/papers/${paper.id}`}>
                  <Card
                    hoverable
                    className={styles.paperCard}
                    id={`paper-card-${paper.id}`}
                  >
                    <div className={styles.cardTag}>
                      <Tag color={PAPER_TYPE_COLORS[paper.type]}>
                        {PAPER_TYPE_LABELS[paper.type]}
                      </Tag>
                    </div>
                    <Meta
                      title={paper.title}
                      description={
                        <div className={styles.cardMeta}>
                          <span>
                            <BookOutlined /> {paper.subject}
                          </span>
                          <span>
                            <ClockCircleOutlined /> {paper.year}
                          </span>
                        </div>
                      }
                    />
                    <div className={styles.cardFooter}>
                      <Text strong className={styles.price}>
                        LKR {paper.priceLkr}
                      </Text>
                      <Text type="secondary" className={styles.board}>
                        {paper.examBoard}
                      </Text>
                    </div>
                  </Card>
                </Link>
              </Col>
            ))}
          </Row>

          <div className={styles.pagination} id="papers-pagination">
            <Pagination
              current={page}
              total={data.meta?.total ?? 0}
              pageSize={data.meta?.pageSize ?? 12}
              onChange={(p) => updateFilters({ page: p.toString() })}
              showSizeChanger={false}
              showTotal={(total) => `${total} papers`}
            />
          </div>
        </>
      )}
    </div>
  );
}

export default function PapersPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.loading}>
          <Spin size="large" />
        </div>
      }
    >
      <PapersContent />
    </Suspense>
  );
}
