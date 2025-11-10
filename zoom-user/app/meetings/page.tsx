"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import MeetingCard from "@/components/meeting-card"
import { Spinner } from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Meeting {
  _id: string
  meetingId: string
  topic: string
  startTime: string
  duration: number
  joinUrl: string
  hostId: string
  visibility: string
  createdAt: string
  updatedAt: string
}

export default function MeetingsPage() {
  const router = useRouter()
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [filteredMeetings, setFilteredMeetings] = useState<Meeting[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("all")

  const getToken = useCallback(() => {
    return document.cookie
      .split("; ")
      .find((row) => row.startsWith("auth_token="))
      ?.split("=")[1]
  }, [])

  const fetchMeetings = useCallback(async () => {
    const token = getToken()
    if (!token) {
      router.push("/")
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch("http://localhost:3000/zoom/meetings", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store"
      })
      if (!res.ok) throw new Error("Failed to fetch meetings")
      const data = await res.json()
      const sorted = data.sort((a: Meeting, b: Meeting) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      setMeetings(sorted)
      setFilteredMeetings(sorted)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [router, getToken])

  useEffect(() => {
    fetchMeetings()
  }, [fetchMeetings])

  useEffect(() => {
    let filtered = meetings
    const now = Date.now()

    if (filter === "upcoming") filtered = filtered.filter(m => new Date(m.startTime).getTime() + m.duration * 60000 > now)
    if (filter === "past") filtered = filtered.filter(m => new Date(m.startTime).getTime() + m.duration * 60000 <= now)
    if (searchQuery.trim()) filtered = filtered.filter(m => m.topic.toLowerCase().includes(searchQuery.toLowerCase()) || m.meetingId.includes(searchQuery))
    setFilteredMeetings(filtered)
  }, [meetings, filter, searchQuery])

  const handleLogout = () => {
    document.cookie = "auth_token=; path=/; max-age=0"
    router.push("/")
  }

  if (isLoading) {
    return (
      <main className="min-h-screen flex justify-center items-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="h-8 w-8 text-primary" />
          <p className="text-muted-foreground text-sm">Loading meetings...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-foreground mb-1">My Meetings</h1>
            <p className="text-sm text-muted-foreground">
              {filteredMeetings.length} {filteredMeetings.length === 1 ? "meeting" : "meetings"}
            </p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            Logout
          </Button>
        </div>

        <div className="mb-6">
          <Input
            placeholder="Search meetings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>

        {filteredMeetings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No meetings found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMeetings.map(meeting => (
              <MeetingCard key={meeting._id} meeting={meeting} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}


