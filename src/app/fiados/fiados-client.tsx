'use client'

import { useState, useTransition } from 'react'
import {
  upsertCustomer,
  deleteCustomer,
  settleCustomerDebt,
} from '@/app/actions/pos-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { UserPlus, Check, Edit2, Trash2, Phone, X } from 'lucide-react'

interface CustomerSummary {
  id: string
  name: string
  phone: string
  openSalesCount: number
  totalDebt: number
}

export function FiadosClient({ customers }: { customers: CustomerSummary[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [editing, setEditing] = useState<CustomerSummary | null>(null)
  const [confirmSettleId, setConfirmSettleId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [isPending, startTransition] = useTransition()

  const formatBRL = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  const openNew = () => {
    setEditing(null)
    setName('')
    setPhone('')
    setIsOpen(true)
  }

  const openEdit = (c: CustomerSummary) => {
    setEditing(c)
    setName(c.name)
    setPhone(c.phone)
    setIsOpen(true)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      await upsertCustomer({ id: editing?.id, name, phone })
      setIsOpen(false)
    })
  }

  const handleSettle = (customerId: string) => {
    startTransition(async () => {
      await settleCustomerDebt(customerId)
      setConfirmSettleId(null)
    })
  }

  const handleDelete = (customerId: string) => {
    startTransition(async () => {
      await deleteCustomer(customerId)
      setConfirmDeleteId(null)
    })
  }

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Fiados & Clientes</h1>
          <p className="text-xs font-medium text-slate-500">
            Controle de contas a receber
          </p>
        </div>
        <Button
          onClick={openNew}
          className="h-12 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
        >
          <UserPlus className="w-5 h-5 mr-1.5" />
          Novo Cliente
        </Button>
      </header>

      <div className="space-y-3">
        {customers.map((customer) => {
          const hasDebt = customer.totalDebt > 0
          const isConfirmingSettle = confirmSettleId === customer.id
          const isConfirmingDelete = confirmDeleteId === customer.id

          return (
            <div
              key={customer.id}
              className={`bg-white rounded-xl p-4 border-2 space-y-3 ${
                hasDebt ? 'border-amber-400 bg-amber-50/30' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{customer.name}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3" /> {customer.phone || 'Sem telefone'}
                  </p>
                </div>

                <div className="text-right">
                  {hasDebt ? (
                    <>
                      <p className="text-xs font-bold uppercase text-amber-800">Deve</p>
                      <p className="text-xl font-black text-red-600">
                        {formatBRL(customer.totalDebt)}
                      </p>
                    </>
                  ) : (
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 font-bold">
                      Em dia
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200/70 gap-2">
                <div className="flex items-center gap-1.5">
                  {isConfirmingDelete ? (
                    <>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={isPending}
                        className="h-10 px-3 rounded-lg font-bold"
                        onClick={() => handleDelete(customer.id)}
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
                        onClick={() => openEdit(customer)}
                      >
                        <Edit2 className="w-4 h-4 text-slate-700" />
                      </Button>
                      {!hasDebt && (
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 rounded-lg border-2 border-red-200"
                          onClick={() => setConfirmDeleteId(customer.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      )}
                    </>
                  )}
                </div>

                {hasDebt && (
                  <div className="flex items-center gap-1.5 flex-1 justify-end">
                    {isConfirmingSettle ? (
                      <>
                        <Button
                          disabled={isPending}
                          onClick={() => handleSettle(customer.id)}
                          className="h-11 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-black rounded-xl"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Confirmar Baixa
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-11 w-11 rounded-xl border-2"
                          onClick={() => setConfirmSettleId(null)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        disabled={isPending}
                        onClick={() => setConfirmSettleId(customer.id)}
                        className="h-11 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl flex-1 max-w-[200px]"
                      >
                        <Check className="w-4 h-4 mr-1.5" />
                        Dar Baixa
                      </Button>
                    )}
                  </div>
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
              {editing ? 'Editar Cliente' : 'Novo Cliente'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="text-xs font-bold uppercase text-slate-600">Nome Completo</label>
              <Input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: João da Silva"
                className="h-12 text-base mt-1 border-2"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-slate-600">
                WhatsApp / Telefone
              </label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 99999-9999"
                className="h-12 text-base mt-1 border-2"
              />
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base rounded-xl mt-2"
            >
              {isPending ? 'Salvando...' : 'Salvar Cliente'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
