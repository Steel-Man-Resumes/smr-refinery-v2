import type { Metadata } from "next";
import "./globals.css";
import { RefineryProvider } from "@/store/refineryStore";

export const metadata: Metadata = {
  title: "The Refinery | Steel Man Resumes",
  description: "Transform your career intelligence into professional job search documents. $37.21 for your complete package.",
  icons: {
    icon: "/assets/icon-refinery.svg",
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
