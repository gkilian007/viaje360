"use client"

import { useState } from "react"
import { createClient, isSupabaseBrowserConfigured } from "@/lib/supabase/client"
import { motion } from "framer-motion"

type AuthMode = "login" | "register"

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)

    if (!isSupabaseBrowserConfigured()) {
      setError("Supabase no está configurado.")
      return
    }

    setLoading(true)
    const supabase = createClient()

    try {
      if (mode === "register") {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
          },
        })
        if (signUpError) throw signUpError
        setSuccessMsg("¡Cuenta creada! Revisa tu email para confirmar.")
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (signInError) throw signInError
        window.location.href = "/home"
      }
    } catch (err: any) {
      setError(err.message ?? "Error de autenticación")
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleLogin() {
    if (!isSupabaseBrowserConfigured()) {
      setError("Supabase no está configurado.")
      return
    }
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) setError(error.message)
  }

  async function handleAppleLogin() {
    if (!isSupabaseBrowserConfigured()) {
      setError("Supabase no está configurado.")
      return
    }
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) setError(error.message)
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: "linear-gradient(180deg, #0f1117 0%, #1a1a2e 100%)" }}
    >
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 text-center"
      >
        <div
          className="w-20 h-20 mx-auto mb-4 flex items-center justify-center"
        >
          <img src="/logo.svg" alt="Viaje360" className="w-16 h-16"/>
        </div>
        <h1 className="text-[28px] font-bold text-white">Viaje360</h1>
        <p className="text-[14px] text-[#9ca3af] mt-1">Tu compañero de viaje inteligente</p>
      </motion.div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-sm rounded-3xl p-6"
        style={{
          background: "rgba(28,28,30,0.95)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
        }}
      >
        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl mb-6" style={{ background: "rgba(31,31,33,0.8)" }}>
          {(["login", "register"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(null); setSuccessMsg(null) }}
              className={`flex-1 py-2.5 rounded-lg text-[13px] font-semibold transition-all ${
                mode === m
                  ? "bg-[#0A84FF] text-white"
                  : "text-[#9ca3af] hover:text-white"
              }`}
            >
              {m === "login" ? "Iniciar sesión" : "Registrarse"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div>
              <label className="text-[12px] text-[#9ca3af] mb-1.5 block">Nombre</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                className="w-full px-4 py-3 rounded-xl text-[14px] text-white placeholder-[#666] outline-none focus:ring-2 focus:ring-[#0A84FF]/50"
                style={{ background: "rgba(42,42,44,0.8)", border: "1px solid rgba(255,255,255,0.08)" }}
              />
            </div>
          )}

          <div>
            <label className="text-[12px] text-[#9ca3af] mb-1.5 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              className="w-full px-4 py-3 rounded-xl text-[14px] text-white placeholder-[#666] outline-none focus:ring-2 focus:ring-[#0A84FF]/50"
              style={{ background: "rgba(42,42,44,0.8)", border: "1px solid rgba(255,255,255,0.08)" }}
            />
          </div>

          <div>
            <label className="text-[12px] text-[#9ca3af] mb-1.5 block">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-xl text-[14px] text-white placeholder-[#666] outline-none focus:ring-2 focus:ring-[#0A84FF]/50"
              style={{ background: "rgba(42,42,44,0.8)", border: "1px solid rgba(255,255,255,0.08)" }}
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl text-[12px] text-[#FF453A]" style={{ background: "rgba(255,69,58,0.1)" }}>
              {error}
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl text-[12px] text-[#30D158]" style={{ background: "rgba(48,209,88,0.1)" }}>
              {successMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-semibold text-white transition-all disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #0A84FF, #5856D6)" }}
          >
            {loading
              ? "Cargando…"
              : mode === "login"
              ? "Entrar"
              : "Crear cuenta"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-[11px] text-[#666]">o continúa con</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Social logins */}
        <div className="flex flex-col gap-2.5">
          {/* Google */}
          <button
            onClick={handleGoogleLogin}
            className="w-full py-3 rounded-xl font-medium text-white flex items-center justify-center gap-3 transition-all hover:brightness-110"
            style={{ background: "rgba(42,42,44,0.8)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continuar con Google
          </button>

          {/* Apple */}
          <button
            onClick={handleAppleLogin}
            className="w-full py-3 rounded-xl font-medium text-white flex items-center justify-center gap-3 transition-all hover:brightness-110"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.31.07 2.21.73 2.98.73.8 0 2.3-.9 3.87-.77 1.49.12 2.61.7 3.33 1.79-3.05 1.83-2.54 5.86.53 7.02-.65 1.64-1.5 3.26-2.71 4.11zM12.03 7.25c-.12-2.11 1.64-3.87 3.6-4 .26 2.26-1.97 4.07-3.6 4z" />
            </svg>
            Continuar con Apple
          </button>
        </div>
      </motion.div>

      <p className="text-[11px] text-[#666] mt-8 text-center">
        Al continuar, aceptas nuestros términos de servicio.
      </p>
    </div>
  )
}
