'use client'

import { useEffect, useMemo, useState, type Key } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Bell, Plus, Edit, Trash2, Send, Calendar, Save, Loader2 } from 'lucide-react'

type NoticeStatus = 'draft' | 'published' | 'archived'

type NoticePriority = 'low' | 'medium' | 'high'

type NoticeCategory = 'general' | 'exam' | 'assignment' | 'event' | 'reminder'

interface Notice {
  _id: Key
  title: string
  content: string
  category: NoticeCategory | string
  priority: NoticePriority | string
  status: NoticeStatus | string
  publishDate?: string | null
  createdAt?: string
  teacherEmail?: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

async function readJsonOrText(res: Response) {
  const raw = await res.text().catch(() => '')
  try {
    return { raw, json: raw ? JSON.parse(raw) : null }
  } catch {
    return { raw, json: null }
  }
}

export function NoticesSection() {
  const { data: session, status } = useSession()
  const teacherEmail = session?.user?.email || ''
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
  const NOTICE_WEBHOOK_URL = 'https://tkb32.app.n8n.cloud/webhook/notice-upload'

  const [notices, setNotices] = useState<Notice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [selectedStatus, setSelectedStatus] = useState<'all' | NoticeStatus>('all')
  const [view, setView] = useState<'list' | 'form'>('list')
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null)
  const [formData, setFormData] = useState<{
    title: string
    content: string
    category: NoticeCategory
    priority: NoticePriority
  }>({ title: '', content: '', category: 'general', priority: 'medium' })

  const categories: NoticeCategory[] = ['general', 'exam', 'assignment', 'event', 'reminder']
  const priorities: NoticePriority[] = ['low', 'medium', 'high']
  const statuses: Array<'all' | NoticeStatus> = ['all', 'draft', 'published', 'archived']

  const filteredNotices = useMemo(
    () => notices.filter(n => selectedStatus === 'all' || n.status === selectedStatus),
    [notices, selectedStatus]
  )

