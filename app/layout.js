import './globals.css';

export const metadata = {
  title: 'Ruleta de Amigo Secreto',
  description: 'Gira una ruleta y asigna regalos de forma aleatoria sin repetición.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
