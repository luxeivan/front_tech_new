"use client";
import React, { useState } from "react";
import { Button, Form, Input, Flex } from "antd";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import PortalAnime from "@/components/client/preloader/PortalAnime";

export default function Login() {
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [showPreloader, setShowPreloader] = useState(false);
  const router = useRouter();

  const handlerFinish = async (values) => {
    try {
      setLoadingAuth(true);
      const result = await signIn("credentials", {
        ...values,
        redirect: false,
      });

      setLoadingAuth(false);

      if (result?.ok) {
        setShowPreloader(true);
        setTimeout(() => {
          router.push("/");
        }, 5000);
      } else {
        console.log("Ошибка авторизации:", result?.error);
      }
    } catch (error) {
      setLoadingAuth(false);
      console.log("Ошибка в signIn:", error);
    }
  };

  if (showPreloader) {
    return (
      <Flex justify="center" vertical align="center" style={{ marginTop: 50 }}>
        <PortalAnime />;
      </Flex>
    );
  }

  return (
    <Flex justify="center" vertical align="center" gap={20}>
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
          width: "100%",
        }}
      >
        <Form.Item
          name="username"
          label="Логин"
          rules={[{ required: true, message: "Введите логин" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="password"
          label="Пароль"
          rules={[{ required: true, message: "Введите пароль" }]}
        >
          <Input.Password />
        </Form.Item>
        <Form.Item
          wrapperCol={{
            offset: 8,
            span: 16,
          }}
        >
          <Button type="primary" htmlType="submit" loading={loadingAuth}>
            Авторизоваться
          </Button>
        </Form.Item>
      </Form>
    </Flex>
  );
}

// "use client";
// import React from "react";
// import { Button, Form, Input, Flex } from "antd";
// import { signIn } from "next-auth/react";

// export default function Login() {
//   const handlerFinish = (event) => {
//     console.log(event);
//     signIn("credentials", { ...event, redirectTo: "/", redirect: true });
//   };
//   return (
//     <Flex justify="center" vertical align="center" gap={20}>
//       <h1>Авторизация</h1>
//       <Form
//         onFinish={handlerFinish}
//         labelCol={{
//           span: 8,
//         }}
//         wrapperCol={{
//           span: 16,
//         }}
//         style={{
//           maxWidth: 800,
//           width: "100%",
//         }}
//       >
//         <Form.Item name="username" label="Логин">
//           <Input />
//         </Form.Item>
//         <Form.Item name="password" label="Пароль">
//           <Input.Password />
//         </Form.Item>
//         <Form.Item
//           wrapperCol={{
//             offset: 8,
//             span: 16,
//           }}
//         >
//           <Button type="primary" htmlType="submit">
//             Авторизоваться
//           </Button>
//         </Form.Item>
//       </Form>
//     </Flex>
//   );
// }
