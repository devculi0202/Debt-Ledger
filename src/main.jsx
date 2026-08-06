import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ToastProvider } from '@/shared/ui/Toast'
import { QueryProvider } from '@/app/providers/QueryProvider'
import ErrorBoundary from '@/widgets/ErrorBoundary'
import './index.css'
import App from '@/app/App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <QueryProvider>
        <ToastProvider>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </ToastProvider>
      </QueryProvider>
    </BrowserRouter>
  </StrictMode>,
)
