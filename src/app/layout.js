import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Raydeeo: The Crowdsourced Radio Station",
  viewport: "width=device-width, user-scalable=no",
  description: "Raydeeo is a democratic audio platform, where anyone can share their audio. Upvotes and downvotes determine the duration of their broadcast.",
};


export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
