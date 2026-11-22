import type { Metadata, Viewport } from "next";
import "@fontsource-variable/nunito";
import "@fontsource-variable/fredoka";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Diet Factory | Menu",
    template: "%s | Diet Factory",
  },
  description:
    "Juices, smoothies, toasts, bowls and salads. No refined sugar, olive oil only. Where health meets wellness.",
};

export const viewport: Viewport = {
  themeColor: "#033623",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
