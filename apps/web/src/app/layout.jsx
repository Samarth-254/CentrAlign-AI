import './globals.css';
import { Inter, JetBrains_Mono } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata = {
  title: 'CentrAlign Task Worker Sandbox & Console',
  description: 'Autonomous AI Task Worker Prototype & Enterprise Sandbox Environment',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} dark`}>
      <body className="min-h-screen bg-[#0A0A0A] text-[#EDEDED] antialiased selection:bg-[#FF6A1A]/20 selection:text-[#EDEDED]">
        {children}
      </body>
    </html>
  );
}
