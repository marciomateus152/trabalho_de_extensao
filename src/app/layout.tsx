import type { Metadata, Viewport } from 'next'
import './globals.css'
import { BottomNav } from '@/components/bottom-nav'

export const metadata: Metadata = {
  title: 'PDV Local - Gestão Rápida',
  description: 'Ponto de Venda e Controle de Estoque Mobile-First',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className="font-sans bg-slate-200 text-slate-950 antialiased">
        <div className="max-w-md mx-auto min-h-dvh bg-slate-50 pb-24 shadow-xl relative flex flex-col">
          <main className="flex-1 p-4">{children}</main>
          <BottomNav />
        </div>
      </body>
    </html>
  )
}
