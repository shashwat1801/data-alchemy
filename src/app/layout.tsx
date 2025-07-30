// app/layout.tsx
import './globals.css';
import React from 'react';

export const metadata = {
  title: "Data Alchemist",
  description: "Validate and transform tabular data",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
