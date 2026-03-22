'use client';

import { Typography, Card, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
}

const columns: ColumnsType<UserRecord> = [
  { title: 'Name', dataIndex: 'name', key: 'name' },
  { title: 'Email', dataIndex: 'email', key: 'email' },
  { 
    title: 'Role', 
    dataIndex: 'role', 
    key: 'role',
    render: (role: string) => (
      <Tag color={role === 'admin' ? 'purple' : 'blue'}>
        {role.toUpperCase()}
      </Tag>
    )
  },
];

export default function AdminUsersPage() {
  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Title level={2} style={{ margin: 0 }}>System Users</Title>
        <Text type="secondary">View registered students and administrators.</Text>
      </div>

      <Card>
        <Table columns={columns} dataSource={[]} />
      </Card>
    </div>
  );
}
