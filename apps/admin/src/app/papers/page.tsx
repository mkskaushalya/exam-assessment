'use client';

import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  QuestionCircleOutlined,
  SearchOutlined
} from '@ant-design/icons';
import {
  Typography,
  Card,
  Button,
  Table,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Popconfirm,
  Tag
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import Link from 'next/link';
import React, { useState, useEffect, useCallback } from 'react';

import { api } from '@/lib/api';

const { Title, Text } = Typography;
const { Option } = Select;

interface PaperRecord {
  id: string;
  title: string;
  description: string;
  subject: string;
  language: string;
  examBoard: string;
  type: 'past_paper' | 'model_paper' | 'ai_predicted';
  year: number;
  durationMinutes: number;
  priceLkr: string;
  createdAt: string;
}

export default function AdminPapersPage() {
  const [papers, setPapers] = useState<PaperRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPaper, setEditingPaper] = useState<PaperRecord | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');

  const fetchPapers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get<{ success: boolean; data: PaperRecord[] }>('/papers', {
        params: { search: searchText }
      });
      if (response.data.success) {
        setPapers(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch papers:', error);
      message.error('Failed to load papers');
    } finally {
      setLoading(false);
    }
  }, [searchText]);

  useEffect(() => {
    void fetchPapers();
  }, [fetchPapers]);

  const showModal = (paper?: PaperRecord) => {
    if (paper) {
      setEditingPaper(paper);
      form.setFieldsValue({
        ...paper,
        priceLkr: parseFloat(paper.priceLkr)
      });
    } else {
      setEditingPaper(null);
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const onFinish = async (values: Record<string, any>) => {
    try {
      const payload = {
        ...values,
        priceLkr: values.priceLkr.toString()
      };

      if (editingPaper) {
        await api.put(`/papers/${editingPaper.id}`, payload);
        message.success('Paper updated successfully');
      } else {
        await api.post('/papers', payload);
        message.success('Paper created successfully');
      }
      setIsModalVisible(false);
      void fetchPapers();
    } catch (error) {
      console.error('Failed to save paper:', error);
      message.error('Failed to save paper');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/papers/${id}`);
      message.success('Paper deleted successfully');
      void fetchPapers();
    } catch (error) {
      console.error('Failed to delete paper:', error);
      message.error('Failed to delete paper');
    }
  };

  const columns: ColumnsType<PaperRecord> = [
    { 
      title: 'Title', 
      dataIndex: 'title', 
      key: 'title',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{text}</div>
          <div style={{ fontSize: '12px', color: '#888' }}>{record.subject} • {record.year}</div>
        </div>
      )
    },
    { 
      title: 'Type', 
      dataIndex: 'type', 
      key: 'type',
      render: (type: string) => {
        const colors = {
          past_paper: 'blue',
          model_paper: 'green',
          ai_predicted: 'purple'
        };
        return <Tag color={colors[type as keyof typeof colors]}>{type.toUpperCase().replace('_', ' ')}</Tag>;
      }
    },
    { title: 'Exam Board', dataIndex: 'examBoard', key: 'examBoard' },
    { 
      title: 'Price (LKR)', 
      dataIndex: 'priceLkr', 
      key: 'priceLkr',
      render: (val) => `Rs. ${parseFloat(val).toLocaleString()}`
    },
    { 
      title: 'Duration', 
      dataIndex: 'durationMinutes', 
      key: 'durationMinutes',
      render: (min) => `${min} mins`
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Link href={`/questions?paperId=${record.id}`}>
            <Button icon={<QuestionCircleOutlined />} size="small">Questions</Button>
          </Link>
          <Button 
            icon={<EditOutlined />} 
            size="small" 
            onClick={() => { showModal(record); }}
          />
          <Popconfirm
            title="Delete Paper"
            description="Are you sure you want to delete this paper? All associated questions will also be deleted."
            onConfirm={() => { void handleDelete(record.id); }}
            okText="Yes"
            cancelText="No"
          >
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Manage Papers</Title>
          <Text type="secondary">Create, edit, and organize examination papers.</Text>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          size="large"
          onClick={() => showModal()}
        >
          Create Paper
        </Button>
      </div>

      <Card style={{ marginBottom: '1rem' }}>
        <Input
          placeholder="Search papers by title or subject..."
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
          dataSource={papers} 
          rowKey="id" 
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingPaper ? 'Edit Paper' : 'Create New Paper'}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            language: 'English',
            type: 'past_paper',
            priceLkr: 0
          }}
        >
          <Form.Item
            name="title"
            label="Paper Title"
            rules={[{ required: true, message: 'Please enter paper title' }]}
          >
            <Input placeholder="e.g., GCE A/L 2023 Physics Part I" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <Input.TextArea rows={3} placeholder="Brief summary of the paper..." />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Form.Item
              name="subject"
              label="Subject"
              rules={[{ required: true, message: 'Please enter subject' }]}
            >
              <Input placeholder="e.g., Physics" />
            </Form.Item>

            <Form.Item
              name="examBoard"
              label="Exam Board"
              rules={[{ required: true, message: 'Please enter exam board' }]}
            >
              <Input placeholder="e.g., Department of Examinations" />
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <Form.Item
              name="year"
              label="Year"
              rules={[{ required: true, message: 'Please enter year' }]}
            >
              <InputNumber style={{ width: '100%' }} placeholder="2023" />
            </Form.Item>

            <Form.Item
              name="language"
              label="Language"
              rules={[{ required: true, message: 'Please enter language' }]}
            >
              <Input placeholder="English" />
            </Form.Item>

            <Form.Item
              name="type"
              label="Paper Type"
              rules={[{ required: true, message: 'Please select type' }]}
            >
              <Select>
                <Option value="past_paper">Past Paper</Option>
                <Option value="model_paper">Model Paper</Option>
                <Option value="ai_predicted">AI Predicted</Option>
              </Select>
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Form.Item
              name="priceLkr"
              label="Price (LKR)"
              rules={[{ required: true, message: 'Please enter price' }]}
            >
              <InputNumber 
                min={0} 
                style={{ width: '100%' }} 
                formatter={(value) => `Rs. ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                 parser={(value) => value!.replace(/Rs.\s?|(,*)/g, '') as any}
              />
            </Form.Item>

            <Form.Item
              name="durationMinutes"
              label="Duration (mins)"
              rules={[{ required: true, message: 'Please enter duration' }]}
            >
              <InputNumber min={1} style={{ width: '100%' }} placeholder="60" />
            </Form.Item>
          </div>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={handleCancel}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingPaper ? 'Update' : 'Create'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
