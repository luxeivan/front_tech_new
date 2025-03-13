'use client'
import React from 'react'
import { Button, Form, Input, Flex } from 'antd'
import { signIn } from 'next-auth/react'

export default function Login() {
    const handlerFinish = (event) => {
        console.log(event);
        signIn('credentials', { ...event, redirectTo: "/", redirect: true })
    }
    return (
        <Flex justify='center' vertical align='center' gap={20}>
            <h1>Авторизация</h1>
            <Form
                onFinish={handlerFinish}
                labelCol={{
                    span: 8,
                }}
                wrapperCol={{
                    span: 16,
                }}
                style={{
                    maxWidth: 800,
                    width: "100%"
                }}>
                <Form.Item
                    name='username'
                    label="Логин"
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    name='password'
                    label="Пароль"
                >
                    <Input.Password />
                </Form.Item>
                <Form.Item
                    wrapperCol={{
                        offset: 8,
                        span: 16,
                    }}
                    >
                    <Button type="primary" htmlType="submit">Авторизоваться</Button>
                </Form.Item>
            </Form>
        </Flex>
    )
}
