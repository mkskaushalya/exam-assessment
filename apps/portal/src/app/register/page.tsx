'use client';

import { Input, Button, Card, Typography, App as AntApp } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';

import { useAuth } from '@/hooks/useAuth';
import styles from './register.module.scss';

const { Title, Text } = Typography;

const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain an uppercase letter')
      .regex(/[a-z]/, 'Must contain a lowercase letter')
      .regex(/[0-9]/, 'Must contain a number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { register } = useAuth();
  const { message } = AntApp.useApp();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: RegisterForm) => {
    try {
      await register(data.name, data.email, data.password);
      message.success('Account created successfully!');
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? 'Registration failed. Please try again.';
      message.error(errorMsg);
    }
  };

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <div className={styles.header}>
          <Title level={2} className={styles.title}>
            Create Account
          </Title>
          <Text type="secondary">Start practicing for your exams today</Text>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="register-name">Full Name</label>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="register-name"
                  prefix={<UserOutlined />}
                  placeholder="John Doe"
                  size="large"
                  status={errors.name ? 'error' : undefined}
                />
              )}
            />
            {errors.name && <Text type="danger">{errors.name.message}</Text>}
          </div>

          <div className={styles.field}>
            <label htmlFor="register-email">Email</label>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="register-email"
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
            <label htmlFor="register-password">Password</label>
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <Input.Password
                  {...field}
                  id="register-password"
                  prefix={<LockOutlined />}
                  placeholder="At least 8 characters"
                  size="large"
                  status={errors.password ? 'error' : undefined}
                />
              )}
            />
            {errors.password && <Text type="danger">{errors.password.message}</Text>}
          </div>

          <div className={styles.field}>
            <label htmlFor="register-confirm">Confirm Password</label>
            <Controller
              name="confirmPassword"
              control={control}
              render={({ field }) => (
                <Input.Password
                  {...field}
                  id="register-confirm"
                  prefix={<LockOutlined />}
                  placeholder="Re-enter password"
                  size="large"
                  status={errors.confirmPassword ? 'error' : undefined}
                />
              )}
            />
            {errors.confirmPassword && (
              <Text type="danger">{errors.confirmPassword.message}</Text>
            )}
          </div>

          <Button
            type="primary"
            htmlType="submit"
            size="large"
            block
            loading={isSubmitting}
            id="register-submit"
          >
            Create Account
          </Button>
        </form>

        <div className={styles.footer}>
          <Text type="secondary">
            Already have an account?{' '}
            <Link href="/login">Sign in</Link>
          </Text>
        </div>
      </Card>
    </div>
  );
}
