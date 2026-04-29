import { useState } from 'react'
import {
  User,
  Bell,
  Shield,
  Palette,
  Wallet,
  Save,
  Camera,
  Moon,
  Sun,
  Monitor,
  Check,
  Trash2,
  Plus,
  Smartphone
} from 'lucide-react'
import {
  UserSettings,
  ConnectedWallet
} from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { NotificationSettings } from '@/components/Notifications/NotificationSettings'
import { ErrorDisplay } from '@/components/ErrorDisplay'
import { useErrorContext } from '@/contexts/ErrorContext'
import { ErrorHandler, type AppError } from '@/utils/errorHandler'
import { cn } from '@/utils/cn'
import { ComponentErrorBoundary } from '@/components/error'

const defaultSettings: UserSettings = {
  profile: {
    username: '',
    email: '',
    bio: '',
    website: '',
    twitter: '',
    discord: '',
    avatar: '',
    banner: ''
  },
  notifications: {
    email: {
      newSales: true,
      newOffers: true,
      priceAlerts: false,
      newsletter: false,
      security: true
    },
    push: {
      newSales: true,
      newOffers: true,
      priceAlerts: true,
      mentions: true,
      follows: false
    }
  },
  privacy: {
    profileVisibility: 'public',
    showEmail: false,
    showSocialLinks: true,
    allowDirectMessages: true,
    showOnlineStatus: true,
    showActivity: true
  },
  preferences: {
    language: 'en',
    currency: 'USD',
    theme: 'system',
    timezone: 'UTC',
    autoPlayVideos: false,
    highQualityImages: true,
    matureContent: false
  },
  wallet: {
    connectedWallets: [],
    defaultWallet: '',
    gasSettings: {
      speed: 'standard',
      autoAdjust: true
    },
    securitySettings: {
      twoFactorEnabled: false,
      emailVerification: true,
      sessionTimeout: 24,
      loginNotifications: true
    }
  }
}

