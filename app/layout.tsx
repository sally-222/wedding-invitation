import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "李辰海 & 沙雷雨馨的婚礼请柬",
  description: "2026年10月6日，中原油田宾馆，诚邀您见证我们的婚礼。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
