import React, { useState, useEffect } from 'react'
import { Bell, Mail, Smartphone, Volume2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface NotificationPreference {
  id: string
  label: string
  description: string
  enabled: boolean
  types: ('email' | 'push' | 'inApp')[]
}

export function NotificationSettings() {
  const [preferences, setPreferences] = useState<NotificationPreference[]>([
    {
      id: 'bids',
      label: 'Bid Notifications',
      description: 'Get notified when someone bids on your artwork',
      enabled: true,
      types: ['email', 'push', 'inApp']
    },
    {
      id: 'purchases',
      label: 'Purchase Notifications',
      description: 'Get notified when your artwork is purchased',
      enabled: true,
      types: ['email', 'push', 'inApp']
    },
    {
      id: 'sales',
      label: 'Sales Notifications',
      description: 'Get notified when you successfully sell artwork',
      enabled: true,
      types: ['email', 'push', 'inApp']
    },
    {
      id: 'follows',
      label: 'Follow Notifications',
      description: 'Get notified when someone follows you',
      enabled: true,
      types: ['inApp']
    },
    {
      id: 'mentions',
      label: 'Mentions',
      description: 'Get notified when someone mentions you',
      enabled: false,
      types: ['inApp']
    },
    {
      id: 'system',
      label: 'System Updates',
      description: 'Get notified about system updates and maintenance',
      enabled: true,
      types: ['email', 'inApp']
    },
    {
      id: 'marketing',
      label: 'Marketing & Promotions',
      description: 'Get notified about new features and promotions',
      enabled: false,
      types: ['email']
    }
  ])

  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [statusMessage, setStatusMessage] = useState<string>('')

  useEffect(() => {
    try {
      const savedPreferences = localStorage.getItem('muse_notification_preferences')
      const savedEmail = localStorage.getItem('muse_email_notifications')
      const savedPush = localStorage.getItem('muse_push_notifications')
      const savedSound = localStorage.getItem('muse_sound_enabled')

      if (savedPreferences) {
        setPreferences(JSON.parse(savedPreferences))
      }
      if (savedEmail !== null) {
        setEmailNotifications(JSON.parse(savedEmail))
      }
      if (savedPush !== null) {
        setPushNotifications(JSON.parse(savedPush))
      }
      if (savedSound !== null) {
        setSoundEnabled(JSON.parse(savedSound))
      }
    } catch (error) {
      console.error('Failed to load notification settings from storage:', error)
    }
  }, [])

  const togglePreference = (id: string) => {
    setPreferences(prev => prev.map(pref => 
      pref.id === id ? { ...pref, enabled: !pref.enabled } : pref
    ))
  }

  const toggleType = (id: string, type: 'email' | 'push' | 'inApp') => {
    setPreferences(prev => prev.map(pref => 
      pref.id === id 
        ? { 
            ...pref, 
            types: pref.types.includes(type) 
              ? pref.types.filter(t => t !== type)
              : [...pref.types, type]
          }
        : pref
    ))
  }

  const isTypeEnabled = (pref: NotificationPreference, type: 'email' | 'push' | 'inApp') => {
    return pref.types.includes(type)
  }

  const saveSettings = () => {
    localStorage.setItem('muse_notification_preferences', JSON.stringify(preferences))
    localStorage.setItem('muse_email_notifications', JSON.stringify(emailNotifications))
    localStorage.setItem('muse_push_notifications', JSON.stringify(pushNotifications))
    localStorage.setItem('muse_sound_enabled', JSON.stringify(soundEnabled))
    setStatusMessage('Notification settings saved successfully.')

    window.setTimeout(() => {
      setStatusMessage('')
    }, 3000)
  }

  return (
    <div className="space-y-6">
      {/* Global Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Global Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-gray-500" />
              <div>
                <h4 className="font-medium">Email Notifications</h4>
                <p className="text-sm text-gray-600">Receive notifications via email</p>
              </div>
            </div>
            <button
              onClick={() => setEmailNotifications(!emailNotifications)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                emailNotifications ? 'bg-primary-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  emailNotifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="h-4 w-4 text-gray-500" />
              <div>
                <h4 className="font-medium">Push Notifications</h4>
                <p className="text-sm text-gray-600">Receive browser push notifications</p>
              </div>
            </div>
            <button
              onClick={() => setPushNotifications(!pushNotifications)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                pushNotifications ? 'bg-primary-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  pushNotifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 className="h-4 w-4 text-gray-500" />
              <div>
                <h4 className="font-medium">Sound Effects</h4>
                <p className="text-sm text-gray-600">Play sound for new notifications</p>
              </div>
            </div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                soundEnabled ? 'bg-primary-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  soundEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Notification Types */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {preferences.map(preference => (
              <div key={preference.id} className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-medium">{preference.label}</h4>
                    <p className="text-sm text-gray-600">{preference.description}</p>
                  </div>
                  <button
                    onClick={() => togglePreference(preference.id)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      preference.enabled ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        preference.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {preference.enabled && (
                  <div className="flex items-center gap-6 text-sm">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isTypeEnabled(preference, 'inApp')}
                        onChange={() => toggleType(preference.id, 'inApp')}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <span>In-App</span>
                    </label>

                    {preference.types.includes('email') || preference.id === 'marketing' ? (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isTypeEnabled(preference, 'email')}
                          onChange={() => toggleType(preference.id, 'email')}
                          disabled={!emailNotifications}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded disabled:opacity-50"
                        />
                        <span className={emailNotifications ? '' : 'text-gray-400'}>Email</span>
                      </label>
                    ) : null}

                    {preference.types.includes('push') ? (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isTypeEnabled(preference, 'push')}
                          onChange={() => toggleType(preference.id, 'push')}
                          disabled={!pushNotifications}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded disabled:opacity-50"
                        />
                        <span className={pushNotifications ? '' : 'text-gray-400'}>Push</span>
                      </label>
                    ) : null}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {statusMessage && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-700">
          {statusMessage}
        </div>
      )}
      {/* Save Button */}
      <div className="flex justify-end">
        <Button variant="primary" onClick={saveSettings}>
          Save Settings
        </Button>
      </div>
    </div>
  )
}
