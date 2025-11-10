"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  useEffect(() => {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("auth_token="))
      ?.split("=")[1]

    if (token) {
      fetch("http://localhost:3000/zoom/meetings", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (res.ok) router.push("/meetings")
          else {
            document.cookie = "auth_token=; path=/; max-age=0"
            setIsCheckingAuth(false)
          }
        })
        .catch(() => setIsCheckingAuth(false))
    } else {
      setIsCheckingAuth(false)
    }
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const res = await fetch("http://localhost:3000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Login failed")
      if (!data.token) throw new Error("No authentication token received")

      const isSecure = window.location.protocol === "https:"
      document.cookie = `auth_token=${data.token}; path=/; max-age=86400; samesite=strict${isSecure ? "; secure" : ""}`
      await new Promise((r) => setTimeout(r, 100))
      router.push("/meetings")
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  if (isCheckingAuth) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="h-8 w-8 text-primary" />
          <p className="text-muted-foreground text-sm">Checking authentication...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <form onSubmit={handleLogin} className="w-full max-w-md">
        <div className="bg-card border border-border rounded-lg shadow-sm p-8">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-semibold text-card-foreground mb-2">Zoom Meetings</h1>
            <p className="text-sm text-muted-foreground">Sign in to access your meetings</p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-800 rounded text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Input
                placeholder="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full"
              />
            </div>
            <div>
              <Input
                placeholder="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full"
              />
            </div>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full mt-6">
            {isLoading ? (
              <>
                <Spinner className="h-4 w-4 mr-2" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </div>
      </form>
    </main>
  )
}



