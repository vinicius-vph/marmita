import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning className="h-full">
      <body className="min-h-full flex flex-col bg-[#f0f7f7] text-[#1a3a3a] antialiased">
        {children}
      </body>
    </html>
  );
}
