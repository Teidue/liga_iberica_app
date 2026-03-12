'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil, Trash2, MapPin, FileSpreadsheet } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/confirm-dialog'
import api from '@/lib/api'
import { extractApiError } from '@/lib/utils'
import type { Club } from '@/lib/types'

type ClubDetail = Club & { matchDaysCount?: number; upcomingMatchDaysCount?: number }

type ExcelColumn = { name: string; header: string; width?: number; type?: string }
type ExcelFormat = { sheetName?: string; title?: string; columns: ExcelColumn[] }

export default function ClubDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [club, setClub] = useState<ClubDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    api.get<ClubDetail>(`/clubs/${id}`)
      .then(r => setClub(r.data))
      .catch(() => { toast.error('Sede no encontrada'); router.push('/admin/clubes') })
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function handleDelete() {
    setDeleting(true)
    try {
      await api.delete(`/clubs/${id}`)
      toast.success('Sede eliminada')
      router.push('/admin/clubes')
    } catch (err) {
      toast.error(extractApiError(err, 'Error al eliminar'))
      setConfirmDelete(false)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (!club) return null

  const excelFormat = club.formatoExcel as ExcelFormat | null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/clubes"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{club.nombre}</h1>
            {club.direccion && (
              <p className="flex items-center gap-1 text-sm text-slate-500">
                <MapPin className="h-3 w-3" />{club.direccion}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/admin/clubes/${id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />Editar
            </Link>
          </Button>
          <Button variant="outline" className="text-red-600 hover:text-red-700" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">Total jornadas</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{club.matchDaysCount ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">Próximas jornadas</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{club.upcomingMatchDaysCount ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <FileSpreadsheet className="h-4 w-4" />
            Formato Excel
          </CardTitle>
          <Badge variant={excelFormat ? 'default' : 'outline'}>
            {excelFormat ? 'Configurado' : 'Sin configurar'}
          </Badge>
        </CardHeader>
        <CardContent>
          {!excelFormat ? (
            <p className="text-sm text-slate-400">No hay formato Excel configurado para esta sede. Edita la sede para añadirlo.</p>
          ) : (
            <div className="space-y-4">
              {excelFormat.title && <p className="text-sm font-medium text-slate-700">Título: {excelFormat.title}</p>}
              {excelFormat.sheetName && <p className="text-sm text-slate-500">Hoja: {excelFormat.sheetName}</p>}
              <div className="overflow-hidden rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-slate-600">Campo</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-600">Cabecera</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-600">Ancho</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {excelFormat.columns.map((col, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 font-mono text-xs text-slate-600">{col.name}</td>
                        <td className="px-3 py-2 text-slate-900">{col.header}</td>
                        <td className="px-3 py-2 text-slate-500">{col.width ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="¿Eliminar sede?"
        description={<>Se eliminará <strong>{club.nombre}</strong>. No se puede eliminar si tiene jornadas asociadas.</>}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
