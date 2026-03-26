import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CandidateProvider } from './context/CandidateContext.jsx'
import { UIProvider } from './context/UIContext.jsx'
import ToastContainer from './components/ToastContainer.jsx'
import AppRouter from './router.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CandidateProvider>
      <UIProvider>
        <AppRouter />
        <ToastContainer />
      </UIProvider>
    </CandidateProvider>
  </StrictMode>,
)
