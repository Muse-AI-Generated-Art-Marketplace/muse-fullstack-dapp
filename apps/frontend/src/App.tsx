import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { ErrorProvider } from '@/contexts/ErrorContext'
import { WebSocketProvider } from '@/contexts/WebSocketContext'
import { PageErrorBoundary } from '@/components/error'
import { ToastNotifications } from '@/components/Notifications/ToastNotifications'
import { RealTimeNotifications } from '@/components/Notifications/RealTimeNotifications'
import { ErrorToast } from '@/components/ErrorToast'
import { Navigation } from '@/components/composite/Navigation'
import { HomePage } from '@/pages/HomePage'
import { ExplorePage } from '@/pages/ExplorePage'
import { MintPage } from '@/pages/MintPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { UserSettingsPage } from '@/pages/UserSettingsPage'
import { ErrorTestPage } from '@/pages/ErrorTestPage'

function App() {
    return (
        <PageErrorBoundary name="App">
            <ErrorProvider>
                <WebSocketProvider>
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
                                        <Route path="/error-test" element={<ErrorTestPage />} />
                                    </Routes>
                                </main>
                                <ToastNotifications />
                                <ErrorToast />
                                <RealTimeNotifications />
                            </div>
                        </Router>
                    </NotificationProvider>
                </WebSocketProvider>
            </ErrorProvider>
        </PageErrorBoundary>
    )
}

export default App
