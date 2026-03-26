import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import WorkspaceLayout from './components/WorkspaceLayout.jsx'
import ScoreInputModal from './components/ScoreInputModal.jsx'
import { useUI } from './context/UIContext.jsx'

// SERP Mode Pages (Search/Browse)
import HomePage from './pages/HomePage.jsx'
import RecommendationPage from './pages/RecommendationPage.jsx'
import UniWikiPage from './pages/UniWikiPage.jsx'
import MajorWikiPage from './pages/MajorWikiPage.jsx'
import ScoreRankPage from './pages/ScoreRankPage.jsx'

// Workspace Mode Pages (Production/Document)
import VolunteerSheetPage from './pages/VolunteerSheetPage.jsx'
import AIReportPage from './pages/AIReportPage.jsx'

/** SERP 模式根布局 — 使用标准 Layout (8:4 或 7:3 网格) */
function SerpLayout() {
  const { scoreModalOpen, scoreModalInitialExpanded, openScoreModal, closeScoreModal } = useUI()

  return (
    <Layout onOpenScoreModal={openScoreModal}>
      <Outlet />
      {scoreModalOpen && (
        <ScoreInputModal onClose={closeScoreModal} initialExpanded={scoreModalInitialExpanded} />
      )}
    </Layout>
  )
}

/** Workspace 模式根布局 — 使用 WorkspaceLayout (全宽生产力布局) */
function WorkspaceRootLayout() {
  const { scoreModalOpen, scoreModalInitialExpanded, openScoreModal, closeScoreModal } = useUI()

  return (
    <WorkspaceLayout onOpenScoreModal={openScoreModal}>
      <Outlet />
      {scoreModalOpen && (
        <ScoreInputModal onClose={closeScoreModal} initialExpanded={scoreModalInitialExpanded} />
      )}
    </WorkspaceLayout>
  )
}

const router = createBrowserRouter([
  // ── SERP Mode Routes (搜索浏览模式) ──
  {
    path: '/',
    element: <SerpLayout />,
    children: [
      { index: true,            element: <HomePage /> },
      { path: 'recommendation', element: <RecommendationPage /> },
      { path: 'wiki/uni',       element: <UniWikiPage /> },
      { path: 'wiki/major',     element: <MajorWikiPage /> },
      { path: 'score-rank',     element: <ScoreRankPage /> },
    ],
  },

  // ── Workspace Mode Routes (工作台模式) ──
  {
    path: '/sheet',
    element: <WorkspaceRootLayout />,
    children: [
      { index: true, element: <VolunteerSheetPage /> },
    ],
  },
  {
    path: '/ai-report',
    element: <WorkspaceRootLayout />,
    children: [
      { index: true, element: <AIReportPage /> },
    ],
  },
])

export default function AppRouter() {
  return <RouterProvider router={router} />
}
