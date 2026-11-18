'use client'

import { useState, useTransition } from 'react'
import { Product } from '@prisma/client'
import { upsertProduct, deleteProduct } from '@/app/actions/pos-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Plus, Edit2, Trash2, AlertCircle, Check, X } from 'lucide-react'

export function StockClient({ products }: { products: Product[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [cost, setCost] = useState('')
  const [stock, setStock] = useState('')
  const [isPending, startTransition] = useTransition()

  const formatBRL = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  const openNew = () => {
    setEditing(null)
    setName('')
    setPrice('')
    setCost('')
    setStock('10')
    setIsOpen(true)
  }

  const openEdit = (p: Product) => {
    setEditing(p)
    setName(p.name)
    setPrice(String(p.price))
    setCost(String(p.cost))
    setStock(String(p.stock))
    setIsOpen(true)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      await upsertProduct({
        id: editing?.id,
        name,
        price: parseFloat(price.replace(',', '.')) || 0,
        cost: parseFloat(cost.replace(',', '.')) || 0,
        stock: parseInt(stock, 10) || 0,
      })
      setIsOpen(false)
    })
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteProduct(id)
      setConfirmDeleteId(null)
    })
  }

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Estoque</h1>
          <p className="text-xs font-medium text-slate-500">
            {products.length} produtos cadastrados
          </p>
        </div>
        <Button
          onClick={openNew}
          className="h-12 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
        >
          <Plus className="w-5 h-5 mr-1.5" />
          Novo Produto
        </Button>
      </header>

      <div className="space-y-2.5">
        {products.map((product) => {
          const isLowStock = product.stock < 5
          const isConfirming = confirmDeleteId === product.id

          return (
            <div
              key={product.id}
              className={`bg-white rounded-xl p-3.5 border-2 flex items-center justify-between gap-2 ${
                isLowStock ? 'border-red-300 bg-red-50/30' : 'border-slate-200'
              }`}
            >
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-900 text-base truncate">
                    {product.name}
                  </span>
                  {isLowStock && (
                    <Badge variant="destructive" className="text-xs font-bold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Estoque Baixo ({product.stock})
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-600 font-medium">
                  <span>
                    Venda: <strong className="text-emerald-700">{formatBRL(product.price)}</strong>
                  </span>
                  <span>Custo: {formatBRL(product.cost)}</span>
                  {!isLowStock && <span>Qtd: {product.stock}</span>}
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {isConfirming ? (
                  <>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={isPending}
                      className="h-10 px-3 rounded-lg font-bold"
                      onClick={() => handleDelete(product.id)}
                    >
                      <Check className="w-4 h-4 mr-1" /> Excluir
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 rounded-lg border-2"
                      onClick={() => setConfirmDeleteId(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 rounded-lg border-2"
                      onClick={() => openEdit(product)}
                    >
                      <Edit2 className="w-4 h-4 text-slate-700" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 rounded-lg border-2 border-red-200 hover:bg-red-50"
                      onClick={() => setConfirmDeleteId(product.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-sm rounded-2xl p-5">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">
              {editing ? 'Editar Produto' : 'Novo Produto'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="text-xs font-bold uppercase text-slate-600">Nome do Produto</label>
              <Input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Coca-Cola 2L"
                className="h-12 text-base mt-1 border-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold uppercase text-slate-600">
                  Preço Venda (R$)
                </label>
                <Input
                  required
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="12.00"
                  className="h-12 text-base mt-1 border-2"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-slate-600">
                  Preço Custo (R$)
                </label>
                <Input
                  required
                  type="number"
                  step="0.01"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="8.50"
                  className="h-12 text-base mt-1 border-2"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-slate-600">
                Quantidade em Estoque
              </label>
              <Input
                required
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="h-12 text-base mt-1 border-2"
              />
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base rounded-xl mt-2"
            >
              {isPending ? 'Salvando...' : 'Salvar Produto'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
