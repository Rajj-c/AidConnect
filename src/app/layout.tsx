
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata: Metadata = {
  title: 'AidConnect | Smart Resource Allocation',
  description: 'Data-Driven Volunteer Coordination for Social Impact.',
  manifest: '/manifest.json',
  themeColor: '#2563eb',
  icons: [
    { rel: 'icon', url: '/favicon.ico', type: 'image/x-icon' },
    { rel: 'shortcut icon', url: '/favicon.ico', type: 'image/x-icon' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background">
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
