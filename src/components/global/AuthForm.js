"use client";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Form, Input, Alert } from "antd";
import useAuthStore from "@/stores/authStore";

const AuthForm = ({closeModal}) => {
  const { login, error, loading } = useAuthStore();
  

  const onFinish = async (values) => {
    await login(values.identifier, values.password);
  };

  return (
    <div style={{ maxWidth: 300, margin: "100px auto" }}>
      <Form name="auth" initialValues={{ remember: true }} onFinish={onFinish}>
        <Form.Item
          name="identifier"
          rules={[{ required: true, message: "Введите email!" }]}
        >
          <Input prefix={<UserOutlined />} placeholder="Email" size="large" />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[{ required: true, message: "Введите пароль!" }]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Пароль"
            size="large"
          />
        </Form.Item>

        {error && (
          <Alert message={error} type="error" style={{ marginBottom: 24 }} />
        )}

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={loading}
            block
          >
            Войти
          </Button>
        </Form.Item>
        <Form.Item>
          <Button block size="large" onClick={()=>closeModal()}>Закрыть</Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default AuthForm;
