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
    <>
    <head>
      <script defer src="https://cloud.umami.is/script.js" data-website-id="b28defd1-6aad-477d-b975-0e6ee627c7be"></script>
    </head>
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
    </>
  );
}
