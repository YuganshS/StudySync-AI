'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  FileText, 
  ImageIcon, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Calendar,
  Upload,
  Trash2,
  CheckSquare,
  Square,
  AlertTriangle,
  Loader2,
  CheckCircle2
} from 'lucide-react'

interface Material {
  id: string
  name: string
  type: 'pdf' | 'image'
  size: string
  category: string
  uploadDate: string
  downloads: number
  views: number
  fileURL: string
  teacherEmail?: string
}

export function MaterialsSection() {
  const { data: session, status } = useSession()
  const teacherEmail = session?.user?.email || ''
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedType, setSelectedType] = useState('all')
  const [materials, setMaterials] = useState<Material[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Selection state for batch actions
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const fetchMaterials = async (emailToUse?: string) => {
    const targetEmail = emailToUse || teacherEmail
    if (!targetEmail) {
      setIsLoading(false)
      setMaterials([])
      return
    }

    try {
      setIsLoading(true)
      const controller = new AbortController()
      const timeoutMs = process.env.NODE_ENV === 'development' ? 10000 : 30000
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

      const url = `${BACKEND_URL}/materials?teacherEmail=${encodeURIComponent(targetEmail)}`
      const response = await fetch(url, { signal: controller.signal })
      clearTimeout(timeoutId)
      if (!response.ok) {
        let details = ''
        try {
          const contentType = response.headers.get('content-type') || ''
          if (contentType.includes('application/json')) {
            const body = await response.json()
            details = typeof body?.error === 'string' ? body.error : JSON.stringify(body)
          } else {
            details = await response.text()
          }
        } catch {
          // ignore secondary parsing failures
        }
        const suffix = details ? ` — ${details}` : ''
        throw new Error(`Failed to fetch materials (${response.status})${suffix}`)
      }
      const dbData = await response.json()
      const formattedMaterials: Material[] = dbData.map((item: any) => {
        const contentType: string = typeof item?.contentType === 'string' ? item.contentType : ''
        const name: string = typeof item?.fileName === 'string'
          ? item.fileName
          : (typeof item?.name === 'string' ? item.name : '')
        return {
          id: item._id,
          name,
          type: contentType.includes('pdf') ? 'pdf' : 'image',
          size: formatFileSize(item.size || 0),
          category: item.category || 'Uncategorized',
          uploadDate: item.uploadDate || new Date().toISOString(),
          downloads: item.downloads || 0,
          views: item.views || 0,
          fileURL: item.fileURL,
          teacherEmail: item.teacherEmail,
        }
      })
      setMaterials(formattedMaterials)
      setError(null)
    } catch (err: any) {
      const message = err?.name === 'AbortError'
        ? 'Materials request timed out. Is the backend running and reachable?'
        : err.message
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'loading') return
    if (teacherEmail) {
      fetchMaterials(teacherEmail)
    } else {
      setIsLoading(false)
      setMaterials([])
    }
  }, [teacherEmail, status])

  const categories = ['all', 'Mathematics', 'Science', 'English', 'History', 'Physics', 'Uncategorized']
  const types = ['all', 'pdf', 'image']

  const filteredMaterials = materials.filter(material =>
    (material.name || '').toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedCategory === 'all' || material.category === selectedCategory) &&
    (selectedType === 'all' || material.type === selectedType)
  )

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectedIds.length === filteredMaterials.length && filteredMaterials.length > 0) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredMaterials.map(m => m.id))
    }
  }

  // Delete single material
  const handleDeleteSingle = async (id: string, name: string) => {
    const confirmed = window.confirm(`Are you sure you want to delete "${name}"?`)
    if (!confirmed) return

    setDeletingId(id)
    setError(null)
    try {
      const res = await fetch(`${BACKEND_URL}/materials/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Failed to delete material (${res.status})`)
      }

      // Optimistic update
      setMaterials(prev => prev.filter(m => m.id !== id))
      setSelectedIds(prev => prev.filter(item => item !== id))
      setSuccessMsg(`"${name}" was deleted successfully.`)
      setTimeout(() => setSuccessMsg(null), 4000)
    } catch (err: any) {
      setError(err.message || 'Failed to delete material')
    } finally {
      setDeletingId(null)
    }
  }

  // Batch delete selected materials
  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return

    const confirmed = window.confirm(
      `Are you sure you want to permanently delete the ${selectedIds.length} selected material(s)?`
    )
    if (!confirmed) return

    setIsDeleting(true)
    setError(null)
    try {
      const res = await fetch(`${BACKEND_URL}/materials`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Failed to delete selected materials (${res.status})`)
      }

      const count = selectedIds.length
      setMaterials(prev => prev.filter(m => !selectedIds.includes(m.id)))
      setSelectedIds([])
      setSuccessMsg(`${count} material(s) deleted successfully.`)
      setTimeout(() => setSuccessMsg(null), 4000)
    } catch (err: any) {
      setError(err.message || 'Failed to delete selected materials')
    } finally {
      setIsDeleting(false)
    }
  }

  const getFileIcon = (type: 'pdf' | 'image') => {
    const styles = type === 'pdf' ? 'bg-red-100 text-red-600' : 'bg-purple-100 text-purple-600'
    const Icon = type === 'pdf' ? FileText : ImageIcon
    return (
      <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${styles}`}>
        <Icon className="w-6 h-6" />
      </div>
    )
  }

  const getCategoryColor = (_category: string) => 'bg-gray-100 text-gray-800'

  const allFilteredSelected = filteredMaterials.length > 0 && selectedIds.length === filteredMaterials.length

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#2a358c]">Materials Library</h1>
          <p className="text-gray-500 mt-1">Manage, search, and organize your educational content.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => fetchMaterials()} 
            disabled={isLoading || isDeleting}
            className="text-gray-600"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Success alert banner */}
      {successMsg && (
        <Card className="bg-green-50 border border-green-200 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between text-green-800 text-sm">
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSuccessMsg(null)} className="text-green-700 h-7 text-xs">
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Error banner */}
      {error && (
        <Card className="bg-white rounded-xl shadow-md border border-red-200">
          <CardContent className="p-4 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-700">Error</p>
                <p className="text-sm text-red-500 mt-0.5">{error}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setError(null)}>
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Filters and Selection Bar */}
      <Card className="bg-white rounded-xl shadow-md">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="flex items-center text-[#2a358c] text-lg">
              <Filter className="w-5 h-5 mr-2" />
              <span>Filter &amp; Search</span>
            </CardTitle>

            {/* Select All Toggle */}
            {filteredMaterials.length > 0 && (
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  className="flex items-center gap-2 text-sm text-gray-700"
                >
                  {allFilteredSelected ? (
                    <CheckSquare className="w-4 h-4 text-[#2a358c]" />
                  ) : (
                    <Square className="w-4 h-4 text-gray-400" />
                  )}
                  <span>{allFilteredSelected ? 'Deselect All' : 'Select All'}</span>
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input 
                placeholder="Search materials by name..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="pl-10 h-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="h-10"><SelectValue placeholder="All Categories" /></SelectTrigger>
              <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c === 'all' ? 'All Categories' : c}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="h-10"><SelectValue placeholder="All Types" /></SelectTrigger>
              <SelectContent>{types.map(t => <SelectItem key={t} value={t}>{t === 'all' ? 'All Types' : t.toUpperCase()}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Floating/Pinned Bulk Action Toolbar */}
      {selectedIds.length > 0 && (
        <div className="bg-[#2a358c] text-white p-4 rounded-xl shadow-lg flex flex-wrap items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <CheckSquare className="w-5 h-5 text-yellow-300" />
            <span className="font-semibold text-base">
              {selectedIds.length} material{selectedIds.length > 1 ? 's' : ''} selected
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedIds([])}
              className="bg-transparent border-white/40 text-white hover:bg-white/10 hover:text-white"
            >
              Clear Selection
            </Button>
            <Button
              size="sm"
              disabled={isDeleting}
              onClick={handleDeleteSelected}
              className="bg-red-600 hover:bg-red-700 text-white font-medium shadow"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              {isDeleting ? 'Deleting...' : `Delete Selected (${selectedIds.length})`}
            </Button>
          </div>
        </div>
      )}

      {/* Skeleton while loading */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-white rounded-xl shadow-md animate-pulse">
              <CardContent className="p-6 space-y-3">
                <div className="h-12 w-12 bg-gray-200 rounded-lg"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mt-3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mt-2"></div>
                <div className="h-8 bg-gray-200 rounded mt-4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Materials Grid */}
      {!isLoading && filteredMaterials.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMaterials.map((material) => {
            const isSelected = selectedIds.includes(material.id)
            const isThisDeleting = deletingId === material.id

            return (
              <Card 
                key={material.id} 
                className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 flex flex-col relative overflow-hidden border-2 ${
                  isSelected ? 'border-[#2a358c] bg-blue-50/20 shadow-lg' : 'border-transparent'
                }`}
              >
                {/* Selection checkbox toggle overlay */}
                <div className="absolute top-3 right-3 z-10">
                  <button
                    type="button"
                    onClick={() => handleToggleSelect(material.id)}
                    className={`w-6 h-6 rounded flex items-center justify-center transition-all ${
                      isSelected 
                        ? 'bg-[#2a358c] text-white shadow' 
                        : 'bg-white/80 border border-gray-300 text-transparent hover:border-gray-400 hover:text-gray-300'
                    }`}
                    title={isSelected ? 'Deselect material' : 'Select material'}
                  >
                    <CheckSquare className="w-4 h-4" />
                  </button>
                </div>

                <CardHeader className="flex flex-row items-start space-x-3 pr-10">
                  {getFileIcon(material.type)}
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base font-semibold text-gray-800 line-clamp-2 leading-snug" title={material.name}>
                      {material.name}
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-0.5">{material.size}</p>
                  </div>
                </CardHeader>

                <CardContent className="flex-grow flex flex-col justify-end">
                  <div className="text-xs text-gray-500 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 rounded-full font-medium ${getCategoryColor(material.category)}`}>
                        {material.category}
                      </span>
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1.5" />
                        <span>{new Date(material.uploadDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center">
                        <Eye className="w-4 h-4 mr-1.5" />
                        <span>{material.views} views</span>
                      </div>
                      <div className="flex items-center">
                        <Download className="w-4 h-4 mr-1.5" />
                        <span>{material.downloads} downloads</span>
                      </div>
                    </div>
                  </div>
                </CardContent>

                {/* Card Actions: Download & Delete */}
                <div className="p-4 pt-0 flex items-center gap-2">
                  <a href={material.fileURL} target="_blank" rel="noopener noreferrer" className="flex-1">
                    <Button size="sm" className="w-full bg-[#2a358c] hover:bg-[#3a4a9f] text-white">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </a>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isThisDeleting || isDeleting}
                    onClick={() => handleDeleteSingle(material.id, material.name)}
                    className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 px-3"
                    title="Delete this material"
                  >
                    {isThisDeleting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filteredMaterials.length === 0 && (
        <Card className="bg-white rounded-xl shadow-md">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <FileText className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-[#2a358c] mb-2">No Materials Found</h3>
            <p className="text-gray-500 max-w-sm">
              {searchTerm || selectedCategory !== 'all' || selectedType !== 'all'
                ? "Your search or filter criteria didn't match any materials. Try adjusting your filters."
                : "Your library is currently empty. Click 'Upload Content' in the sidebar to add your first material."
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
