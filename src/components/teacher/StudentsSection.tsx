'use client'

import { useEffect, useState, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  Mail, 
  Phone, 
  BookOpen, 
  TrendingUp, 
  Trash2, 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Download,
  X,
  FileText,
  BadgeCheck
} from 'lucide-react'

interface Student {
  _id?: string
  id?: string
  name: string
  email: string
  phone?: string
  grade: string
  rollNumber?: string
  status: string
  materialsAccessed?: number
  teacherEmail?: string
  createdAt?: string
}

export function StudentsSection() {
  const { data: session } = useSession()
  const teacherEmail = session?.user?.email || ''

  const [students, setStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGrade, setSelectedGrade] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')

  // Modals & form states
  const [isAddingStudent, setIsAddingStudent] = useState(false)
  const [isBulkRegistering, setIsBulkRegistering] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Single student form
  const [newStudent, setNewStudent] = useState({
    name: '',
    email: '',
    phone: '',
    grade: '10th Grade',
    rollNumber: '',
  })

  // Bulk registration state
  const [bulkText, setBulkText] = useState('')
  const [parsedBulkStudents, setParsedBulkStudents] = useState<Array<{
    name: string
    email: string
    phone: string
    grade: string
    rollNumber: string
    valid: boolean
  }>>([])

  // Notifications
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const grades = ['all', '9th Grade', '10th Grade', '11th Grade', '12th Grade']
  const statuses = ['all', 'active', 'inactive']

  const fetchStudents = async () => {
    try {
      setIsLoading(true)
      setErrorMsg(null)
      const url = teacherEmail 
        ? `/api/students?teacherEmail=${encodeURIComponent(teacherEmail)}`
        : '/api/students'
      const res = await fetch(url)
      if (!res.ok) {
        throw new Error('Failed to load students')
      }
      const data = await res.json()
      setStudents(Array.isArray(data) ? data : [])
    } catch (err: any) {
      console.error('Error fetching students:', err)
      setErrorMsg(err.message || 'Failed to load students')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStudents()
  }, [teacherEmail])

  // Parse CSV text dynamically for bulk registration
  useEffect(() => {
    if (!bulkText.trim()) {
      setParsedBulkStudents([])
      return
    }

    const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean)
    const parsed = lines.map(line => {
      // Split by comma
      const parts = line.split(',').map(p => p.trim())
      const name = parts[0] || ''
      const email = parts[1] || ''
      const phone = parts[2] || ''
      const grade = parts[3] || '10th Grade'
      const rollNumber = parts[4] || ''

      const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      const valid = Boolean(name && validEmail)

      return { name, email, phone, grade, rollNumber, valid }
    })

    setParsedBulkStudents(parsed)
  }, [bulkText])

  // Handle CSV file upload
  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      if (content) {
        // Skip header if line 1 contains "name" and "email"
        const lines = content.split('\n')
        const firstLine = (lines[0] || '').toLowerCase()
        const cleanContent = (firstLine.includes('name') && firstLine.includes('email'))
          ? lines.slice(1).join('\n')
          : content
        setBulkText(cleanContent.trim())
      }
    }
    reader.readAsText(file)
  }

  // Download Sample CSV
  const handleDownloadSampleCsv = () => {
    const sample = `Name,Email,Phone,Grade,RollNumber\nAarav Sharma,aarav.sharma@example.com,9876543210,10th Grade,A-101\nDiya Patel,diya.patel@example.com,9876543211,10th Grade,A-102\nRohan Verma,rohan.verma@example.com,9876543212,11th Grade,B-201`
    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', 'studysync_students_sample.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Add single student
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStudent.name.trim() || !newStudent.email.trim()) {
      setErrorMsg('Name and Email are required.')
      return
    }

    setIsSubmitting(true)
    setErrorMsg(null)
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newStudent,
          teacherEmail: teacherEmail || 'anonymous',
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add student')
      }

      setStudents(prev => [data, ...prev])
      setIsAddingStudent(false)
      setNewStudent({ name: '', email: '', phone: '', grade: '10th Grade', rollNumber: '' })
      setSuccessMsg(`Student "${data.name}" enrolled successfully!`)
      setTimeout(() => setSuccessMsg(null), 4000)
    } catch (err: any) {
      setErrorMsg(err.message || 'Error adding student')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Submit bulk registration
  const handleBulkSubmit = async () => {
    const validOnes = parsedBulkStudents.filter(s => s.valid)
    if (validOnes.length === 0) {
      setErrorMsg('No valid students to register. Ensure Name and valid Email format on each row.')
      return
    }

    setIsSubmitting(true)
    setErrorMsg(null)
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          students: validOnes,
          teacherEmail: teacherEmail || 'anonymous',
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to register students')
      }

      if (Array.isArray(data.students)) {
        setStudents(prev => [...data.students, ...prev])
      } else {
        await fetchStudents()
      }

      setIsBulkRegistering(false)
      setBulkText('')
      setSuccessMsg(`Successfully registered ${validOnes.length} students in bulk!`)
      setTimeout(() => setSuccessMsg(null), 4000)
    } catch (err: any) {
      setErrorMsg(err.message || 'Error in bulk registration')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete student
  const handleDeleteStudent = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove student "${name}"?`)) {
      return
    }

    setDeletingId(id)
    setErrorMsg(null)
    try {
      const res = await fetch(`/api/students?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        throw new Error('Failed to delete student')
      }

      setStudents(prev => prev.filter(s => (s._id !== id && s.id !== id)))
      setSuccessMsg(`Student "${name}" was removed successfully.`)
      setTimeout(() => setSuccessMsg(null), 4000)
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete student')
    } finally {
      setDeletingId(null)
    }
  }

  // Filter logic
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSearch =
        (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.rollNumber || '').toLowerCase().includes(searchTerm.toLowerCase())
      const matchesGrade = selectedGrade === 'all' || s.grade === selectedGrade
      const matchesStatus = selectedStatus === 'all' || (s.status || 'active') === selectedStatus
      return matchesSearch && matchesGrade && matchesStatus
    })
  }, [students, searchTerm, selectedGrade, selectedStatus])

  const activeStudents = students.filter(s => (s.status || 'active') === 'active')
  const totalMaterialsAccessed = students.reduce((sum, s) => sum + (s.materialsAccessed || 0), 0)

  const statCards = [
    { title: 'Total Enrolled', value: students.length, note: `${activeStudents.length} active`, icon: Users },
    { title: 'Materials Accessed', value: totalMaterialsAccessed, note: 'Across your students', icon: BookOpen },
    { title: 'Avg. Engagement', value: students.length ? Math.round(totalMaterialsAccessed / students.length) : 0, note: 'Views per student', icon: TrendingUp }
  ]

  return (
    <div className="space-y-8">
      {/* Header with Add & Bulk Register Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#2a358c]">Student Management</h1>
          <p className="text-gray-500 mt-1">Manage enrolled student profiles, bulk registrations, and access track.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button 
            onClick={() => { setIsBulkRegistering(true); setIsAddingStudent(false); }} 
            className="bg-[#2a358c] hover:bg-[#3a4a9f] text-white shadow-md"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Bulk Registration
          </Button>
          <Button 
            onClick={() => { setIsAddingStudent(true); setIsBulkRegistering(false); }} 
            className="bg-yellow-500 hover:bg-yellow-600 text-white shadow-md"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Single Student
          </Button>
        </div>
      </div>

      {/* Success banner */}
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
      {errorMsg && (
        <Card className="bg-white rounded-xl shadow-md border border-red-200">
          <CardContent className="p-4 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-700">Student Management Alert</p>
                <p className="text-sm text-red-500 mt-0.5">{errorMsg}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setErrorMsg(null)}>
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map(stat => (
          <Card key={stat.title} className="bg-white rounded-xl shadow-md">
            <CardContent className="p-6 flex items-center space-x-4">
              <div className="p-3 rounded-full bg-blue-50">
                <stat.icon className="h-6 w-6 text-[#2a358c]" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                <p className="text-2xl font-bold text-[#2a358c]">{stat.value}</p>
                <p className="text-xs text-gray-400 mt-1">{stat.note}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Single Add Student Modal / Form */}
      {isAddingStudent && (
        <Card className="bg-white rounded-xl shadow-lg border-2 border-[#2a358c]/20 animate-in fade-in slide-in-from-top-2 duration-200">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-xl text-[#2a358c]">Enroll New Student</CardTitle>
              <CardDescription>Enter student details to add them directly to your classroom roster.</CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsAddingStudent(false)}>
              <X className="w-5 h-5" />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddStudent} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="st-name" className="font-semibold text-gray-700">Full Name *</Label>
                  <Input 
                    id="st-name" 
                    placeholder="e.g. Yugansh" 
                    value={newStudent.name} 
                    onChange={(e) => setNewStudent(p => ({ ...p, name: e.target.value }))} 
                    required 
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="st-email" className="font-semibold text-gray-700">Email Address *</Label>
                  <Input 
                    id="st-email" 
                    type="email" 
                    placeholder="student@example.com" 
                    value={newStudent.email} 
                    onChange={(e) => setNewStudent(p => ({ ...p, email: e.target.value }))} 
                    required 
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="st-phone" className="font-semibold text-gray-700">Phone Number</Label>
                  <Input 
                    id="st-phone" 
                    placeholder="+91 9876543210" 
                    value={newStudent.phone} 
                    onChange={(e) => setNewStudent(p => ({ ...p, phone: e.target.value }))} 
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="st-roll" className="font-semibold text-gray-700">Roll / Registration No.</Label>
                  <Input 
                    id="st-roll" 
                    placeholder="e.g. 2024-CS-101" 
                    value={newStudent.rollNumber} 
                    onChange={(e) => setNewStudent(p => ({ ...p, rollNumber: e.target.value }))} 
                    className="mt-1"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="st-grade" className="font-semibold text-gray-700">Grade / Year</Label>
                  <Select 
                    value={newStudent.grade} 
                    onValueChange={(v) => setNewStudent(p => ({ ...p, grade: v }))}
                  >
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select Grade" /></SelectTrigger>
                    <SelectContent>
                      {grades.slice(1).map(g => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <Button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="bg-[#2a358c] hover:bg-[#3a4a9f] text-white shadow-md"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
                  {isSubmitting ? 'Enrolling...' : 'Save & Enroll Student'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsAddingStudent(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Bulk Registration Modal / Form */}
      {isBulkRegistering && (
        <Card className="bg-white rounded-xl shadow-lg border-2 border-[#2a358c]/20 animate-in fade-in slide-in-from-top-2 duration-200">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-xl text-[#2a358c] flex items-center gap-2">
                <FileSpreadsheet className="w-6 h-6 text-[#2a358c]" />
                <span>Bulk Student Registration</span>
              </CardTitle>
              <CardDescription>
                Quickly register dozens of students at once via CSV upload or pasting formatted text.
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsBulkRegistering(false)}>
              <X className="w-5 h-5" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Top Toolbar: Upload CSV + Download Sample */}
            <div className="bg-slate-50 p-4 rounded-xl border border-gray-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-800">CSV Format: <span className="font-mono text-xs font-normal text-gray-600">Name, Email, Phone, Grade, RollNumber</span></p>
                <p className="text-xs text-gray-500">Each student on a new line.</p>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={handleDownloadSampleCsv} 
                  className="text-gray-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Sample CSV
                </Button>
                <label className="cursor-pointer">
                  <input 
                    type="file" 
                    accept=".csv,.txt" 
                    onChange={handleCsvFileUpload} 
                    className="hidden" 
                  />
                  <span className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md bg-[#2a358c] text-white hover:bg-[#3a4a9f] shadow-sm">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload CSV File
                  </span>
                </label>
              </div>
            </div>

            {/* Paste Text Area */}
            <div>
              <Label className="font-semibold text-gray-700">Paste CSV or Type Student Rows</Label>
              <Textarea
                rows={6}
                placeholder="Aarav Sharma, aarav@example.com, 9876543210, 10th Grade, CS-101&#10;Diya Patel, diya@example.com, 9876543211, 10th Grade, CS-102&#10;Rohan Verma, rohan@example.com, 9876543212, 11th Grade, CS-201"
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                className="mt-2 font-mono text-sm"
              />
            </div>

            {/* Live Parsing Preview */}
            {parsedBulkStudents.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-gray-800">
                    Live Preview ({parsedBulkStudents.filter(s => s.valid).length} valid rows)
                  </h4>
                  <span className="text-xs text-gray-500">
                    {parsedBulkStudents.filter(s => !s.valid).length > 0 && (
                      <span className="text-red-500 font-semibold mr-2">
                        {parsedBulkStudents.filter(s => !s.valid).length} invalid row(s)
                      </span>
                    )}
                  </span>
                </div>
                <div className="max-h-48 overflow-y-auto border rounded-lg">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-gray-100 text-gray-700 uppercase font-semibold">
                      <tr>
                        <th className="p-2.5">Status</th>
                        <th className="p-2.5">Name</th>
                        <th className="p-2.5">Email</th>
                        <th className="p-2.5">Phone</th>
                        <th className="p-2.5">Grade</th>
                        <th className="p-2.5">Roll No.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {parsedBulkStudents.map((s, idx) => (
                        <tr key={idx} className={s.valid ? 'bg-white hover:bg-slate-50' : 'bg-red-50'}>
                          <td className="p-2.5">
                            {s.valid ? (
                              <span className="inline-flex items-center text-green-700 font-semibold">
                                <BadgeCheck className="w-4 h-4 mr-1 text-green-600" /> Ready
                              </span>
                            ) : (
                              <span className="inline-flex items-center text-red-600 font-semibold">
                                <AlertCircle className="w-4 h-4 mr-1 text-red-500" /> Incomplete
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 font-medium">{s.name || '—'}</td>
                          <td className="p-2.5">{s.email || '—'}</td>
                          <td className="p-2.5">{s.phone || '—'}</td>
                          <td className="p-2.5">{s.grade || '—'}</td>
                          <td className="p-2.5">{s.rollNumber || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center space-x-3 pt-2">
              <Button
                type="button"
                disabled={isSubmitting || parsedBulkStudents.filter(s => s.valid).length === 0}
                onClick={handleBulkSubmit}
                className="bg-[#2a358c] hover:bg-[#3a4a9f] text-white shadow-md"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                {isSubmitting 
                  ? 'Enrolling Students...' 
                  : `Enroll ${parsedBulkStudents.filter(s => s.valid).length} Students`}
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsBulkRegistering(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters Card */}
      <Card className="bg-white rounded-xl shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-[#2a358c] text-lg">
            <Filter className="w-5 h-5 mr-2" />
            <span>Filter Students</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative md:col-span-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input 
                placeholder="Search by name, email, or roll no..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="pl-10 h-10"
              />
            </div>
            <Select value={selectedGrade} onValueChange={setSelectedGrade}>
              <SelectTrigger className="h-10"><SelectValue placeholder="All Grades" /></SelectTrigger>
              <SelectContent>
                {grades.map(g => (
                  <SelectItem key={g} value={g}>{g === 'all' ? 'All Grades' : g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="h-10"><SelectValue placeholder="All Statuses" /></SelectTrigger>
              <SelectContent>
                {statuses.map(s => (
                  <SelectItem key={s} value={s}>{s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="bg-white rounded-xl shadow-md animate-pulse">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gray-200 rounded-full"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-48"></div>
                    <div className="h-3 bg-gray-200 rounded w-32"></div>
                  </div>
                </div>
                <div className="h-8 bg-gray-200 rounded w-24"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Students List */}
      {!isLoading && (
        <div className="space-y-4">
          {filteredStudents.map((student) => {
            const sid = student._id || student.id || ''
            const initials = (student.name || 'Student')
              .split(' ')
              .map(n => n[0])
              .filter(Boolean)
              .slice(0, 2)
              .join('')
              .toUpperCase()

            const isThisDeleting = deletingId === sid

            return (
              <Card key={sid} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all">
                <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0 border border-blue-100">
                      <span className="text-lg font-bold text-[#2a358c]">{initials}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-lg text-gray-800">{student.name}</p>
                        {student.rollNumber && (
                          <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded font-mono">
                            {student.rollNumber}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 mt-1">
                        <div className="flex items-center">
                          <Mail className="w-4 h-4 mr-1.5 text-gray-400" />
                          <span>{student.email}</span>
                        </div>
                        {student.phone && (
                          <div className="flex items-center">
                            <Phone className="w-4 h-4 mr-1.5 text-gray-400" />
                            <span>{student.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-3 md:pt-0">
                    <div className="text-center px-2">
                      <p className="font-semibold text-[#2a358c] text-sm">{student.grade || '10th Grade'}</p>
                      <p className="text-xs text-gray-400">Grade</p>
                    </div>
                    <div className="text-center px-2">
                      <p className="font-semibold text-[#2a358c] text-sm">{student.materialsAccessed || 0}</p>
                      <p className="text-xs text-gray-400">Accessed</p>
                    </div>
                    <div className="text-center px-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        (student.status || 'active') === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {student.status || 'active'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <a href={`mailto:${student.email}`}>
                        <Button variant="outline" size="sm" className="text-gray-700">
                          <Mail className="w-3.5 h-3.5 mr-1.5" />
                          Email
                        </Button>
                      </a>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isThisDeleting}
                        onClick={() => handleDeleteStudent(sid, student.name)}
                        className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                        title="Remove student"
                      >
                        {isThisDeleting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredStudents.length === 0 && (
        <Card className="bg-white rounded-xl shadow-md">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-[#2a358c] mb-2">No Students Found</h3>
            <p className="text-gray-500 max-w-md">
              {searchTerm || selectedGrade !== 'all' || selectedStatus !== 'all'
                ? "No students match your search or filter criteria. Try adjusting your filters."
                : "You haven't enrolled any students yet. Click 'Add Single Student' or 'Bulk Registration' to build your roster."
              }
            </p>
            {!searchTerm && selectedGrade === 'all' && selectedStatus === 'all' && (
              <div className="flex gap-3 mt-6">
                <Button onClick={() => setIsBulkRegistering(true)} className="bg-[#2a358c] hover:bg-[#3a4a9f] text-white">
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Bulk Registration
                </Button>
                <Button onClick={() => setIsAddingStudent(true)} className="bg-yellow-500 hover:bg-yellow-600 text-white">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Student
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
