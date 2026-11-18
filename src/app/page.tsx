import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DollarSign, TrendingUp, ShoppingBag, AlertTriangle, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const [todaySales, lowStockCount, openCreditSales] = await Promise.all([
    prisma.sale.findMany({
      where: { createdAt: { gte: startOfDay } },
      include: { items: true, customer: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.count({
      where: { stock: { lt: 5 } },
    }),
    prisma.sale.aggregate({
      where: { paymentMethod: 'CREDIT', isPaid: false },
      _sum: { total: true },
    }),
  ])

  const todayRevenue = todaySales.reduce((acc, sale) => acc + sale.total, 0)
  const totalSalesCount = todaySales.length

  const estimatedProfit = todaySales.reduce((saleAcc, sale) => {
    const saleProfit = sale.items.reduce(
      (itemAcc, item) => itemAcc + (item.price - item.cost) * item.quantity,
      0
    )
    return saleAcc + saleProfit
  }, 0)

  const totalOpenCredit = openCreditSales._sum.total ?? 0

  const formatBRL = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Resumo de Hoje</h1>
          <p className="text-sm font-medium text-slate-500">
            {new Date().toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: '2-digit',
              month: 'short',
            })}
          </p>
        </div>
        <Link
          href="/pdv"
          className="bg-emerald-600 active:bg-emerald-700 text-white font-bold px-4 py-3 rounded-xl shadow flex items-center gap-2 text-sm"
        >
          Nova Venda <ArrowRight className="w-4 h-4" />
        </Link>
      </header>

      <div className="grid grid-cols-1 gap-3">
        <Card className="border-2 border-emerald-600 bg-emerald-600 text-white shadow-md">
          <CardHeader className="pb-1 pt-4 px-4 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-emerald-100">
              Faturamento Hoje
            </CardTitle>
            <DollarSign className="w-6 h-6 text-emerald-100" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-3xl font-black">{formatBRL(todayRevenue)}</div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Card className="border-2 border-slate-200 bg-white">
            <CardHeader className="pb-1 pt-3 px-3 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-bold uppercase text-slate-500">
                Lucro Estimado
              </CardTitle>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div className="text-xl font-extrabold text-emerald-700">
                {formatBRL(estimatedProfit)}
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-200 bg-white">
            <CardHeader className="pb-1 pt-3 px-3 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-bold uppercase text-slate-500">
                Vendas Hoje
              </CardTitle>
              <ShoppingBag className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div className="text-xl font-extrabold text-slate-900">{totalSalesCount}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/estoque">
          <div className="p-3 rounded-xl border-2 border-red-200 bg-red-50 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-red-700 uppercase">Estoque Baixo</p>
              <p className="text-lg font-black text-red-900">{lowStockCount} itens</p>
            </div>
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
        </Link>

        <Link href="/fiados">
          <div className="p-3 rounded-xl border-2 border-amber-200 bg-amber-50 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-amber-800 uppercase">A Receber (Fiado)</p>
              <p className="text-lg font-black text-amber-950">{formatBRL(totalOpenCredit)}</p>
            </div>
          </div>
        </Link>
      </div>

      <div className="space-y-2">
        <h2 className="text-base font-bold text-slate-800">Últimas Vendas de Hoje</h2>
        {todaySales.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-xl p-6 text-center text-slate-500 text-sm">
            Nenhuma venda registrada hoje.
          </div>
        ) : (
          <div className="space-y-2">
            {todaySales.slice(0, 8).map((sale) => (
              <div
                key={sale.id}
                className="bg-white border-2 border-slate-200 rounded-xl p-3 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{formatBRL(sale.total)}</span>
                    <Badge variant="outline" className="text-xs font-bold">
                      {sale.paymentMethod === 'CASH' && 'DINHEIRO'}
                      {sale.paymentMethod === 'PIX' && 'PIX'}
                      {sale.paymentMethod === 'CARD' && 'CARTÃO'}
                      {sale.paymentMethod === 'CREDIT' && 'FIADO'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {new Date(sale.createdAt).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {sale.customer ? ` • ${sale.customer.name}` : ''}
                  </p>
                </div>
                <span className="text-xs font-semibold text-slate-600">
                  {sale.items.reduce((acc, i) => acc + i.quantity, 0)} un.
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
