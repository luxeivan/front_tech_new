import React from "react";
import { Space } from "antd";
// import Title from 'antd/es/typography/Title'
import Text from 'antd/es/typography/Text'
import Link from "next/link";



export default function Footer ()  {
  return (
    <div style={{ textAlign: "center", padding: "10px 0" }}>
      <Space direction="vertical" size="large" align="center">
        <Text>
          Copyright ©{" "}
          <Link
            href="https://mosoblenergo.ru/"
            target="_blank"
          >
            АО «Мособлэнерго»
          </Link>{" "}
          | Разработка сайта - Станислав Януть | 2025 год
        </Text>
      </Space>
    </div>
  );
};
