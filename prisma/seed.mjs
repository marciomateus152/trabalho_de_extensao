import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const count = await prisma.product.count()
  if (count > 0) return

  await prisma.product.createMany({
    data: [
      { name: 'Coca-Cola 2L', price: 12.0, cost: 8.5, stock: 15 },
      { name: 'Pão de Forma Tradicional', price: 8.5, cost: 5.2, stock: 3 },
      { name: 'Leite Integral 1L', price: 6.0, cost: 4.1, stock: 24 },
      { name: 'Café Torrado 500g', price: 18.9, cost: 13.0, stock: 4 },
      { name: 'Arroz Tipo 1 5kg', price: 29.9, cost: 22.5, stock: 10 },
      { name: 'Água Mineral 500ml', price: 3.0, cost: 1.1, stock: 30 },
    ],
  })

  const maria = await prisma.customer.create({
    data: { name: 'Maria Oliveira', phone: '(11) 98765-4321' },
  })

  await prisma.customer.create({
    data: { name: 'João Santos', phone: '(11) 91234-5678' },
  })

  const cafe = await prisma.product.findFirst({ where: { name: 'Café Torrado 500g' } })
  if (cafe) {
    await prisma.sale.create({
      data: {
        total: 18.9,
        paymentMethod: 'CREDIT',
        isPaid: false,
        customerId: maria.id,
        items: {
          create: [
            {
              productId: cafe.id,
              quantity: 1,
              price: cafe.price,
              cost: cafe.cost,
            },
          ],
        },
      },
    })
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
