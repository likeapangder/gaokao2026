import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2, GripVertical } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useCandidate } from '../context/CandidateContext.jsx'

const CATEGORY_CONFIG = {
  stretch: { label: '冲', emoji: '🚀', colorClass: 'col--stretch' },
  match:   { label: '稳', emoji: '🎯', colorClass: 'col--match' },
  safety:  { label: '保', emoji: '🛡️', colorClass: 'col--safety' },
}

/** 可拖拽的志愿卡片 */
function SortableVolunteerCard({ vol, onRemove }) {
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: vol.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 'auto',
  }

  const cat = CATEGORY_CONFIG[vol.category] ?? CATEGORY_CONFIG.match

  return (
    <div ref={setNodeRef} style={style} className="vol-card">
      {/* 拖拽手柄 */}
      <span
        className="vol-card__drag"
        {...attributes}
        {...listeners}
        aria-label="拖拽排序"
      >
        <GripVertical size={16} />
      </span>

      {/* 内容 */}
      <div className="vol-card__body">
        <div className="vol-card__header">
          <span className={`vol-card__cat cat--${vol.category}`}>{cat.label}</span>
          <strong className="vol-card__name">{vol.university.name}</strong>
        </div>
        <div className="vol-card__tags">
          {vol.university.level_tags.map((t) => (
            <span key={t} className="tag tag--level">{t}</span>
          ))}
        </div>
        {vol.major && (
          <p className="vol-card__major">专业：{vol.major.name}</p>
        )}
        <p className="vol-card__province">
          {vol.university.province} · {vol.university.type}
        </p>
      </div>

      {/* 删除按钮 */}
      <button
        className="vol-card__delete"
        onClick={() => onRemove(vol.id)}
        aria-label={`删除 ${vol.university.name}`}
      >
        <Trash2 size={15} />
      </button>
    </div>
  )
}

export default function VolunteerSheetPage() {
  const { volunteers, removeVolunteer, reorderVolunteers, score } = useCandidate()
  const navigate = useNavigate()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  // 按 category 分组
  const grouped = {
    stretch: volunteers.filter((v) => v.category === 'stretch'),
    match:   volunteers.filter((v) => v.category === 'match'),
    safety:  volunteers.filter((v) => v.category === 'safety'),
  }

  const handleDragEnd = useCallback(({ active, over }) => {
    if (!over || active.id === over.id) return

    const oldIndex = volunteers.findIndex((v) => v.id === active.id)
    const newIndex = volunteers.findIndex((v) => v.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const newList = arrayMove(volunteers, oldIndex, newIndex).map((v, i) => ({
      ...v,
      order: i,
    }))
    reorderVolunteers(newList)
  }, [volunteers, reorderVolunteers])

  if (!score) {
    return (
      <div className="page-empty">
        <div className="empty-icon">📝</div>
        <h2>请先填写成绩</h2>
        <p>填写成绩后，从志愿推荐页添加院校到志愿表。</p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>
          前往填写 →
        </button>
      </div>
    )
  }

  if (volunteers.length === 0) {
    return (
      <div className="page-empty">
        <div className="empty-icon">📋</div>
        <h2>志愿表还是空的</h2>
        <p>前往志愿推荐页，将心仪的院校添加到志愿表。</p>
        <button className="btn btn-primary" onClick={() => navigate('/recommendation')}>
          去推荐页添加 →
        </button>
      </div>
    )
  }

  return (
    <div className="volunteer-page page-container">
      {/* 页头 */}
      <div className="page-header">
        <h1 className="page-title">我的志愿表</h1>
        <p className="page-subtitle">
          共 <strong>{volunteers.length}</strong> 所院校 ·
          冲 {grouped.stretch.length} · 稳 {grouped.match.length} · 保 {grouped.safety.length}
          · 拖拽可调整顺序
        </p>
      </div>

      {/* 看板 — DnD 上下文 */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={volunteers.map((v) => v.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="kanban">
            {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
              <div key={key} className={`kanban-col ${cfg.colorClass}`}>
                <div className="kanban-col__header">
                  <span>{cfg.emoji}</span>
                  <h2>{cfg.label}（{grouped[key].length} 所）</h2>
                </div>
                <div className="kanban-col__list">
                  {grouped[key].length === 0 ? (
                    <div className="kanban-col__empty">
                      暂无{cfg.label}院校，前往推荐页添加
                    </div>
                  ) : (
                    grouped[key].map((vol) => (
                      <SortableVolunteerCard
                        key={vol.id}
                        vol={vol}
                        onRemove={removeVolunteer}
                      />
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
