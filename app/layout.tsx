export const metadata = {
  title: "Asisten Suara Pegadaian",
  description: "Voice RAG Pegadaian (Realtime WebRTC)"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}