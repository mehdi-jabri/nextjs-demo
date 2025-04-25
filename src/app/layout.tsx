import "./globals.css";
import {Inter} from "next/font/google";
import {AuthProvider} from "@/providers/AuthProvider";
import {Provider} from "@/components/ui/provider";

const inter = Inter({subsets: ["latin"]});

export const metadata = {
  title: "My Next.js App",
  description: "A modern Next.js application using Tailwind CSS and shadcn UI",
};

export default function RootLayout({children}: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
    <head>
      <meta charSet="UTF-8"/>
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    </head>
    <body className={`${inter.className} bg-gray-50`}>
    <Provider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </Provider>
    </body>
    </html>
  );
}
