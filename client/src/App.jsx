import { useState } from 'react'
import { ThemeProvider } from './contexts/ThemeContext'
import BottomNav from './components/BottomNav'
import HomePage from './pages/HomePage'
import CustomersPage from './pages/CustomersPage'
import ReportPage from './pages/ReportPage'
import SettingsPage from './pages/SettingsPage'

function AppContent() {
  const [tab, setTab] = useState('home')
  const [showSettings, setShowSettings] = useState(false)

  if (showSettings) {
    return <SettingsPage onBack={() => setShowSettings(false)} />
  }

  return (
    <>
      {tab === 'home' && <HomePage onNavigateSettings={() => setShowSettings(true)} />}
      {tab === 'customers' && <CustomersPage />}
      {tab === 'report' && <ReportPage />}
      <BottomNav active={tab} onNavigate={setTab} />
    </>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  )
}
