import './globals.css';

export const metadata = {
  title: 'CentrAlign Task Worker Sandbox & Console',
  description: 'Autonomous AI Task Worker Prototype & Enterprise Sandbox Environment',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
