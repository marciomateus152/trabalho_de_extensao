'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export type PaymentMethod = 'CASH' | 'PIX' | 'CARD' | 'CREDIT'

// --- PRODUCT ACTIONS (ESTOQUE) ---

export async function upsertProduct(data: {
  id?: string
  name: string
  price: number
  cost: number
  stock: number
}) {
  if (!data.name || data.price < 0 || data.cost < 0) {
    throw new Error('Dados do produto inválidos.')
  }

  if (data.id) {
    await prisma.product.update({
      where: { id: data.id },
      data: {
        name: data.name.trim(),
        price: Number(data.price),
        cost: Number(data.cost),
        stock: Number(data.stock),
      },
    })
  } else {
    await prisma.product.create({
      data: {
        name: data.name.trim(),
        price: Number(data.price),
        cost: Number(data.cost),
        stock: Number(data.stock),
      },
    })
  }

  revalidatePath('/estoque')
  revalidatePath('/pdv')
  revalidatePath('/')
}

export async function deleteProduct(id: string) {
  await prisma.product.delete({ where: { id } })
  revalidatePath('/estoque')
  revalidatePath('/pdv')
}

// --- CUSTOMER & DEBT ACTIONS (FIADOS) ---

export async function upsertCustomer(data: { id?: string; name: string; phone: string }) {
  if (!data.name.trim()) throw new Error('Nome é obrigatório.')

  if (data.id) {
    await prisma.customer.update({
      where: { id: data.id },
      data: { name: data.name.trim(), phone: data.phone.trim() },
    })
  } else {
    await prisma.customer.create({
      data: { name: data.name.trim(), phone: data.phone.trim() },
    })
  }

  revalidatePath('/fiados')
  revalidatePath('/pdv')
}

export async function deleteCustomer(id: string) {
  await prisma.customer.delete({ where: { id } })
  revalidatePath('/fiados')
  revalidatePath('/pdv')
}

export async function settleCustomerDebt(customerId: string) {
  await prisma.sale.updateMany({
    where: {
      customerId,
      paymentMethod: 'CREDIT',
      isPaid: false,
    },
    data: {
      isPaid: true,
    },
  })

  revalidatePath('/fiados')
  revalidatePath('/')
}

// --- CHECKOUT TRANSACTION (PDV) ---

export interface CartItemInput {
  productId: string
  quantity: number
}

export async function createSale(input: {
  items: CartItemInput[]
  paymentMethod: PaymentMethod
  customerId?: string
}) {
  if (!input.items.length) {
    throw new Error('O carrinho está vazio.')
  }

  if (input.paymentMethod === 'CREDIT' && !input.customerId) {
    throw new Error('Selecione um cliente para vendas no Fiado.')
  }

  return await prisma.$transaction(async (tx) => {
    let saleTotal = 0
    const saleItemsData: {
      productId: string
      quantity: number
      price: number
      cost: number
    }[] = []

    for (const item of input.items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
      })

      if (!product) {
        throw new Error(`Produto não encontrado.`)
      }

      if (product.stock < item.quantity) {
        throw new Error(
          `Estoque insuficiente para "${product.name}". Disponível: ${product.stock}`
        )
      }

      await tx.product.update({
        where: { id: product.id },
        data: { stock: { decrement: item.quantity } },
      })

      saleTotal += product.price * item.quantity
      saleItemsData.push({
        productId: product.id,
        quantity: item.quantity,
        price: product.price,
        cost: product.cost,
      })
    }

    const sale = await tx.sale.create({
      data: {
        total: saleTotal,
        paymentMethod: input.paymentMethod,
        isPaid: input.paymentMethod !== 'CREDIT',
        customerId: input.paymentMethod === 'CREDIT' ? input.customerId : null,
        items: {
          create: saleItemsData,
        },
      },
    })

    revalidatePath('/')
    revalidatePath('/pdv')
    revalidatePath('/estoque')
    revalidatePath('/fiados')

    return sale
  })
}
