'use client'

import { useState, useTransition } from 'react'
import { Product, Customer } from '@prisma/client'
import { createSale, PaymentMethod } from '@/app/actions/pos-actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Search, Plus, Minus, Trash2, CheckCircle2, ShoppingCart } from 'lucide-react'

interface CartItem {
  product: Product
  quantity: number
}

export function PDVClient({
  products,
  customers,
}: {
  products: Product[]
  customers: Customer[]
}) {
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX')
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const formatBRL = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  const addToCart = (product: Product) => {
    setErrorMsg(null)
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id)
      if (existing) {
        if (existing.quantity >= product.stock) return prev
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      if (product.stock <= 0) return prev
      return [...prev, { product, quantity: 1 }]
    })
  }

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id !== productId) return item
          const nextQty = item.quantity + delta
          if (nextQty > item.product.stock) return item
          return { ...item, quantity: nextQty }
        })
        .filter((item) => item.quantity > 0)
    )
  }

  const cartTotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0)
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0)

  const handleConfirmSale = () => {
    setErrorMsg(null)
    if (paymentMethod === 'CREDIT' && !selectedCustomerId) {
      setErrorMsg('Selecione um cliente para registrar no Fiado.')
      return
    }

    startTransition(async () => {
      try {
        await createSale({
          items: cart.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
          paymentMethod,
          customerId: paymentMethod === 'CREDIT' ? selectedCustomerId : undefined,
        })
        setCart([])
        setSelectedCustomerId('')
        setIsCheckoutOpen(false)
      } catch (err: any) {
        setErrorMsg(err.message || 'Erro ao finalizar venda.')
      }
    })
  }

  return (
    <div className="space-y-4 pb-28">
      <header className="pt-2">
        <h1 className="text-2xl font-extrabold text-slate-900">Frente de Caixa (PDV)</h1>
        <p className="text-xs font-medium text-slate-500">
          Toque no produto para adicionar imediatamente
        </p>
      </header>

      <div className="relative">
        <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
        <Input
          placeholder="Buscar produto pelo nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-11 h-12 text-base bg-white border-2 border-slate-300 rounded-xl font-medium"
        />
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {filteredProducts.map((product) => {
          const inCart = cart.find((i) => i.product.id === product.id)?.quantity ?? 0
          const outOfStock = product.stock <= 0

          return (
            <button
              key={product.id}
              disabled={outOfStock}
              onClick={() => addToCart(product)}
              className={`text-left p-3.5 rounded-xl border-2 transition-all active:scale-95 flex flex-col justify-between min-h-[104px] relative ${
                outOfStock
                  ? 'bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed'
                  : inCart > 0
                  ? 'bg-emerald-50 border-emerald-600 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              {inCart > 0 && (
                <span className="absolute -top-2 -right-2 bg-emerald-600 text-white text-xs font-black w-7 h-7 rounded-full flex items-center justify-center shadow">
                  {inCart}
                </span>
              )}
              <div>
                <p className="font-bold text-slate-900 text-sm line-clamp-2 leading-snug">
                  {product.name}
                </p>
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-base font-black text-emerald-700">
                  {formatBRL(product.price)}
                </span>
                <Badge
                  variant={product.stock < 5 ? 'destructive' : 'secondary'}
                  className="text-[10px] px-1.5 py-0"
                >
                  Est: {product.stock}
                </Badge>
              </div>
            </button>
          )
        })}
      </div>

      {cart.length > 0 && (
        <div className="fixed bottom-20 left-0 right-0 z-40 max-w-md mx-auto p-3">
          <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-2xl flex items-center justify-between border-2 border-slate-700">
            <div>
              <p className="text-xs font-bold uppercase text-slate-400">
                {cartCount} {cartCount === 1 ? 'item' : 'itens'} no carrinho
              </p>
              <p className="text-2xl font-black text-emerald-400">{formatBRL(cartTotal)}</p>
            </div>
            <Button
              size="lg"
              onClick={() => setIsCheckoutOpen(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black h-14 px-6 rounded-xl text-base"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Cobrar
            </Button>
          </div>
        </div>
      )}

      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="max-w-sm rounded-2xl p-5 max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Finalizar Venda</DialogTitle>
          </DialogHeader>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1 divide-y divide-slate-100">
            {cart.map(({ product, quantity }) => (
              <div key={product.id} className="pt-2 flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{product.name}</p>
                  <p className="text-xs text-slate-500">
                    {formatBRL(product.price)} x {quantity} ={' '}
                    <strong className="text-slate-800">
                      {formatBRL(product.price * quantity)}
                    </strong>
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-lg border-2"
                    onClick={() => updateQty(product.id, -1)}
                  >
                    {quantity === 1 ? (
                      <Trash2 className="w-4 h-4 text-red-600" />
                    ) : (
                      <Minus className="w-4 h-4" />
                    )}
                  </Button>
                  <span className="w-6 text-center font-bold text-sm">{quantity}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-lg border-2"
                    onClick={() => updateQty(product.id, 1)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-slate-100 p-3 rounded-xl flex items-center justify-between">
            <span className="text-sm font-bold text-slate-600 uppercase">Total a Pagar</span>
            <span className="text-2xl font-black text-slate-900">{formatBRL(cartTotal)}</span>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-slate-500">
              Forma de Pagamento
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { id: 'PIX', label: 'PIX' },
                  { id: 'CASH', label: 'Dinheiro' },
                  { id: 'CARD', label: 'Cartão' },
                  { id: 'CREDIT', label: 'Fiado (A Prazo)' },
                ] as const
              ).map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethod(method.id)}
                  className={`h-12 rounded-xl font-bold text-sm border-2 transition-all ${
                    paymentMethod === method.id
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow'
                      : 'bg-white text-slate-800 border-slate-200'
                  }`}
                >
                  {method.label}
                </button>
              ))}
            </div>
          </div>

          {paymentMethod === 'CREDIT' && (
            <div className="space-y-1.5 bg-amber-50 p-3 rounded-xl border-2 border-amber-300">
              <label className="text-xs font-bold uppercase text-amber-900 block">
                Selecionar Cliente (Obrigatório)
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full h-12 rounded-lg border-2 border-amber-400 bg-white px-3 text-sm font-bold text-slate-900"
              >
                <option value="">-- Escolha um cliente --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone})
                  </option>
                ))}
              </select>
            </div>
          )}

          {errorMsg && (
            <p className="text-xs font-bold text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
              {errorMsg}
            </p>
          )}

          <Button
            size="lg"
            disabled={isPending || cart.length === 0}
            onClick={handleConfirmSale}
            className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base rounded-xl"
          >
            <CheckCircle2 className="w-5 h-5 mr-2" />
            {isPending ? 'Processando...' : 'Confirmar Recebimento'}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
