'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings, User, Bell, Shield, Save, Check } from 'lucide-react'

export function SettingsSection() {
  const [name, setName] = useState('Yugansh')
  const [email, setEmail] = useState('teacher@studysync.edu')
  const [department, setDepartment] = useState('Computer Engineering')
  const [emailAlerts, setEmailAlerts] = useState(true)
  const [saved, setSaved] = useState(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[#2a358c]">Settings & Preferences</h1>
        <p className="text-gray-500 mt-1">Manage your profile, portal settings, and notifications.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="bg-white rounded-xl shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center text-[#2a358c]">
              <User className="w-5 h-5 mr-3" />
              <span>Teacher Profile</span>
            </CardTitle>
            <CardDescription>Update your personal information displayed to students.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="t-name">Full Name</Label>
                <Input
                  id="t-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="t-email">Email Address</Label>
                <Input
                  id="t-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="t-dept">Department / Subject</Label>
              <Input
                id="t-dept"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-xl shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center text-[#2a358c]">
              <Bell className="w-5 h-5 mr-3" />
              <span>Notification Preferences</span>
            </CardTitle>
            <CardDescription>Configure how and when you receive portal alerts.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="w-4 h-4 text-[#2a358c] rounded border-gray-300 focus:ring-[#2a358c]"
              />
              <span className="text-sm font-medium text-gray-700">Receive email alerts when students ask questions or access new materials</span>
            </label>
          </CardContent>
        </Card>

        <div className="flex items-center space-x-4">
          <Button type="submit" size="lg" className="bg-[#2a358c] hover:bg-[#3a4a9f] text-white">
            {saved ? <Check className="w-5 h-5 mr-2" /> : <Save className="w-5 h-5 mr-2" />}
            {saved ? 'Saved Successfully!' : 'Save Settings'}
          </Button>
        </div>
      </form>
    </div>
  )
}