'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useEffect, useMemo, useRef, useState } from 'react'
import { 
  FileText, 
  Image, 
  Bell, 
  Users, 
  TrendingUp, 
  Clock,
  Plus,
  ArrowRight, // Changed from Eye for better UX
  Upload
} from 'lucide-react'

// Helper to get different colors for activity icons
const getActivityIconStyle = (type: string) => {
  switch (type) {
    case 'upload':
      return "bg-blue-100 text-[#2a358c]";
    case 'notice':
      return "bg-yellow-100 text-yellow-600";
    case 'image':
      return "bg-purple-100 text-purple-600";
    case 'student':
      return "bg-green-100 text-green-600";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

type DashboardStat = {
  title: string
  value: string
  change: string
  icon: any
  color: string
  bgColor: string
}

type RecentActivityItem = {
  id: string
  type: 'upload' | 'notice' | 'image'
  title: string
  description: string
  time: string
  icon: any
}

type Material = {
  _id?: string
  fileName?: string
  fileURL?: string
  contentType?: string
  fileCategory?: string
  uploadDate?: string | Date
  category?: string
}

type Notice = {
  _id?: string
  title?: string
  content?: string
  category?: string
  status?: string
  createdAt?: string | Date
}

function safeParseDate(input?: string | Date): Date | null {
  if (!input) return null
  const d = input instanceof Date ? input : new Date(input)
  return Number.isNaN(d.getTime()) ? null : d
}

function timeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime()
  const diffSec = Math.max(0, Math.floor(diffMs / 1000))
  const minutes = Math.floor(diffSec / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  if (hours < 24) return `${hours} hours ago`
  return `${days} days ago`
}

import { useSession } from 'next-auth/react'

export function DashboardOverview() {
  const { data: session, status } = useSession()
  const teacherEmail = session?.user?.email || ''
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
  const POLL_MS = 10_000

  const [materials, setMaterials] = useState<Material[]>([])
  const [notices, setNotices] = useState<Notice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const prevCountsRef = useRef<{ materials: number; images: number; notices: number } | null>(null)

  const fetchDashboardData = async (signal?: AbortSignal, emailToUse?: string) => {
    const targetEmail = emailToUse || teacherEmail
    if (!targetEmail) {
      setMaterials([])
      setNotices([])
      return
    }

    const matUrl = `${BACKEND_URL}/materials?teacherEmail=${encodeURIComponent(targetEmail)}`
    const notUrl = `${BACKEND_URL}/notices?teacherEmail=${encodeURIComponent(targetEmail)}`

    const [materialsRes, noticesRes] = await Promise.all([
      fetch(matUrl, { signal }),
      fetch(notUrl, { signal }),
    ])

    if (!materialsRes.ok) {
      const raw = await materialsRes.text()
      throw new Error(`Failed to fetch materials (${materialsRes.status}): ${raw}`)
    }
    if (!noticesRes.ok) {
      const raw = await noticesRes.text()
      throw new Error(`Failed to fetch notices (${noticesRes.status}): ${raw}`)
    }

    const [materialsJson, noticesJson] = await Promise.all([
      materialsRes.json(),
      noticesRes.json(),
    ])

    setMaterials(Array.isArray(materialsJson) ? materialsJson : [])
    setNotices(Array.isArray(noticesJson) ? noticesJson : [])
  }

  useEffect(() => {
    if (status === 'loading') return
    if (!teacherEmail) {
      setIsLoading(false)
      setMaterials([])
      setNotices([])
      return
    }

    let intervalId: number | null = null
    const controller = new AbortController()

    const run = async () => {
      try {
        setError(null)
        await fetchDashboardData(controller.signal, teacherEmail)
      } catch (e: any) {
        if (e?.name === 'AbortError') return
        setError(e?.message || 'Failed to load dashboard data')
      } finally {
        setIsLoading(false)
      }
    }

    run()
    intervalId = window.setInterval(run, POLL_MS)

    return () => {
      controller.abort()
      if (intervalId) window.clearInterval(intervalId)
    }
  }, [teacherEmail, status])

  const derivedCounts = useMemo(() => {
    const totalMaterials = materials.length
    const imagesUploaded = materials.filter(m => {
      const contentType = (m.contentType || '').toLowerCase()
      const fileCategory = (m.fileCategory || '').toLowerCase()
      return fileCategory === 'image' || contentType.startsWith('image/')
    }).length
    const activeNotices = notices.filter(n => (n.status || '').toLowerCase() === 'published').length
    return {
      totalMaterials,
      imagesUploaded,
      activeNotices: activeNotices > 0 ? activeNotices : notices.length,
    }
  }, [materials, notices])

  const changeFromPrev = (prev: number, next: number) => {
    if (prev === 0 && next === 0) return '0%'
    if (prev === 0) return '+100%'
    const pct = Math.round(((next - prev) / prev) * 100)
    return `${pct >= 0 ? '+' : ''}${pct}%`
  }

  const stats: DashboardStat[] = useMemo(() => {
    const prev = prevCountsRef.current
    const nextCounts = {
      materials: derivedCounts.totalMaterials,
      images: derivedCounts.imagesUploaded,
      notices: derivedCounts.activeNotices,
    }

    const materialsChange = prev ? changeFromPrev(prev.materials, nextCounts.materials) : '—'
    const imagesChange = prev ? changeFromPrev(prev.images, nextCounts.images) : '—'
    const noticesChange = prev ? changeFromPrev(prev.notices, nextCounts.notices) : '—'

    prevCountsRef.current = nextCounts

    return [
      {
        title: 'Total Materials',
        value: isLoading ? '…' : String(derivedCounts.totalMaterials),
        change: materialsChange,
        icon: FileText,
        color: 'text-blue-500',
        bgColor: 'bg-blue-50',
      },
      {
        title: 'Images Uploaded',
        value: isLoading ? '…' : String(derivedCounts.imagesUploaded),
        change: imagesChange,
        icon: Image,
        color: 'text-purple-500',
        bgColor: 'bg-purple-50',
      },
      {
        title: 'Active Notices',
        value: isLoading ? '…' : String(derivedCounts.activeNotices),
        change: noticesChange,
        icon: Bell,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-50',
      },
      {
        title: 'Students',
        value: '—',
        change: '—',
        icon: Users,
        color: 'text-green-500',
        bgColor: 'bg-green-50',
      },
    ]
  }, [derivedCounts, isLoading])

  const recentActivity: RecentActivityItem[] = useMemo(() => {
    const newestMaterials = [...materials]
      .sort((a, b) => {
        const ad = safeParseDate(a.uploadDate)?.getTime() || 0
        const bd = safeParseDate(b.uploadDate)?.getTime() || 0
        return bd - ad
      })
      .slice(0, 4)
      .map((m): RecentActivityItem => {
        const isImage = (m.fileCategory || '').toLowerCase() === 'image' || (m.contentType || '').toLowerCase().startsWith('image/')
        const when = safeParseDate(m.uploadDate)
        return {
          id: `material-${m._id || m.fileURL || m.fileName || Math.random().toString(36).slice(2)}`,
          type: isImage ? 'image' : 'upload',
          title: m.fileName || (isImage ? 'New image uploaded' : 'New material uploaded'),
          description: isImage ? 'Uploaded a new image' : 'Uploaded new study material',
          time: when ? timeAgo(when) : 'recently',
          icon: isImage ? Image : FileText,
        }
      })

    const newestNotices = [...notices]
      .sort((a, b) => {
        const ad = safeParseDate(a.createdAt)?.getTime() || 0
        const bd = safeParseDate(b.createdAt)?.getTime() || 0
        return bd - ad
      })
      .slice(0, 4)
      .map((n): RecentActivityItem => {
        const when = safeParseDate(n.createdAt)
        return {
          id: `notice-${n._id || n.title || Math.random().toString(36).slice(2)}`,
          type: 'notice',
          title: n.title || 'New notice',
          description: (n.status || '').toLowerCase() === 'published' ? 'Published a notice' : 'Created a notice',
          time: when ? timeAgo(when) : 'recently',
          icon: Bell,
        }
      })

    return [...newestNotices, ...newestMaterials]
      .sort((a, b) => {
        // Sort by relative time is lossy; instead keep notices before materials and rely on upstream sorts.
        return 0
      })
      .slice(0, 4)
  }, [materials, notices])

  return (
    <div className="space-y-8 bg-slate-50 p-6 sm:p-8 rounded-lg">
      {/* Enhanced Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#2a358c]">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back! Here's a summary of your portal's activity.</p>
        </div>
        <Button size="lg" className="bg-[#2a358c] hover:bg-[#3a4a9f] text-white shadow-md transition-transform hover:scale-105">
          <Upload className="w-5 h-5 mr-2" />
          Quick Upload
        </Button>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6 flex items-center space-x-4">
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                  <p className="text-2xl font-bold text-[#2a358c]">{stat.value}</p>
                  <div className={`flex items-center text-xs mt-1 ${stat.change.startsWith('-') ? 'text-red-600' : 'text-green-600'}`}>
                    <TrendingUp className="h-3 w-3 mr-1" />
                    <span>{stat.change} since last refresh</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent Activity and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Enhanced Recent Activity */}
        <div className="lg:col-span-2">
          <Card className="bg-white rounded-xl shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center text-[#2a358c]">
                <Clock className="w-6 h-6 mr-3" />
                <span className="text-xl">Recent Activity</span>
              </CardTitle>
              <CardDescription>
                Latest updates and activities from your portal
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  Live data error: {error}
                </div>
              )}
              <div className="space-y-2">
                {recentActivity.map((activity) => {
                  const Icon = activity.icon
                  return (
                    <div key={activity.id} className="group flex items-center space-x-4 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getActivityIconStyle(activity.type)}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{activity.title}</p>
                        <p className="text-sm text-gray-500">{activity.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">{activity.time}</p>
                        <ArrowRight className="w-4 h-4 text-gray-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Quick Actions */}
        <div>
          <Card className="bg-white rounded-xl shadow-md h-full">
            <CardHeader>
              <CardTitle className="text-[#2a358c] text-xl">Quick Actions</CardTitle>
              <CardDescription>
                Common tasks and shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-center">
              {[
                { label: 'Upload PDF', icon: FileText },
                { label: 'Add Image', icon: Image },
                { label: 'New Notice', icon: Bell },
                { label: 'Add Student', icon: Users }
              ].map((action) => {
                const ActionIcon = action.icon;
                return (
                  <Button key={action.label} variant="outline" className="h-24 flex flex-col items-center justify-center space-y-2 text-gray-600 hover:bg-[#2a358c]/5 hover:text-[#2a358c] transition-colors">
                    <ActionIcon className="w-6 h-6" />
                    <span className="text-xs font-medium">{action.label}</span>
                  </Button>
                )
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}