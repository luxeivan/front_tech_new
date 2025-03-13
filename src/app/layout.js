import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import '@ant-design/v5-patch-for-react-19';
import { AntdRegistry } from "@ant-design/nextjs-registry";
import AppHeader from "@/components/server/global/AppHeader";
import Footer from "@/components/server/global/Footer";
import { Flex } from 'antd'
import Providers from "@/components/client/global/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Тех нарушения",
  description: "Мособленерго технарушения",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Providers>

        <AntdRegistry>
          <Flex vertical style={{minHeight:"100vh"}}>
            <AppHeader />
            <div style={{ flex: 1 }}>
              {children}
            </div>
            <Footer />
          </Flex>
        </AntdRegistry>
        </Providers>
      </body>
    </html>
  );
}
