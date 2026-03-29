import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { ErrorProvider } from '@/contexts/ErrorContext'
import { ErrorBoundary } from '@/components/ErrorDisplay'
import { ToastNotifications } from '@/components/Notifications/ToastNotifications'
import { ErrorToast } from '@/components/ErrorToast'
import { Navigation } from '@/components/composite/Navigation'
import { HomePage } from '@/pages/HomePage'
import { ExplorePage } from '@/pages/ExplorePage'
import { MintPage } from '@/pages/MintPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { UserSettingsPage } from '@/pages/UserSettingsPage'

function App() {
    return (
        <ErrorBoundary>
            <ErrorProvider>
                <NotificationProvider>
                    <Router>
                        <div className="min-h-screen bg-gray-50">
                            <Navigation />
                            <main>
                                <Routes>
                                    <Route path="/" element={<HomePage />} />
                                    <Route path="/explore" element={<ExplorePage />} />
                                    <Route path="/mint" element={<MintPage />} />
                                    <Route path="/profile" element={<ProfilePage />} />
                                    <Route path="/settings" element={<UserSettingsPage />} />
                                </Routes>
                            </main>
                            <ToastNotifications />
                            <ErrorToast />
                        </div>
                    </Router>
                </NotificationProvider>
            </ErrorProvider>
        </ErrorBoundary>
    )
}

export default App
