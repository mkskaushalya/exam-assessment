'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Typography, 
  Card, 
  Table, 
  Tag, 
  message, 
  Button, 
  Popconfirm,
  Space,
  Input
} from 'antd';
import { 
  DeleteOutlined, 
  UserOutlined,
  SearchOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api from '@/lib/api';
import { useAdminAuthStore } from '@/store/auth';

const { Title, Text } = Typography;

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const currentUser = useAdminAuthStore(state => state.user);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/users');
      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      message.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/users/${id}`);
      message.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      message.error(error.response?.data?.error?.message || 'Failed to delete user');
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchText.toLowerCase()) ||
    user.email.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns: ColumnsType<UserRecord> = [
    {
      title: 'User',
      key: 'userInfo',
      render: (_, record) => (
        <Space>
          <UserOutlined style={{ fontSize: '18px', color: '#888' }} />
          <div>
            <div style={{ fontWeight: 600 }}>{record.name}</div>
            <div style={{ fontSize: '12px', color: '#888' }}>{record.email}</div>
          </div>
        </Space>
      )
    },
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
    { 
      title: 'Joined', 
      dataIndex: 'createdAt', 
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString()
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Popconfirm
          title="Delete User"
          description={`Are you sure you want to delete ${record.name}? This action cannot be undone.`}
          onConfirm={() => handleDelete(record.id)}
          disabled={record.id === currentUser?.id}
          okText="Yes"
          cancelText="No"
        >
          <Button 
            icon={<DeleteOutlined />} 
            danger 
            size="small" 
            disabled={record.id === currentUser?.id}
            title={record.id === currentUser?.id ? "You cannot delete yourself" : ""}
          />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Title level={2} style={{ margin: 0 }}>System Users</Title>
        <Text type="secondary">Manage user accounts and view registration history.</Text>
      </div>

      <Card style={{ marginBottom: '1rem' }}>
        <Input
          placeholder="Search by name or email..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
          style={{ maxWidth: 400 }}
        />
      </Card>

      <Card>
        <Table 
          columns={columns} 
          dataSource={filteredUsers} 
          rowKey="id" 
          loading={loading}
          pagination={{ pageSize: 15 }}
        />
      </Card>
    </div>
  );
}