export function UserSettingsPage() {
  const { showError } = useErrorContext()
  const [settings, setSettings] = useState<UserSettings>(defaultSettings)
  const [activeTab, setActiveTab] = useState<string>('profile')
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string>('')
  const [saveError, setSaveError] = useState<AppError | null>(null)

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'preferences', label: 'Preferences', icon: Palette },
    { id: 'wallet', label: 'Wallet', icon: Wallet }
  ]

  const handleSave = async () => {
    setIsSaving(true)
    setSaveMessage('')
    setSaveError(null)

    try {
      if (!settings.profile.username.trim()) {
        throw ErrorHandler.createError(
          'VALIDATION_ERROR',
          'Username is required before saving settings.',
          400
        )
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))

      setSaveMessage('Settings saved successfully!')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (error) {
      const appError = ErrorHandler.handleError(error, {
        context: 'UserSettingsPage.handleSave',
        userMessage: 'Could not save your settings. Please fix any issues and try again.',
      })
      setSaveError(appError)
      showError(appError)
    } finally {
      setIsSaving(false)
    }
  }

  const updateSettings = (section: keyof UserSettings, updates: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        ...updates
      }
    }))
  }

  const addWallet = () => {
    const newWallet: ConnectedWallet = {
      address: '',
      name: '',
      network: 'testnet',
      isDefault: false,
      connectedAt: new Date().toISOString()
    }
    updateSettings('wallet', {
      connectedWallets: [...settings.wallet.connectedWallets, newWallet]
    })
  }

  const removeWallet = (index: number) => {
    const wallets = settings.wallet.connectedWallets.filter((_, i) => i !== index)
    updateSettings('wallet', { connectedWallets: wallets })
  }

  const setDefaultWallet = (address: string) => {
    updateSettings('wallet', { defaultWallet: address })
  }

  return (
    <ComponentErrorBoundary 
      name="UserSettingsPage" 
      showRetry={true}
      customMessage="Settings page encountered an error. Your changes may not have been saved."
    >
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-secondary-900 mb-2">Settings</h1>
          <p className="text-secondary-600">Manage your account settings and preferences</p>
        </div>

        {saveError && (
          <ErrorDisplay
            error={saveError}
            onRetry={handleSave}
            onDismiss={() => setSaveError(null)}
            showRetry
            showDismiss
            className="mb-4"
          />
        )}

        <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:w-64">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors',
                    activeTab === tab.id
                      ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-700'
                      : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900'
                  )}
                >
                  <Icon size={18} className="mr-3" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {/* Profile Settings */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Profile Picture
                      </label>
                      <div className="flex items-center space-x-4">
                        <div className="h-20 w-20 bg-secondary-200 rounded-full flex items-center justify-center">
                          <Camera size={24} className="text-secondary-400" />
                        </div>
                        <div>
                          <Button variant="outline" size="sm">Upload Photo</Button>
                          <p className="text-xs text-secondary-500 mt-1">JPG, PNG max 2MB</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Banner Image
                      </label>
                      <div className="flex items-center space-x-4">
                        <div className="h-20 w-32 bg-secondary-200 rounded-lg flex items-center justify-center">
                          <Camera size={24} className="text-secondary-400" />
                        </div>
                        <div>
                          <Button variant="outline" size="sm">Upload Banner</Button>
                          <p className="text-xs text-secondary-500 mt-1">JPG, PNG max 5MB</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="Username"
                      value={settings.profile.username}
                      onChange={(e) => updateSettings('profile', { username: e.target.value })}
                      placeholder="Enter username"
                    />
                    <Input
                      label="Email"
                      type="email"
                      value={settings.profile.email}
                      onChange={(e) => updateSettings('profile', { email: e.target.value })}
                      placeholder="Enter email"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Bio
                    </label>
                    <textarea
                      className="w-full rounded-lg border border-secondary-300 bg-white px-3 py-2 text-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 resize-y min-h-[100px]"
                      value={settings.profile.bio}
                      onChange={(e) => updateSettings('profile', { bio: e.target.value })}
                      placeholder="Tell us about yourself"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Input
                      label="Website"
                      value={settings.profile.website}
                      onChange={(e) => updateSettings('profile', { website: e.target.value })}
                      placeholder="https://yourwebsite.com"
                    />
                    <Input
                      label="Twitter"
                      value={settings.profile.twitter}
                      onChange={(e) => updateSettings('profile', { twitter: e.target.value })}
                      placeholder="@username"
                    />
                    <Input
                      label="Discord"
                      value={settings.profile.discord}
                      onChange={(e) => updateSettings('profile', { discord: e.target.value })}
                      placeholder="username#1234"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Notifications Settings */}
          {activeTab === 'notifications' && (
            <NotificationSettings />
          )}

          {/* Privacy Settings */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Privacy Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Profile Visibility
                    </label>
                    <select
                      className="w-full rounded-lg border border-secondary-300 bg-white px-3 py-2 text-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                      value={settings.privacy.profileVisibility}
                      onChange={(e) => updateSettings('privacy', {
                        profileVisibility: e.target.value as 'public' | 'private' | 'friends'
                      })}
                    >
                      <option value="public">Public - Anyone can view your profile</option>
                      <option value="private">Private - Only you can view your profile</option>
                      <option value="friends">Friends - Only followers can view your profile</option>
                    </select>
                  </div>

                  {Object.entries(settings.privacy).filter(([key]) => key !== 'profileVisibility').map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between py-3 border-b border-secondary-100 last:border-0">
                      <div>
                        <p className="font-medium text-secondary-900 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </p>
                        <p className="text-sm text-secondary-500">
                          {key === 'showEmail' && 'Display your email on public profile'}
                          {key === 'showSocialLinks' && 'Show social media links on profile'}
                          {key === 'allowDirectMessages' && 'Allow users to send you messages'}
                          {key === 'showOnlineStatus' && 'Show when you are online'}
                          {key === 'showActivity' && 'Display your recent activity'}
                        </p>
                      </div>
                      <button
                        onClick={() => updateSettings('privacy', { [key]: !value })}
                        className={cn(
                          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                          value ? 'bg-primary-600' : 'bg-secondary-200'
                        )}
                      >
                        <span
                          className={cn(
                            'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                            value ? 'translate-x-6' : 'translate-x-1'
                          )}
                        />
                      </button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Preferences Settings */}
          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Appearance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Theme
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { value: 'light', label: 'Light', icon: Sun },
                        { value: 'dark', label: 'Dark', icon: Moon },
                        { value: 'system', label: 'System', icon: Monitor }
                      ].map(({ value, label, icon: Icon }) => (
                        <button
                          key={value}
                          onClick={() => updateSettings('preferences', { theme: value })}
                          className={cn(
                            'flex flex-col items-center p-4 rounded-lg border-2 transition-colors',
                            settings.preferences.theme === value
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-secondary-200 hover:border-secondary-300'
                          )}
                        >
                          <Icon size={24} className="mb-2" />
                          <span className="text-sm font-medium">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Language
                      </label>
                      <select
                        className="w-full rounded-lg border border-secondary-300 bg-white px-3 py-2 text-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                        value={settings.preferences.language}
                        onChange={(e) => updateSettings('preferences', { language: e.target.value })}
                      >
                        <option value="en">English</option>
                        <option value="es">Español</option>
                        <option value="fr">Français</option>
                        <option value="de">Deutsch</option>
                        <option value="ja">日本語</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Currency
                      </label>
                      <select
                        className="w-full rounded-lg border border-secondary-300 bg-white px-3 py-2 text-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                        value={settings.preferences.currency}
                        onChange={(e) => updateSettings('preferences', { currency: e.target.value })}
                      >
                        <option value="USD">USD - US Dollar</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="GBP">GBP - British Pound</option>
                        <option value="JPY">JPY - Japanese Yen</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Timezone
                    </label>
                    <select
                      className="w-full rounded-lg border border-secondary-300 bg-white px-3 py-2 text-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                      value={settings.preferences.timezone}
                      onChange={(e) => updateSettings('preferences', { timezone: e.target.value })}
                    >
                      <option value="UTC">UTC (Coordinated Universal Time)</option>
                      <option value="EST">EST (Eastern Standard Time)</option>
                      <option value="PST">PST (Pacific Standard Time)</option>
                      <option value="GMT">GMT (Greenwich Mean Time)</option>
                      <option value="CET">CET (Central European Time)</option>
                    </select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Content Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(settings.preferences)
                    .filter(([key]) => ['autoPlayVideos', 'highQualityImages', 'matureContent'].includes(key))
                    .map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between py-3 border-b border-secondary-100 last:border-0">
                        <div>
                          <p className="font-medium text-secondary-900 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </p>
                          <p className="text-sm text-secondary-500">
                            {key === 'autoPlayVideos' && 'Automatically play videos in feed'}
                            {key === 'highQualityImages' && 'Load high resolution images by default'}
                            {key === 'matureContent' && 'Show mature content in search results'}
                          </p>
                        </div>
                        <button
                          onClick={() => updateSettings('preferences', { [key]: !value })}
                          className={cn(
                            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                            value ? 'bg-primary-600' : 'bg-secondary-200'
                          )}
                        >
                          <span
                            className={cn(
                              'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                              value ? 'translate-x-6' : 'translate-x-1'
                            )}
                          />
                        </button>
                      </div>
                    ))}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Wallet Settings */}
          {activeTab === 'wallet' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Connected Wallets</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {settings.wallet.connectedWallets.length === 0 ? (
                    <div className="text-center py-8">
                      <Wallet size={48} className="mx-auto text-secondary-300 mb-4" />
                      <p className="text-secondary-500 mb-4">No wallets connected</p>
                      <Button onClick={addWallet} leftIcon={<Plus size={16} />}>
                        Connect Wallet
                      </Button>
                    </div>
                  ) : (
                    <>
                      {settings.wallet.connectedWallets.map((wallet, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border border-secondary-200 rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                              <Wallet size={20} className="text-primary-600" />
                            </div>
                            <div>
                              <p className="font-medium text-secondary-900">{wallet.name || 'Unnamed Wallet'}</p>
                              <p className="text-sm text-secondary-500">
                                {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)} • {wallet.network}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {wallet.isDefault && (
                              <span className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-700 rounded-full">
                                Default
                              </span>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDefaultWallet(wallet.address)}
                              disabled={wallet.isDefault}
                            >
                              Set Default
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeWallet(index)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </div>
                      ))}
                      <Button onClick={addWallet} leftIcon={<Plus size={16} />} variant="outline">
                        Add Another Wallet
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Gas Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Transaction Speed
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { value: 'slow', label: 'Slow', description: 'Lower gas fees, slower confirmation' },
                        { value: 'standard', label: 'Standard', description: 'Balanced speed and cost' },
                        { value: 'fast', label: 'Fast', description: 'Higher gas fees, faster confirmation' }
                      ].map(({ value, label, description }) => (
                        <button
                          key={value}
                          onClick={() => updateSettings('wallet', {
                            gasSettings: { ...settings.wallet.gasSettings, speed: value as 'slow' | 'standard' | 'fast' }
                          })}
                          className={cn(
                            'p-4 rounded-lg border-2 transition-colors text-left',
                            settings.wallet.gasSettings.speed === value
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-secondary-200 hover:border-secondary-300'
                          )}
                        >
                          <p className="font-medium mb-1">{label}</p>
                          <p className="text-xs text-secondary-500">{description}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-secondary-900">Auto-adjust Gas Price</p>
                      <p className="text-sm text-secondary-500">Automatically adjust gas prices based on network conditions</p>
                    </div>
                    <button
                      onClick={() => updateSettings('wallet', {
                        gasSettings: { ...settings.wallet.gasSettings, autoAdjust: !settings.wallet.gasSettings.autoAdjust }
                      })}
                      className={cn(
                        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                        settings.wallet.gasSettings.autoAdjust ? 'bg-primary-600' : 'bg-secondary-200'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                          settings.wallet.gasSettings.autoAdjust ? 'translate-x-6' : 'translate-x-1'
                        )}
                      />
                    </button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-secondary-100">
                    <div className="flex items-center space-x-3">
                      <Smartphone size={20} className="text-secondary-400" />
                      <div>
                        <p className="font-medium text-secondary-900">Two-Factor Authentication</p>
                        <p className="text-sm text-secondary-500">Add an extra layer of security to your account</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      {settings.wallet.securitySettings.twoFactorEnabled ? 'Manage' : 'Enable'}
                    </Button>
                  </div>

                  {Object.entries(settings.wallet.securitySettings)
                    .filter(([key]) => ['emailVerification', 'loginNotifications'].includes(key))
                    .map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between py-3 border-b border-secondary-100 last:border-0">
                        <div>
                          <p className="font-medium text-secondary-900 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </p>
                          <p className="text-sm text-secondary-500">
                            {key === 'emailVerification' && 'Require email verification for sensitive actions'}
                            {key === 'loginNotifications' && 'Get notified when someone logs into your account'}
                          </p>
                        </div>
                        <button
                          onClick={() => updateSettings('wallet', {
                            securitySettings: { ...settings.wallet.securitySettings, [key]: !value }
                          })}
                          className={cn(
                            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                            value ? 'bg-primary-600' : 'bg-secondary-200'
                          )}
                        >
                          <span
                            className={cn(
                              'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                              value ? 'translate-x-6' : 'translate-x-1'
                            )}
                          />
                        </button>
                      </div>
                    ))}

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Session Timeout (hours)
                    </label>
                    <select
                      className="w-full rounded-lg border border-secondary-300 bg-white px-3 py-2 text-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                      value={settings.wallet.securitySettings.sessionTimeout}
                      onChange={(e) => updateSettings('wallet', {
                        securitySettings: { ...settings.wallet.securitySettings, sessionTimeout: parseInt(e.target.value) }
                      })}
                    >
                      <option value={1}>1 hour</option>
                      <option value={6}>6 hours</option>
                      <option value={24}>24 hours</option>
                      <option value={168}>1 week</option>
                      <option value={720}>30 days</option>
                    </select>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Save Button */}
          <div className="flex items-center justify-between mt-8 p-6 bg-secondary-50 rounded-lg">
            <div>
              <p className="font-medium text-secondary-900">Save Changes</p>
              <p className="text-sm text-secondary-500">Your changes will be saved to your profile</p>
            </div>
            <div className="flex items-center space-x-4">
              {saveMessage && (
                <div className="flex items-center space-x-2 text-green-600">
                  <Check size={16} />
                  <span className="text-sm">{saveMessage}</span>
                </div>
              )}
              <Button
                onClick={handleSave}
                isLoading={isSaving}
                leftIcon={<Save size={16} />}
              >
                Save Settings
              </Button>
            </div>
          </div>
        </div>
        </div>
      </div>
    </ComponentErrorBoundary>
  )
}
