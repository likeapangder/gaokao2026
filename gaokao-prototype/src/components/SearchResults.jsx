import { ExternalLink } from 'lucide-react';

function SearchResult({ title, url, description, date }) {
  return (
    <div className="search-result">
      <div className="result-header">
        <div className="result-url">
          <span className="result-domain">{new URL(url).hostname}</span>
          <ExternalLink size={12} className="external-icon" />
        </div>
        {date && <span className="result-date">{date}</span>}
      </div>
      <h3 className="result-title">{title}</h3>
      <p className="result-description">{description}</p>
    </div>
  );
}

export function SearchResults() {
  const results = [
    {
      title: '中国高考制度改革研究：历史演进与未来展望 - 北京大学教育学院',
      url: 'https://www.pku.edu.cn/research/gaokao-reform',
      description: '本研究系统分析了中国高考制度从1977年恢复以来的演变过程，探讨了新高考改革背景下的选拔机制创新。研究发现，综合素质评价与学科选择自主权的提升显著改善了人才选拔的科学性...',
      date: '2025-12',
    },
    {
      title: 'The Impact of Gaokao on Educational Equity in China - Tsinghua Education Review',
      url: 'https://journals.tsinghua.edu.cn/ter/gaokao-equity',
      description: 'This longitudinal study examines the relationship between China\'s National College Entrance Examination (Gaokao) and educational equity across different regions. Using data from 2015-2025, we analyze admission rates and socioeconomic factors...',
      date: '2026-01',
    },
    {
      title: '高考志愿填报决策模型：基于机器学习的智能推荐系统 - 中国科学技术大学计算机学院',
      url: 'https://cs.ustc.edu.cn/research/gaokao-ml',
      description: '本文提出了一种基于深度学习的高考志愿填报推荐算法，结合历史录取数据、考生成绩分布和专业就业前景等多维度特征。实验结果表明，该模型的推荐准确率达到92.3%，显著优于传统方法...',
      date: '2025-11',
    },
    {
      title: 'Psychological Stress and Coping Strategies Among Gaokao Candidates - Journal of Chinese Psychology',
      url: 'https://psych.journals.cn/gaokao-stress-2026',
      description: 'A comprehensive study investigating stress levels and mental health interventions for high school students preparing for Gaokao. Survey data from 5,000 candidates reveals significant correlations between preparation strategies and psychological well-being...',
      date: '2026-02',
    },
  ];

  return (
    <div className="search-results">
      <div className="results-info">
        找到约 <strong>3,580,000</strong> 条学术结果 <span className="results-time">(用时 0.38 秒)</span>
      </div>

      {results.map((result, index) => (
        <SearchResult key={index} {...result} />
      ))}
    </div>
  );
}
