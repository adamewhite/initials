import type { Metadata } from "next";
import { Nunito, Roboto_Mono } from "next/font/google";
import "./globals.css";

const nunito = Nunito({ subsets: ["latin"] });
const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: '--font-roboto-mono'
});

export const metadata: Metadata = {
  title: "Initials - The Fast-Paced Word Game",
  description: "Fill in words for every letter A-Z before time runs out!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${nunito.className} ${robotoMono.variable}`}>{children}</body>
    </html>
  );
}