  const fetchNotices = async (emailToUse?: string) => {
    const targetEmail = emailToUse || teacherEmail
    if (!targetEmail) {
      setIsLoading(false)
      setNotices([])
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    const controller = new AbortController()
    const timeoutMs = process.env.NODE_ENV === 'development' ? 10_000 : 30_000
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs)

    try {
      const url = `${BACKEND_URL}/notices?teacherEmail=${encodeURIComponent(targetEmail)}`
      const res = await fetch(url, { signal: controller.signal })
      const { raw, json } = await readJsonOrText(res)
      if (!res.ok) {
        throw new Error(`Failed to fetch notices (${res.status}): ${raw || res.statusText}`)
      }
      if (!Array.isArray(json)) {
        throw new Error('Backend returned unexpected notices payload (expected array)')
      }
      setNotices(json as Notice[])
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch notices')
      setNotices([])
    } finally {
      window.clearTimeout(timeoutId)
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'loading') return
    if (teacherEmail) {
      fetchNotices(teacherEmail)
    } else {
      setIsLoading(false)
      setNotices([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [BACKEND_URL, teacherEmail, status])

  const handleFormChange = (field: 'title' | 'content' | 'category' | 'priority', value: string) => {
    setFormData(p => ({ ...p, [field]: value }))
  }

  const handleAddNew = () => {
    setEditingNotice(null)
    setFormData({ title: '', content: '', category: 'general', priority: 'medium' })
    setError(null)
    setSuccess(null)
    setView('form')
  }

  const handleEdit = (notice: Notice) => {
    setEditingNotice(notice)
    setFormData({
      title: notice.title || '',
      content: notice.content || '',
      category: (notice.category as NoticeCategory) || 'general',
      priority: (notice.priority as NoticePriority) || 'medium',
    })
    setError(null)
    setSuccess(null)
    setView('form')
  }

  const triggerNoticePublishWebhook = async (notice: Notice) => {
    try {
      const payload = {
        event: 'notice_published',
        noticeId: String(notice._id),
        title: notice.title,
        category: notice.category,
        priority: notice.priority,
        status: notice.status,
        publishDate: notice.publishDate || new Date().toISOString(),
        triggeredAt: new Date().toISOString(),
      }

      const res = await fetch(NOTICE_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const raw = await res.text().catch(() => '')
        console.error('Notice publish webhook failed:', NOTICE_WEBHOOK_URL, res.status, raw)
      }
    } catch (e) {
      console.error('Notice publish webhook error:', e)
    }
  }

  const handleFormSubmit = async () => {
    if (isSubmitting) return

    const title = formData.title.trim()
    const content = formData.content.trim()
    if (!title || !content) {
      setError('Title and content are required.')
      return
    }

    setIsSubmitting(true)
    setError(null)
    setSuccess(null)
    setSuccess(null)

    try {
      if (editingNotice?._id) {
        const res = await fetch(`${BACKEND_URL}/notices/${String(editingNotice._id)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            content,
            category: formData.category,
            priority: formData.priority,
            // Keep existing status unless backend requires one. (Backend updates status only if provided.)
          }),
        })

        const { raw, json } = await readJsonOrText(res)
        if (!res.ok) {
          throw new Error(`Failed to update notice (${res.status}): ${raw || res.statusText}`)
        }

        const updated = isRecord(json) ? (json.notice as Notice | undefined) : undefined
        if (!updated || !updated._id) {
          // Fallback: refresh list if backend payload changes.
          await fetchNotices()
        } else {
          setNotices(prev => prev.map(n => (String(n._id) === String(updated._id) ? updated : n)))
        }

        setView('list')
        setEditingNotice(null)
        setSuccess('Notice updated successfully.')
      } else {
        const res = await fetch(`${BACKEND_URL}/notices`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            content,
            category: formData.category,
            priority: formData.priority,
            status: 'draft',
            teacherEmail: teacherEmail || '',
          }),
        })

        const { raw, json } = await readJsonOrText(res)
        if (!res.ok) {
          throw new Error(`Failed to create notice (${res.status}): ${raw || res.statusText}`)
        }

        const created = isRecord(json) ? (json.newNotice as Notice | undefined) : undefined
        if (created && created._id) {
          setNotices(prev => [created, ...prev])
        } else {
          await fetchNotices()
        }

        setView('list')
        setSuccess('Notice saved as draft.')
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to save notice')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePublishNotice = async (id: string) => {
    if (isSubmitting) return

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch(`${BACKEND_URL}/notices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'published' }),
      })

      const { raw, json } = await readJsonOrText(res)
      if (!res.ok) {
        throw new Error(`Failed to publish notice (${res.status}): ${raw || res.statusText}`)
      }

      const updated = isRecord(json) ? (json.notice as Notice | undefined) : undefined
      if (updated && updated._id) {
        setNotices(prev => prev.map(n => (String(n._id) === String(updated._id) ? updated : n)))
        if (String(updated.status).toLowerCase() === 'published') {
          await triggerNoticePublishWebhook(updated)
          setSuccess('Notice published successfully!')
        }
      } else {
        await fetchNotices()
        setSuccess('Notice published successfully!')
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to publish notice')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteNotice = async (id: string) => {
    if (isSubmitting) return

    setIsSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`${BACKEND_URL}/notices/${id}`, { method: 'DELETE' })
      const { raw } = await readJsonOrText(res)
      if (!res.ok) {
        throw new Error(`Failed to delete notice (${res.status}): ${raw || res.statusText}`)
      }
      setNotices(prev => prev.filter(notice => String(notice._id) !== String(id)))
      setSuccess('Notice deleted successfully.')
    } catch (e: any) {
      setError(e?.message || 'Failed to delete notice')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getCategoryColor = (c: string) => {
    switch ((c || '').toLowerCase()) {
      case 'exam':
        return 'bg-red-100 text-red-700'
      case 'assignment':
        return 'bg-purple-100 text-purple-700'
      case 'event':
        return 'bg-blue-100 text-blue-700'
      case 'reminder':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getPriorityColor = (p: string) => {
    switch ((p || '').toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-700'
      case 'low':
        return 'bg-green-100 text-green-700'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  const getStatusColor = (s: string) => {
    switch ((s || '').toLowerCase()) {
      case 'published':
        return 'bg-green-100 text-green-700'
      case 'archived':
        return 'bg-gray-200 text-gray-700'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#2a358c]">Notices & Announcements</h1>
        <p className="text-gray-500 mt-1">Create, manage, and publish announcements for students.</p>
      </div>

      {/* Loading skeleton — shown while fetching, header is always visible */}
      {isLoading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="bg-white rounded-xl shadow-md animate-pulse">
              <CardContent className="p-6 space-y-3">
                <div className="flex gap-3">
                  <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-5 bg-gray-200 rounded w-16"></div>
                  <div className="h-5 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="h-3 bg-gray-200 rounded w-full mt-2"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6 mt-1"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {error && (

        <Card className="bg-white rounded-xl shadow-md border border-red-200">
          <CardContent className="p-4 text-sm text-red-700">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold">Notice error</div>
                <div className="mt-1 break-words">{error}</div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setError(null)}>
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {success && (
        <Card className="bg-white rounded-xl shadow-md border border-green-200">
          <CardContent className="p-4 text-sm text-green-700">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold">Success</div>
                <div className="mt-1 break-words">{success}</div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setSuccess(null)}>
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {view === 'form' ? (
        // Enhanced Form View
        <Card className="bg-white rounded-xl shadow-md">
          <CardHeader>
            <CardTitle className="text-xl text-[#2a358c]">{editingNotice ? 'Edit Notice' : 'Create New Notice'}</CardTitle>
            <CardDescription>
              {editingNotice ? 'Update the details for your announcement.' : 'Fill in the details for your new announcement.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="title" className="font-semibold text-gray-700">
                Notice Title
              </Label>
              <Input
                id="title"
                placeholder="e.g., Mid-Term Exam Schedule"
                value={formData.title}
                onChange={e => handleFormChange('title', e.target.value)}
                className="mt-2"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="category" className="font-semibold text-gray-700">
                  Category
                </Label>
                <Select value={formData.category} onValueChange={(v: NoticeCategory) => handleFormChange('category', v)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c} value={c}>
                        {c.charAt(0).toUpperCase() + c.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority" className="font-semibold text-gray-700">
                  Priority
                </Label>
                <Select value={formData.priority} onValueChange={(v: NoticePriority) => handleFormChange('priority', v)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map(p => (
                      <SelectItem key={p} value={p}>
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="content" className="font-semibold text-gray-700">
                Notice Content
              </Label>
              <Textarea
                id="content"
                placeholder="Write the main content of the notice here..."
                rows={8}
                value={formData.content}
                onChange={e => handleFormChange('content', e.target.value)}
                className="mt-2"
              />
            </div>

            <div className="flex space-x-3 pt-2">
              <Button
                onClick={handleFormSubmit}
                disabled={isSubmitting}
                size="lg"
                className="bg-[#2a358c] hover:bg-[#3a4a9f] text-white shadow-md"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                {isSubmitting ? 'Saving...' : editingNotice ? 'Save Changes' : 'Save as Draft'}
              </Button>
              <Button variant="outline" size="lg" onClick={() => setView('list')}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        // Enhanced List View
        <>
          <div className="flex justify-between items-center">
            <Card className="bg-white rounded-xl shadow-md">
              <CardContent className="p-3">
                <div className="flex items-center space-x-2">
                  <Label className="text-gray-600">Status:</Label>
                  <Select value={selectedStatus} onValueChange={(v: 'all' | NoticeStatus) => setSelectedStatus(v)}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map(s => (
                        <SelectItem key={s} value={s}>
                          {s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => fetchNotices()} disabled={isSubmitting}>
                Refresh
              </Button>
              <Button onClick={handleAddNew} className="bg-yellow-500 hover:bg-yellow-600 text-white shadow-md">
                <Plus className="w-5 h-5 mr-2" />Create Notice
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {filteredNotices.map(notice => (
              <Card key={String(notice._id)} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center flex-wrap gap-x-3 gap-y-2 mb-2">
                        <CardTitle className="text-lg font-bold text-gray-800">{notice.title}</CardTitle>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(notice.status)}`}>
                          {notice.status}
                        </span>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getPriorityColor(notice.priority)}`}>
                          {notice.priority}
                        </span>
                      </div>

                      <div className="flex items-center space-x-4 mb-4 text-sm text-gray-500">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getCategoryColor(notice.category)}`}>
                          {notice.category}
                        </span>
                        {notice.publishDate && (
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1.5" />
                            <span>Published: {new Date(notice.publishDate).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>

                      <p className="text-gray-600 line-clamp-3">{notice.content}</p>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      {notice.status === 'draft' && (
                        <Button
                          size="sm"
                          onClick={() => handlePublishNotice(String(notice._id))}
                          disabled={isSubmitting}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Send className="w-4 h-4 mr-2" />Publish
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => handleEdit(notice)} disabled={isSubmitting}>
                        <Edit className="w-4 h-4 mr-2" />Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-400 hover:bg-red-100 hover:text-red-600"
                        onClick={() => handleDeleteNotice(String(notice._id))}
                        disabled={isSubmitting}
                        title="Delete is not supported yet"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredNotices.length === 0 && !isLoading && (
            <Card className="bg-white rounded-xl shadow-md">
              <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                <Bell className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-[#2a358c] mb-2">No Notices Found</h3>
                <p className="text-gray-500">
                  {selectedStatus !== 'all'
                    ? 'There are no notices with the selected status.'
                    : 'Click the button below to create your first notice.'}
                </p>
                <Button onClick={handleAddNew} className="mt-6 bg-[#2a358c] hover:bg-[#3a4a9f] text-white">
                  <Plus className="w-5 h-5 mr-2" />Create First Notice
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
