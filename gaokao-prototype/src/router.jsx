import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import ScoreInputModal from './components/ScoreInputModal.jsx'
import { useUI } from './context/UIContext.jsx'

// 页面导入
import HomePage from './pages/HomePage.jsx'
import RecommendationPage from './pages/RecommendationPage.jsx'
import VolunteerSheetPage from './pages/VolunteerSheetPage.jsx'
import AIReportPage from './pages/AIReportPage.jsx'
import UniWikiPage from './pages/UniWikiPage.jsx'
import MajorWikiPage from './pages/MajorWikiPage.jsx'
import ScoreRankPage from './pages/ScoreRankPage.jsx'

/** 根布局组件 — 从 UIContext 取 modal 状态，不再本地持有 */
function RootLayout() {
  const { scoreModalOpen, openScoreModal, closeScoreModal } = useUI()

  return (
    <Layout onOpenScoreModal={openScoreModal}>
      <Outlet />
      {scoreModalOpen && (
        <ScoreInputModal onClose={closeScoreModal} />
      )}
    </Layout>
  )
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true,            element: <HomePage /> },
      { path: 'recommendation', element: <RecommendationPage /> },
      { path: 'volunteers',     element: <VolunteerSheetPage /> },
      { path: 'ai-report',      element: <AIReportPage /> },
      { path: 'wiki/uni',       element: <UniWikiPage /> },
      { path: 'wiki/major',     element: <MajorWikiPage /> },
      { path: 'score-rank',     element: <ScoreRankPage /> },
    ],
  },
])

export default function AppRouter() {
  return <RouterProvider router={router} />
}
