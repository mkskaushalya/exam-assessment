'use client';

import { Typography, Card, Button, Table, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;

interface PaperRecord {
  id: string;
  title: string;
  subject: string;
  status: 'draft' | 'published';
}

const columns: ColumnsType<PaperRecord> = [
  { title: 'Title', dataIndex: 'title', key: 'title' },
  { title: 'Subject', dataIndex: 'subject', key: 'subject' },
  { title: 'Status', dataIndex: 'status', key: 'status' },
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

export default function AdminPapersPage() {
  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Manage Papers</Title>
          <Text type="secondary">Create, edit, and publish examination papers.</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} size="large">
          Create Paper
        </Button>
      </div>

      <Card>
        <Table columns={columns} dataSource={[]} />
      </Card>
    </div>
  );
}
