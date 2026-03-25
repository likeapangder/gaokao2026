import { useState, useMemo } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine,
} from 'recharts'
import { useCandidate } from '../context/CandidateContext.jsx'
import { scoreRankTables } from '../data/scoreRankTable.js'
import { ALL_PROVINCES } from '../hooks/useProvinceLayout.js'
import { PROVINCE_NAMES } from '../data/schemas.js'

const YEARS = [2025, 2024, 2023]

/** 自定义 Tooltip */
function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="chart-tooltip">
      <p><strong>{d.score} 分</strong></p>
      <p>累计位次：{d.rank?.toLocaleString()} 名</p>
      <p>该分人数：{d.count} 人</p>
    </div>
  )
}

export default function ScoreRankPage() {
  const { province: candidateProvince, score: candidateScore } = useCandidate()

  const [selectedProvince, setSelectedProvince] = useState(candidateProvince || 'JS')
  const [selectedYear, setSelectedYear]         = useState(2025)
  const [queryScore, setQueryScore]             = useState(candidateScore ?? '')
  const [viewMode, setViewMode]                 = useState('chart') // 'chart' | 'table'

  // 取一分一段数据
  const tableData = useMemo(() => {
    const entry = scoreRankTables.find(
      (t) => t.province_id === selectedProvince && t.year === selectedYear
    )
    if (!entry) return []
    // 为了图表性能，每隔 3 分取一个点
    return entry.table.filter((_, i) => i % 3 === 0)
  }, [selectedProvince, selectedYear])

  const fullTable = useMemo(() => {
    const entry = scoreRankTables.find(
      (t) => t.province_id === selectedProvince && t.year === selectedYear
    )
    return entry?.table ?? []
  }, [selectedProvince, selectedYear])

  // 查询结果
  const queryResult = useMemo(() => {
    if (!queryScore || !fullTable.length) return null
    const s = Number(queryScore)
    const row = fullTable.find((r) => r.score === s)
    if (row) return row
    // 取最接近的
    const closest = fullTable.reduce((prev, cur) =>
      Math.abs(cur.score - s) < Math.abs(prev.score - s) ? cur : prev
    )
    return closest
  }, [queryScore, fullTable])

  const provinceName = PROVINCE_NAMES[selectedProvince] || selectedProvince

  return (
    <div className="score-rank-page page-container">
      <div className="page-header">
        <h1 className="page-title">一分一段表</h1>
        <p className="page-subtitle">
          {provinceName} · {selectedYear} 年 · 交互式位次查询
        </p>
      </div>

      {/* 控制栏 */}
      <div className="score-rank-controls">
        {/* 省份 */}
        <div className="control-group">
          <label>省份</label>
          <select value={selectedProvince} onChange={(e) => setSelectedProvince(e.target.value)}>
            {ALL_PROVINCES.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </div>

        {/* 年份 */}
        <div className="control-group">
          <label>年份</label>
          <div className="filter-chips">
            {YEARS.map((y) => (
              <button
                key={y}
                className={`chip ${selectedYear === y ? 'chip--active' : ''}`}
                onClick={() => setSelectedYear(y)}
              >
                {y}
              </button>
            ))}
          </div>
        </div>

        {/* 查分 */}
        <div className="control-group">
          <label>查询分数</label>
          <div className="score-query-input">
            <input
              type="number"
              value={queryScore}
              onChange={(e) => setQueryScore(e.target.value)}
              placeholder="输入分数..."
              min={0}
              max={750}
            />
          </div>
        </div>

        {/* 视图切换 */}
        <div className="control-group">
          <label>视图</label>
          <div className="filter-chips">
            <button
              className={`chip ${viewMode === 'chart' ? 'chip--active' : ''}`}
              onClick={() => setViewMode('chart')}
            >
              图表
            </button>
            <button
              className={`chip ${viewMode === 'table' ? 'chip--active' : ''}`}
              onClick={() => setViewMode('table')}
            >
              表格
            </button>
          </div>
        </div>
      </div>

      {/* 查询结果卡片 */}
      {queryResult && (
        <div className="query-result-card">
          <div className="query-result__item">
            <span>查询分数</span>
            <strong>{queryResult.score} 分</strong>
          </div>
          <div className="query-result__divider" />
          <div className="query-result__item">
            <span>累计位次</span>
            <strong className="accent">{queryResult.rank.toLocaleString()} 名</strong>
          </div>
          <div className="query-result__divider" />
          <div className="query-result__item">
            <span>该分人数</span>
            <strong>{queryResult.count} 人</strong>
          </div>
          {fullTable[fullTable.length - 1] && (
            <>
              <div className="query-result__divider" />
              <div className="query-result__item">
                <span>超过考生</span>
                <strong className="accent">
                  {(
                    ((fullTable[fullTable.length - 1].rank - queryResult.rank) /
                      fullTable[fullTable.length - 1].rank) * 100
                  ).toFixed(1)}%
                </strong>
              </div>
            </>
          )}
        </div>
      )}

      {/* 图表 / 表格 */}
      {viewMode === 'chart' ? (
        <div className="score-chart">
          {tableData.length === 0 ? (
            <div className="page-empty"><p>暂无该省份/年份数据</p></div>
          ) : (
            <ResponsiveContainer width="100%" height={380}>
              <AreaChart data={tableData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                <defs>
                  <linearGradient id="rankGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="var(--fluent-accent)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="var(--fluent-accent)" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis
                  dataKey="score"
                  label={{ value: '分数', position: 'insideBottomRight', offset: -5, fontSize: 12 }}
                  tick={{ fontSize: 11 }}
                  reversed
                />
                <YAxis
                  tickFormatter={(v) => v >= 10000 ? `${(v / 10000).toFixed(0)}万` : v}
                  tick={{ fontSize: 11 }}
                  label={{ value: '位次', angle: -90, position: 'insideLeft', fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                {queryResult && (
                  <ReferenceLine
                    x={queryResult.score}
                    stroke="var(--color-stretch)"
                    strokeDasharray="4 4"
                    label={{ value: `${queryResult.score}分`, fill: 'var(--color-stretch)', fontSize: 11 }}
                  />
                )}
                <Area
                  type="monotone"
                  dataKey="rank"
                  stroke="var(--fluent-accent)"
                  strokeWidth={2}
                  fill="url(#rankGrad)"
                  dot={false}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      ) : (
        <div className="score-table-wrap">
          <table className="score-table">
            <thead>
              <tr>
                <th>分数</th>
                <th>该分人数</th>
                <th>累计位次</th>
              </tr>
            </thead>
            <tbody>
              {fullTable.slice(0, 200).map((row) => (
                <tr
                  key={row.score}
                  className={queryResult?.score === row.score ? 'score-table__highlight' : ''}
                >
                  <td>{row.score}</td>
                  <td>{row.count}</td>
                  <td>{row.rank.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {fullTable.length > 200 && (
            <p className="table-note">仅展示前 200 条，使用图表模式查看完整分布</p>
          )}
        </div>
      )}
    </div>
  )
}
