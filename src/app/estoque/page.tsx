import { prisma } from '@/lib/prisma'
import { StockClient } from './stock-client'

export const dynamic = 'force-dynamic'

export default async function EstoquePage() {
  const products = await prisma.product.findMany({
    orderBy: [{ stock: 'asc' }, { name: 'asc' }],
  })

  return <StockClient products={products} />
}
