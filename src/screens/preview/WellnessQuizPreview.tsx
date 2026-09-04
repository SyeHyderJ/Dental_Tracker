import { useState, useCallback } from 'react';
import { Timer, Home, List, Settings, BarChart } from 'lucide-react';
import backgroundImg from '../../assets/background.webp';
import styles from './WellnessQuizPreview.module.css';

const WellnessQuizPreview = () => {
  const [toggles, setToggles] = useState<boolean[]>([false, true, false, true]); // Sleep, Stress, Weight, Skin

  const toggleOption = useCallback((index: number) => {
    setToggles(prev => {
      const newToggles = [...prev];
      newToggles[index] = !newToggles[index];
      return newToggles;
    });
  }, []);

  return (
    <div className="relative flex items-center justify-center w-screen h-screen bg-[8a9aaa] overflow-hidden">
      {/* Phone Frame */}
      <div className="relative w-[375px] h-[780px] rounded-[52px] bg-[8a9aaa] overflow-hidden shadow-[inset_0_0_0_2px_rgba(255,255,255,0.08),0_0_0_1px_rgba(0,0,0,0.6),0_0_0_10px_#1a1a1e,0_0_0_11px_rgba(255,255,255,0.06),0_0_20px_rgba(0,0,0,0.1)]">
        {/* Dynamic Island */}
        <div className="absolute top-[24px] left-1/2 -translate-x-1/2 w-[120px] h-[32px] rounded-full bg-black z-[50]" />

        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={backgroundImg}
            alt="Background"
            className="absolute inset-0 w-full h-full object-cover blur-[12px] scale-110"
          />
          <div className="absolute inset-0 bg-[8a9aaa]/30" />
        </div>

        {/* Content */}
        <div className="absolute inset-0 flex flex-col items-center p-[56px_24px_24px] space-y-[24px] pt-[56px] pb-[24px]">
          {/* Header Badge */}
          <div className="flex items-center space-x-2 rounded-full px-[12px] py-[10px] bg-white/[0.01] backdrop-blur-[4px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
            <Timer className="w-[12px] h-[12px] text-white/[0.8]" />
            <span className="text-xs text-white/[0.9] font-medium">DentalTracker</span>
          </div>

          {/* Title Section */}
          <div className="flex flex-col items-center text-center space-y-2">
            <span className="text-[14px] text-white/[0.6]">Choose all that apply</span>
            <h1 className="text-[28px] text-white font-normal leading-tight tracking-tighter">
              What aspects of your wellness would you like to boost?
            </h1>
          </div>

          {/* Selection Grid */}
          <div className="w-full grid grid-cols-2 gap-[12px] flex-1">
            {['Sleep quality', 'Stress', 'Weight', 'Skin'].map((label, index) => {
              const isSelected = toggles[index];
              const number = String(index + 1).padStart(2, '0');
              return (
                <div
                  key={index}
                  onClick={() => toggleOption(index)}
                  className={`
                    rounded-[32px] h-[100px] px-[16px] py-[16px] flex flex-col items-start space-y-2
                    ${isSelected ? styles['liquid-glass-selected'] : styles['liquid-glass']}
                  `}
                >
                  <span className="text-[11px] text-white/[0.5] font-medium">{number}</span>
                  <span className="text-[16px] text-white font-medium">{label}</span>
                </div>
              );
            })}
          </div>

          {/* Voice Button */}
          <div className="flex flex-col items-center delay-700">
            <div className="relative w-[64px] h-[64px] rounded-full bg-white/[0.01] backdrop-blur-[4px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
              {/* Radial Gradient Glow */}
              <div className="absolute inset-0 rounded-full">
                <div className="absolute inset-0 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(220,200,80,0.5)_0%,rgba(180,160,40,0.2)_40%,transparent_70%)]" />
              </div>
              {/* Waveform Icon */}
              <svg className="absolute inset-0 w-full h-full stroke-[2] stroke-white stroke-linecap-round" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 12V4" />
                <path d="M8 12V8" />
                <path d="M12 12V12" />
                <path d="M16 12V16" />
                <path d="M20 12V20" />
              </svg>
            </div>
            <span className="mt-[2px] text-[12px] text-white/[0.7]">voice</span>
          </div>

          {/* Bottom Navigation Bar */}
          <div className="w-full flex justify-around items-center px-[4pt] pb-[4pt] delay-850">
            <div className="flex flex-col items-center space-x-[2pt]">
              <div className={`${styles['liquid-glass-selected']} px-[8pt] py-[4pt] rounded-[20px]`}>
                <Home className="w-[20px] h-[20px] text-white/[0.9]" />
                <span className="text-[11px] text-white/[0.9]">Home</span>
              </div>
            </div>
            <div className="flex flex-col items-center space-x-[2pt]">
              <div className={`${styles['liquid-glass']} px-[8pt] py-[4pt] rounded-[20px]`}>
                <List className="w-[20px] h-[20px] text-white/[0.5]" />
                <span className="text-[11px] text-white/[0.5]">History</span>
              </div>
            </div>
            <div className="flex flex-col items-center space-x-[2pt]">
              <div className={`${styles['liquid-glass']} px-[8pt] py-[4pt] rounded-[20px]`}>
                <BarChart className="w-[20px] h-[20px] text-white/[0.5]" />
                <span className="text-[11px] text-white/[0.5]">Chart</span>
              </div>
            </div>
            <div className="flex flex-col items-center space-x-[2pt]">
              <div className={`${styles['liquid-glass']} px-[8pt] py-[4pt] rounded-[20px]`}>
                <Settings className="w-[20px] h-[20px] text-white/[0.5]" />
                <span className="text-[11px] text-white/[0.5]">Settings</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WellnessQuizPreview;