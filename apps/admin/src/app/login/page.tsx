'use client';

import {
  MailOutlined,
  LockOutlined
} from '@ant-design/icons';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Input,
  Button,
  Card,
  Typography,
  App as AntApp,
  Alert
} from 'antd';
import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';

import { useAdminAuth } from '@/hooks/useAdminAuth';

const { Title, Text } = Typography;

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function AdminLoginPage() {
  const { login, isAuthenticated } = useAdminAuth();
  const { message } = AntApp.useApp();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  // Since we might be redirecting here, clear any weird states
  useEffect(() => {
    if (isAuthenticated) {
      window.location.href = '/';
    }
  }, [isAuthenticated]);

  const onSubmit = async (data: LoginForm) => {
    setErrorMsg(null);
    try {
      await login(data.email, data.password);
      message.success('Admin Login successful!');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } }; message?: string };
      const msg = error.response?.data?.error?.message || error.message || 'Login failed.';
      message.error(msg);
      setErrorMsg(msg);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
    }}>
      <Card style={{ width: '100%', maxWidth: '400px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Title level={3} style={{ margin: 0 }}>Admin Portal</Title>
          <Text type="secondary">Sign in with administrator credentials</Text>
        </div>

        {errorMsg && <Alert type="error" message={errorMsg} showIcon style={{ marginBottom: '1rem' }} />}

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Email</label>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  prefix={<MailOutlined />}
                  placeholder="admin@assessment.dev"
                  size="large"
                  status={errors.email ? 'error' : undefined}
                />
              )}
            />
            {errors.email && <Text type="danger" style={{ fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>{errors.email.message}</Text>}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Password</label>
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <Input.Password
                  {...field}
                  prefix={<LockOutlined />}
                  placeholder="Enter admin password"
                  size="large"
                  status={errors.password ? 'error' : undefined}
                />
              )}
            />
            {errors.password && <Text type="danger" style={{ fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>{errors.password.message}</Text>}
          </div>

          <Button
            type="primary"
            htmlType="submit"
            size="large"
            block
            loading={isSubmitting}
            style={{ marginTop: '0.5rem' }}
          >
            Authorize
          </Button>
        </form>
      </Card>
    </div>
  );
}
