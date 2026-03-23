'use client';

import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input, Button, Card, Typography, App as AntApp } from 'antd';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';

import { useAuth } from '@/hooks/useAuth';

import styles from './login.module.scss';

const { Title, Text } = Typography;

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const { message } = AntApp.useApp();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      await login(data.email, data.password);
      message.success('Login successful!');
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? 'Login failed. Please try again.';
      message.error(errorMsg);
    }
  };

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <div className={styles.header}>
          <Title level={2} className={styles.title}>
            Welcome Back
          </Title>
          <Text type="secondary">Sign in to continue practicing</Text>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="login-email">Email</label>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="login-email"
                  prefix={<MailOutlined />}
                  placeholder="you@example.com"
                  size="large"
                  status={errors.email ? 'error' : undefined}
                />
              )}
            />
            {errors.email && <Text type="danger">{errors.email.message}</Text>}
          </div>

          <div className={styles.field}>
            <label htmlFor="login-password">Password</label>
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <Input.Password
                  {...field}
                  id="login-password"
                  prefix={<LockOutlined />}
                  placeholder="Enter your password"
                  size="large"
                  status={errors.password ? 'error' : undefined}
                />
              )}
            />
            {errors.password && <Text type="danger">{errors.password.message}</Text>}
          </div>

          <Button
            type="primary"
            htmlType="submit"
            size="large"
            block
            loading={isSubmitting}
            id="login-submit"
          >
            Sign In
          </Button>
        </form>

        <div className={styles.footer}>
          <Text type="secondary">
            Don&apos;t have an account?{' '}
            <Link href="/register">Sign up</Link>
          </Text>
        </div>
      </Card>
    </div>
  );
}
