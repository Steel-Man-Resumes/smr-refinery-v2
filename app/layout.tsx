import type { Metadata } from "next";
import "./globals.css";
import { RefineryProvider } from "@/store/refineryStore";

export const metadata: Metadata = {
  title: 'The Refinery | Steel Man Resumes',
  description: 'Document generation system',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <RefineryProvider>{children}</RefineryProvider>
      </body>
    </html>
  );
}
