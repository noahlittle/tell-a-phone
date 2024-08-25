import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Raydeeo: Press Releases Made Easy",
  viewport: "width=device-width, user-scalable=no",
  description: "Raydeeo is a platform that makes it easy for you to create and distribute press releases.",
};


export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
