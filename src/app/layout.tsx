import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "首战即决战：AI 销售备战教练",
  description: "顶尖售前战术专家系统",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={cn("antialiased", inter.variable)}>
      <body className="min-h-screen bg-background font-sans">
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function() {
  var match = document.cookie.match(/(?:^|;\\s*)user=([^;]*)/);
  if (match) {
    try {
      var user = JSON.parse(decodeURIComponent(match[1]));
      localStorage.setItem('user', JSON.stringify(user));
    } catch(e) {}
  }
})();
`,
          }}
        />
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
