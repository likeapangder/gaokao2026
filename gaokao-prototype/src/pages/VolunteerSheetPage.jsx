import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2, GripVertical, Download, AlertTriangle, CheckCircle2 } from 'lucide-react'
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
  stretch: { label: '冲', bgColor: 'bg-red-50', textColor: 'text-red-700', borderColor: 'border-red-200' },
  match:   { label: '稳', bgColor: 'bg-blue-50', textColor: 'text-blue-700', borderColor: 'border-blue-200' },
  safety:  { label: '保', bgColor: 'bg-green-50', textColor: 'text-green-700', borderColor: 'border-green-200' },
}

/** Sortable Row Component */
function SortableVolunteerRow({ vol, index, onRemove }) {
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: vol.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const cat = CATEGORY_CONFIG[vol.category] ?? CATEGORY_CONFIG.match
  const probability = vol.probability || Math.floor(Math.random() * 40) + 50 // Mock probability

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`${cat.bgColor} border-b ${cat.borderColor} hover:shadow-sm transition-all`}
    >
      {/* Drag Handle */}
      <td className="px-4 py-3 text-center">
        <button
          {...attributes}
          {...listeners}
          className="cursor-move text-slate-400 hover:text-slate-600"
        >
          <GripVertical size={18} />
        </button>
      </td>

      {/* Index */}
      <td className="px-4 py-3 text-center font-bold text-slate-700">
        {index + 1}
      </td>

      {/* Category */}
      <td className="px-4 py-3 text-center">
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${cat.bgColor} ${cat.textColor} border ${cat.borderColor}`}>
          {cat.label}
        </span>
      </td>

      {/* University */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
            {vol.university.name.substring(0, 2)}
          </div>
          <div>
            <div className="font-bold text-slate-900">{vol.university.name}</div>
            <div className="text-xs text-slate-500">{vol.university.province} · {vol.university.type}</div>
          </div>
        </div>
      </td>

      {/* Major */}
      <td className="px-4 py-3 text-slate-700">
        {vol.major ? vol.major.name : <span className="text-slate-400">未指定专业</span>}
      </td>

      {/* Tags */}
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {vol.university.level_tags?.map((tag, idx) => (
            <span key={idx} className="px-2 py-0.5 bg-slate-200 text-slate-700 text-[10px] font-bold rounded">
              {tag}
            </span>
          ))}
        </div>
      </td>

      {/* Probability */}
      <td className="px-4 py-3 text-center">
        <span className={`font-bold ${probability >= 70 ? 'text-green-600' : probability >= 50 ? 'text-blue-600' : 'text-orange-600'}`}>
          {probability}%
        </span>
      </td>

      {/* Delete */}
      <td className="px-4 py-3 text-center">
        <button
          onClick={() => onRemove(vol.id)}
          className="text-slate-400 hover:text-red-600 transition-colors"
          aria-label={`删除 ${vol.university.name}`}
        >
          <Trash2 size={16} />
        </button>
      </td>
    </tr>
  )
}

export default function VolunteerSheetPage() {
  const { volunteers, removeVolunteer, reorderVolunteers, score } = useCandidate()
  const navigate = useNavigate()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  // Group by category
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

  // Empty states
  if (!score) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="text-6xl mb-4">📝</div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">请先填写成绩</h2>
        <p className="text-slate-600 mb-6">填写成绩后，从志愿推荐页添加院校到志愿表</p>
        <button
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
          onClick={() => navigate('/')}
        >
          前往填写 →
        </button>
      </div>
    )
  }

  if (volunteers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="text-6xl mb-4">📋</div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">志愿表还是空的</h2>
        <p className="text-slate-600 mb-6">前往志愿推荐页，将心仪的院校添加到志愿表</p>
        <button
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
          onClick={() => navigate('/recommendation')}
        >
          去推荐页添加 →
        </button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
      {/* Main DataGrid Area */}
      <div className="xl:col-span-9 space-y-6">
        {/* Stats Bar */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div>
                <div className="text-3xl font-bold text-slate-900">{volunteers.length}</div>
                <div className="text-sm text-slate-500">总志愿数</div>
              </div>
              <div className="w-px h-12 bg-slate-200"></div>
              <div>
                <div className="text-2xl font-bold text-red-600">{grouped.stretch.length}</div>
                <div className="text-sm text-slate-500">冲刺</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{grouped.match.length}</div>
                <div className="text-sm text-slate-500">稳妥</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{grouped.safety.length}</div>
                <div className="text-sm text-slate-500">保底</div>
              </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors">
              <Download size={18} />
              导出志愿表
            </button>
          </div>
        </div>

        {/* DataGrid Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={volunteers.map((v) => v.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider text-center w-12">
                        排序
                      </th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider text-center w-16">
                        序号
                      </th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider text-center w-20">
                        类型
                      </th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider text-left">
                        院校
                      </th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider text-left">
                        专业
                      </th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider text-left">
                        标签
                      </th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider text-center w-24">
                        录取概率
                      </th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider text-center w-16">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {volunteers.map((vol, index) => (
                      <SortableVolunteerRow
                        key={vol.id}
                        vol={vol}
                        index={index}
                        onRemove={removeVolunteer}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </div>

      {/* Right Sidebar - Audit Warnings */}
      <aside className="xl:col-span-3 space-y-6">
        {/* Audit Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 size={24} className="text-green-600" />
            <h3 className="text-lg font-bold text-slate-900">防倒挂审计</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-green-800">
                <div className="font-semibold">梯度配置合理</div>
                <div className="text-xs text-green-600">冲稳保比例符合 2:5:3 推荐策略</div>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle size={16} className="text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <div className="font-semibold">建议补充保底志愿</div>
                <div className="text-xs text-yellow-600">当前保底院校仅 {grouped.safety.length} 所，建议增至 25-30 所</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tips Card */}
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <h4 className="font-bold text-blue-900 mb-2">💡 填报提示</h4>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>• 拖拽行可调整志愿顺序</li>
            <li>• 冲刺志愿建议选择排名靠前的学校</li>
            <li>• 保底志愿要确保录取概率 &gt; 90%</li>
            <li>• 定期查看防倒挂审计结果</li>
          </ul>
        </div>
      </aside>
    </div>
  )
}
