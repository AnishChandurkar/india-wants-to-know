import { DM_Sans, Bebas_Neue, Playfair_Display } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas-neue",
  subsets: ["latin"],
  weight: "400",
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["700", "900"],
});

export const metadata = {
  title: "India Wants To Know",
  description: "The nation demands answers! Share your verdict with Rajat Goswami on the hottest debates sweeping India.",
  keywords: "India Wants To Know, debate, opinion, Rajat Goswami, sentiment, Weboreel TV",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${bebasNeue.variable} ${playfairDisplay.variable}`}>
      <body style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>{children}</body>
    </html>
  );
}
