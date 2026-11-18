import { prisma } from '@/lib/prisma'
import { FiadosClient } from './fiados-client'

export const dynamic = 'force-dynamic'

export default async function FiadosPage() {
  const customers = await prisma.customer.findMany({
    include: {
      sales: {
        where: { paymentMethod: 'CREDIT', isPaid: false },
      },
    },
    orderBy: { name: 'asc' },
  })

  const formatted = customers.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    openSalesCount: c.sales.length,
    totalDebt: c.sales.reduce((acc, s) => acc + s.total, 0),
  }))

  formatted.sort((a, b) => b.totalDebt - a.totalDebt)

  return <FiadosClient customers={formatted} />
}
