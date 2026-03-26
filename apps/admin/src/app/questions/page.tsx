'use client';

import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  SaveOutlined
} from '@ant-design/icons';
import {
  Typography,
  Card,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Popconfirm,
  Tag,
  List,
  Checkbox,
  Divider,
  Empty
} from 'antd';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import React, { useState, useEffect, useCallback } from 'react';

import { useAdminAuth } from '@/hooks/useAdminAuth';
import { api } from '@/lib/api';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface OptionRecord {
  id?: string;
  optionText: string;
  isCorrect: number;
  orderIndex: number;
}

interface QuestionRecord {
  id: string;
  paperId: string;
  questionText: string;
  explanationText: string;
  points: number;
  complexity: 'easy' | 'medium' | 'hard';
  orderIndex: number;
  options: OptionRecord[];
}

interface PaperInfo {
  id: string;
  title: string;
  subject: string;
}

export default function AdminQuestionsPage() {
  const searchParams = useSearchParams();
  const paperId = searchParams.get('paperId');

  const [paper, setPaper] = useState<PaperInfo | null>(null);
  const [questions, setQuestions] = useState<QuestionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionRecord | null>(null);
  const [form] = Form.useForm();

  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();

  const fetchPaperAndQuestions = useCallback(async () => {
    if (!paperId || authLoading || !isAuthenticated) return;
    setLoading(true);
    try {
      // Fetch paper details first (using the public portal endpoint is fine for basic info)
      const paperRes = await api.get<{ success: boolean; data: { paper: PaperInfo } }>(`/papers/${paperId}`);
      if (paperRes.data.success) {
        setPaper(paperRes.data.data.paper);
      }

      // Fetch all questions for admin
      const questionsRes = await api.get<{ success: boolean; data: QuestionRecord[] }>(`/papers/${paperId}/questions/admin`);
      if (questionsRes.data.success) {
        setQuestions(questionsRes.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      message.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  }, [paperId, isAuthenticated, authLoading]);

  useEffect(() => {
    void fetchPaperAndQuestions();
  }, [fetchPaperAndQuestions]);

  const showModal = (question?: QuestionRecord) => {
    if (question) {
      setEditingQuestion(question);
      form.setFieldsValue({
        ...question,
        // Map isCorrect to boolean for the checkbox in the form
        options: question.options.map(opt => ({
          ...opt,
          isCorrect: opt.isCorrect === 1
        }))
      });
    } else {
      setEditingQuestion(null);
      form.setFieldsValue({
        questionText: '',
        explanationText: '',
        points: 1,
        complexity: 'medium',
        orderIndex: questions.length + 1,
        options: [
          { optionText: '', isCorrect: false, orderIndex: 1 },
          { optionText: '', isCorrect: false, orderIndex: 2 },
          { optionText: '', isCorrect: false, orderIndex: 3 },
          { optionText: '', isCorrect: false, orderIndex: 4 },
        ]
      });
    }
    setIsModalVisible(true);
  };

  const onFinish = async (values: Record<string, any>) => {
    if (!paperId) return;
    try {
      const payload = {
        ...values,
        options: values.options.map((opt: { isCorrect: boolean; optionText: string }, index: number) => ({
          ...opt,
          isCorrect: opt.isCorrect ? 1 : 0,
          orderIndex: index + 1
        }))
      };

      if (editingQuestion) {
        await api.put(`/papers/questions/${editingQuestion.id}`, payload);
        message.success('Question updated successfully');
      } else {
        await api.post(`/papers/${paperId}/questions`, payload);
        message.success('Question added successfully');
      }
      setIsModalVisible(false);
      void fetchPaperAndQuestions();
    } catch {
      message.error('Failed to save question');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/papers/questions/${id}`);
      message.success('Question removed');
      void fetchPaperAndQuestions();
    } catch {
      message.error('Failed to remove question');
    }
  };

  if (!paperId) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <Empty description="No paper selected" />
        <Link href="/papers">
          <Button type="primary">Back to Papers</Button>
        </Link>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/papers">
          <Button icon={<ArrowLeftOutlined />} style={{ marginBottom: '1rem' }}>Back to Papers</Button>
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <Title level={2} style={{ margin: 0 }}>Questions for {paper?.title || 'Loading...'}</Title>
            <Text type="secondary">{paper?.subject} • {questions.length} Questions</Text>
          </div>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            size="large"
            onClick={() => showModal()}
          >
            Add Question
          </Button>
        </div>
      </div>

      <List
        loading={loading}
        dataSource={questions}
        renderItem={(item) => (
          <Card 
            key={item.id} 
            style={{ marginBottom: '1rem' }}
            title={`Question ${item.orderIndex}`}
            extra={
              <Space>
                <Button icon={<EditOutlined />} onClick={() => { showModal(item); }} size="small" />
                <Popconfirm title="Delete question?" onConfirm={() => { void handleDelete(item.id); }}>
                  <Button icon={<DeleteOutlined />} danger size="small" />
                </Popconfirm>
              </Space>
            }
          >
            <Paragraph style={{ fontWeight: 500, fontSize: '16px' }}>{item.questionText}</Paragraph>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '1rem' }}>
              {item.options.map((opt, i) => (
                <div 
                  key={i} 
                  style={{ 
                    padding: '8px 12px', 
                    border: '1px solid #f0f0f0', 
                    borderRadius: '4px',
                    background: opt.isCorrect ? '#f6ffed' : '#fff',
                    borderColor: opt.isCorrect ? '#b7eb8f' : '#f0f0f0'
                  }}
                >
                  <Tag color={opt.isCorrect ? 'success' : 'default'} style={{ marginRight: '8px' }}>
                    {String.fromCharCode(65 + i)}
                  </Tag>
                  {opt.optionText}
                </div>
              ))}
            </div>

            {item.explanationText && (
              <div style={{ background: '#fafafa', padding: '12px', borderRadius: '4px' }}>
                <Text strong>Explanation:</Text>
                <Paragraph style={{ margin: 0, color: '#666' }}>{item.explanationText}</Paragraph>
              </div>
            )}
            
            <Divider style={{ margin: '12px 0' }} />
            <Space split={<Divider type="vertical" />}>
              <Tag color="geekblue">{item.complexity.toUpperCase()}</Tag>
              <Text type="secondary">{item.points} Points</Text>
            </Space>
          </Card>
        )}
      />

      <Modal
        title={editingQuestion ? 'Edit Question' : 'Add New Question'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
        >
          <Form.Item
            name="questionText"
            label="Question Text"
            rules={[{ required: true, message: 'Question text is required' }]}
          >
            <Input.TextArea rows={4} placeholder="Type the question here..." />
          </Form.Item>

          <Form.List name="options">
            {(fields, { add, remove }) => (
              <div style={{ marginBottom: '24px' }}>
                <Text strong>Answer Options</Text>
                {fields.map((field, index) => (
                  <Space key={field.key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item
                      name={[field.name, 'isCorrect']}
                      valuePropName="checked"
                    >
                      <Checkbox />
                    </Form.Item>
                    <Form.Item
                      name={[field.name, 'optionText']}
                      rules={[{ required: true, message: 'Missing option text' }]}
                      style={{ flex: 1, minWidth: '400px' }}
                    >
                      <Input placeholder={`Option ${String.fromCharCode(65 + index)}`} />
                    </Form.Item>
                    {fields.length > 2 && (
                      <DeleteOutlined onClick={() => remove(field.name)} />
                    )}
                  </Space>
                ))}
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                  Add Option
                </Button>
              </div>
            )}
          </Form.List>

          <Form.Item
            name="explanationText"
            label="Explanation (Shown after answer)"
          >
            <Input.TextArea rows={3} placeholder="Why is the correct answer correct?" />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <Form.Item name="points" label="Points">
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
            
            <Form.Item name="complexity" label="Complexity">
              <Select>
                <Option value="easy">Easy</Option>
                <Option value="medium">Medium</Option>
                <Option value="hard">Hard</Option>
              </Select>
            </Form.Item>

            <Form.Item name="orderIndex" label="Order Index">
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <Form.Item style={{ textAlign: 'right', marginTop: '24px' }}>
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                Save Question
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
