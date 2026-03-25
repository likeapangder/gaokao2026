import { useState } from 'react'
import SerpSchoolCard from './SerpSchoolCard.jsx'
import SerpMajorCard from './SerpMajorCard.jsx'

export default function SerpCardStack({ initialStack = [], onClose }) {
  const [stack, setStack] = useState(initialStack)

  if (stack.length === 0) return null

  const handleClose = () => {
    // 触发所有卡片关闭，或者直接清空
    if (onClose) onClose()
    setStack([])
  }

  const handleBack = () => {
    setStack((prev) => prev.slice(0, prev.length - 1))
  }

  const pushCard = (cardItem) => {
    setStack((prev) => [...prev, cardItem])
  }

  return (
    <div className="serp-stack-container">
      {stack.map((item, index) => {
        const isTop = index === stack.length - 1
        const isStacked = !isTop

        if (item.type === 'school') {
          return (
            <SerpSchoolCard
              key={`${item.type}-${item.id}-${index}`}
              schoolId={item.id}
              school={item.data} // 可选
              isStacked={isStacked}
              showBack={index > 0}
              onBack={handleBack}
              onClose={handleClose}
              onMajorClick={(major) => pushCard({ type: 'major', id: major.id, data: major })}
            />
          )
        }

        if (item.type === 'major') {
          return (
            <SerpMajorCard
              key={`${item.type}-${item.id}-${index}`}
              majorId={item.id}
              major={item.data} // 可选
              isStacked={isStacked}
              showBack={index > 0}
              onBack={handleBack}
              onClose={handleClose}
              onSchoolClick={(school) => pushCard({ type: 'school', id: school.id, data: school })}
            />
          )
        }

        return null
      })}
    </div>
  )
}
