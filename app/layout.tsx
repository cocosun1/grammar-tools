import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { AuthGate } from "@/components/AuthGate";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "英语语法练习",
  description: "通过短练习巩固英语语法",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <AuthProvider>
          <SiteHeader />
          <AuthGate>
            <main className="main">{children}</main>
          </AuthGate>
          <footer className="site-footer">
            <span>英语语法练习 · 基础语法 · 句子结构 · 写作表达</span>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
