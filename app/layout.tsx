import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Blackwork Tattoo MVP",
  description:
    "Gere designs de tatuagem blackwork com IA ou veja-se tatuado a partir da sua foto.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="min-h-screen bg-ink-black text-neutral-100 font-display antialiased">
        {children}
      </body>
    </html>
  );
}
