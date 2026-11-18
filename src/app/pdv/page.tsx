import { prisma } from '@/lib/prisma'
import { PDVClient } from './pdv-client'

export const dynamic = 'force-dynamic'

export default async function PDVPage() {
  const [products, customers] = await Promise.all([
    prisma.product.findMany({ orderBy: { name: 'asc' } }),
    prisma.customer.findMany({ orderBy: { name: 'asc' } }),
  ])

  return <PDVClient products={products} customers={customers} />
}
