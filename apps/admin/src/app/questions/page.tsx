'use client';

import { Typography, Card, Button, Table, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;

interface QuestionRecord {
  id: string;
  content: string;
  type: string;
  marks: number;
}

const columns: ColumnsType<QuestionRecord> = [
  { title: 'Question', dataIndex: 'content', key: 'content' },
  { title: 'Type', dataIndex: 'type', key: 'type' },
  { title: 'Marks', dataIndex: 'marks', key: 'marks' },
  {
    title: 'Actions',
    key: 'actions',
    render: () => (
      <Space size="middle">
        <a>Edit</a>
        <a style={{ color: 'red' }}>Delete</a>
      </Space>
    ),
  },
];

export default function AdminQuestionsPage() {
  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Manage Questions</Title>
          <Text type="secondary">Build and organize the question bank.</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} size="large">
          Add Question
        </Button>
      </div>

      <Card>
        <Table columns={columns} dataSource={[]} />
      </Card>
    </div>
  );
}
