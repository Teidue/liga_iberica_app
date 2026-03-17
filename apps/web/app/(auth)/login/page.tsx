'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Eye, EyeOff, Loader2, Trophy } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { LoginScene } from '@/components/login-scene'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import api from '@/lib/api'
import { isAxiosError } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-context'
import type { AuthUser } from '@/contexts/auth-context'

const loginSchema = z.object({
  email: z.string().min(1, 'Requerido').email('Correo inválido'),
  password: z.string().min(1, 'Requerido').min(6, 'Mínimo 6 caracteres'),
})

type LoginFormValues = z.infer<typeof loginSchema>

interface LoginResponse {
  access_token: string
  user: AuthUser
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const { isSubmitting } = form.formState

  async function onSubmit(values: LoginFormValues) {
    try {
      const { data } = await api.post<LoginResponse>('/auth/login', values)
      login(data.access_token, data.user)
      toast.success(`Bienvenido, ${data.user.nombre}`)
      const dest = data.user.rol === 'SUPER_ADMIN' ? '/admin' : '/team'
      router.push(dest)
    } catch (err) {
      if (isAxiosError(err)) {
        const msg =
          (err.response?.data as { message?: string })?.message ??
          'Credenciales incorrectas. Intenta de nuevo.'
        toast.error(msg)
      } else {
        toast.error('Error al conectar con el servidor.')
      }
    }
  }

  return (
    <div className="flex min-h-screen">

      {/* ── Left panel: 3D scene ── */}
      <div className="relative hidden h-screen lg:flex lg:w-3/5 overflow-hidden bg-linear-to-br from-brand-darkest via-brand-dark to-slate-900">

        {/* Three.js canvas fills the whole panel */}
        <LoginScene />

        {/* Title overlay — top */}
        <div className="absolute inset-x-0 top-10 z-10 flex flex-col items-center gap-2 text-center px-8 pointer-events-none">
          <h1 className="text-5xl font-extrabold tracking-tight text-white drop-shadow-lg">
            Liga Ibérica
          </h1>
          <p className="text-lg text-slate-300">Portal de Gestión de Torneos</p>
        </div>

        {/* Version — bottom */}
        <p className="absolute inset-x-0 bottom-6 z-10 text-center text-xs text-slate-500 pointer-events-none">
          v1.0 · Fútbol Sala · 2025
        </p>
      </div>

      {/* ── Right panel: login form ── */}
      <div className="flex w-full flex-col items-center justify-center bg-slate-50 px-6 py-12 lg:w-2/5">

        {/* Mobile header (hidden on lg+) */}
        <div className="mb-8 flex flex-col items-center gap-3 lg:hidden">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand ring-2 ring-brand/30">
            <Trophy className="h-7 w-7 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-800">Liga Ibérica</span>
        </div>

        <Card className="w-full max-w-sm shadow-lg">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold text-slate-900">
              Bienvenido de vuelta
            </CardTitle>
            <CardDescription className="text-slate-500">
              Inicia sesión en tu cuenta
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                {/* Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo electrónico</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="tu@correo.com"
                          autoComplete="email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Password */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            autoComplete="current-password"
                            className="pr-10"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600"
                            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Iniciando sesión…
                    </>
                  ) : (
                    'Iniciar Sesión'
                  )}
                </Button>

              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
