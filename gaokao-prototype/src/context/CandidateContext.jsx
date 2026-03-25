import { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import { scoreToRank } from '../logic/rankEngine.js'

// ─── 初始状态 ──────────────────────────────────────────────
const STORAGE_KEY = 'bing-gaokao-candidate'

const defaultState = {
  province: '',         // 省份代码，如 'BJ'
  examType: '',         // 'old' | '3+1+2'
  score: null,          // 总分
  firstSubject: '',     // 首选科目（3+1+2）：'physics' | 'history'
  optionals: [],        // 再选科目（3+1+2）：如 ['chemistry', 'biology']
  interests: [],        // 兴趣标签，如 ['985', '理工', '北京']，供 ReportEngine 使用
  rank: null,           // 派生位次（由 scoreToRank 计算）
  total: null,          // 全省参考人数
  volunteers: [],       // [{ id, university, major, category, order }]
}

/** 从 localStorage 恢复状态（失败时返回 defaultState） */
function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState
    const parsed = JSON.parse(raw)
    return { ...defaultState, ...parsed }
  } catch {
    return defaultState
  }
}

// ─── Reducer ───────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {
    case 'SET_CANDIDATE': {
      const { province, examType, score, firstSubject, optionals, interests } = action.payload
      return { ...state, province, examType, score, firstSubject, optionals,
               interests: interests ?? state.interests }
    }
    case 'SET_RANK': {
      return { ...state, rank: action.payload.rank, total: action.payload.total }
    }
    case 'ADD_VOLUNTEER': {
      const { university, major, category } = action.payload
      // 防止重复添加（同院校+专业）
      const exists = state.volunteers.some(
        (v) => v.university.id === university.id && v.major?.id === major?.id
      )
      if (exists) return state
      const newVol = {
        id: `${university.id}-${major?.id ?? 'none'}-${Date.now()}`,
        university,
        major: major ?? null,
        category,
        order: state.volunteers.length,
      }
      return { ...state, volunteers: [...state.volunteers, newVol] }
    }
    case 'REMOVE_VOLUNTEER': {
      return {
        ...state,
        volunteers: state.volunteers.filter((v) => v.id !== action.payload.id),
      }
    }
    case 'REORDER_VOLUNTEERS': {
      // payload: 新顺序的 volunteers 数组
      return { ...state, volunteers: action.payload }
    }
    case 'RESET': {
      return defaultState
    }
    default:
      return state
  }
}

// ─── Context ───────────────────────────────────────────────
export const CandidateContext = createContext(null)

export function CandidateProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadFromStorage)

  // 当 score 或 province 变化时，自动重新计算位次
  useEffect(() => {
    if (state.score && state.province) {
      const result = scoreToRank(state.province, state.score)
      if (result) {
        dispatch({ type: 'SET_RANK', payload: result })
      } else {
        dispatch({ type: 'SET_RANK', payload: { rank: null, total: null } })
      }
    } else {
      dispatch({ type: 'SET_RANK', payload: { rank: null, total: null } })
    }
  }, [state.score, state.province])

  // localStorage 持久化（排除 rank/total，它们是派生值）
  useEffect(() => {
    const { rank, total, ...persistable } = state
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable))
    } catch {
      // 忽略 QuotaExceededError
    }
  }, [state])

  // ── Action Creators ──
  const setCandidate = useCallback((payload) => {
    dispatch({ type: 'SET_CANDIDATE', payload })
  }, [])

  const addVolunteer = useCallback((university, major, category) => {
    dispatch({ type: 'ADD_VOLUNTEER', payload: { university, major, category } })
  }, [])

  const removeVolunteer = useCallback((id) => {
    dispatch({ type: 'REMOVE_VOLUNTEER', payload: { id } })
  }, [])

  const reorderVolunteers = useCallback((newList) => {
    dispatch({ type: 'REORDER_VOLUNTEERS', payload: newList })
  }, [])

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' })
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const value = {
    ...state,
    setCandidate,
    addVolunteer,
    removeVolunteer,
    reorderVolunteers,
    reset,
  }

  return (
    <CandidateContext.Provider value={value}>
      {children}
    </CandidateContext.Provider>
  )
}

/** 便捷 Hook */
export function useCandidate() {
  const ctx = useContext(CandidateContext)
  if (!ctx) throw new Error('useCandidate must be used within CandidateProvider')
  return ctx
}
