export const metadata = {
  title: "Asisten Suara Pegadaian",
  description: "Voice RAG Pegadaian (Realtime WebRTC)"
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body style={{ fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial' }}>{children}</body>
    </html>
  );
}
