export const metadata = {
  title: "Dom Navalha",
  description: "Dom Navalha Barber Club",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
