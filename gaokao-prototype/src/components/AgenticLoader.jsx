import React, { useState, useEffect } from 'react';
import { Cpu, FileSearch, BrainCircuit, ShieldCheck, CheckCircle2 } from 'lucide-react';

/**
 * AI Agentic 思考状态机组件
 *
 * @param {boolean} isOpen - 是否激活全屏加载状态
 * @param {Function} onComplete - 思考结束后的回调 (跳转页面等)
 */
const AgenticLoader = ({ isOpen, onComplete }) => {
  const [step, setStep] = useState(0);

  // 状态机配置
  const STEPS = [
    { icon: <Cpu className="w-12 h-12 text-blue-600 animate-pulse" />, text: "初始化核心算法引擎..." },
    { icon: <FileSearch className="w-12 h-12 text-purple-600 animate-bounce" />, text: "正在解析您的选科与偏好矩阵..." },
    { icon: <BrainCircuit className="w-12 h-12 text-indigo-600 animate-spin-slow" />, text: "运行 2:5:3 策略加权算法..." },
    { icon: <ShieldCheck className="w-12 h-12 text-teal-600 animate-pulse" />, text: "进行位次博弈与防呆审计..." },
    { icon: <CheckCircle2 className="w-16 h-16 text-green-500 scale-110 transition-all duration-500" />, text: "方案组装完成！" }
  ];

  useEffect(() => {
    if (!isOpen) {
      setStep(0);
      return;
    }

    const totalSteps = STEPS.length;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      if (currentStep < totalSteps) {
        setStep(currentStep);
      } else {
        clearInterval(timer);
        // 延迟一点触发完成回调，让用户看清"完成"状态
        setTimeout(() => {
          onComplete && onComplete();
        }, 800);
      }
    }, 600); // 600ms 切换一次文案

    return () => clearInterval(timer);
  }, [isOpen, onComplete]);

  if (!isOpen) return null;

  const currentConfig = STEPS[step] || STEPS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-xl">
      <div className="flex flex-col items-center space-y-8 animate-fade-in-up">
        {/* 动态图标容器 */}
        <div className="relative flex items-center justify-center w-24 h-24 bg-white rounded-full shadow-xl ring-1 ring-black/5">
           {currentConfig.icon}

           {/* 装饰性光环 - 仅在非完成态显示 */}
           {step < STEPS.length - 1 && (
             <div className="absolute inset-0 rounded-full border-4 border-blue-500/20 animate-ping-slow" />
           )}
        </div>

        {/* 状态文案 */}
        <div className="text-center space-y-2">
          <h2 className="text-xl font-medium text-slate-800 tracking-wide">
            {currentConfig.text}
          </h2>
          <p className="text-sm text-slate-500">
            Bing Gaokao AI Agent is thinking...
          </p>
        </div>

        {/* 进度指示条 (可选) */}
        <div className="w-64 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500 ease-out"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default AgenticLoader;
