import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  Clock,
  Zap,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Users,
  Flame,
  Info
} from 'lucide-react';

// Hourly crowd profile tailored to campus schedule
const CANTEEN_1_SCHEDULE = [
  { time: '8:30 AM', hour24: 8.5, crowdPercent: 35, waitMinutes: 6, label: 'Breakfast', level: 'Low' },
  { time: '9:30 AM', hour24: 9.5, crowdPercent: 60, waitMinutes: 9, label: 'Morning Rush', level: 'Moderate' },
  { time: '10:30 AM', hour24: 10.5, crowdPercent: 30, waitMinutes: 4, label: 'Quiet', level: 'Low' },
  { time: '11:30 AM', hour24: 11.5, crowdPercent: 50, waitMinutes: 8, label: 'Pre-Lunch', level: 'Moderate' },
  { time: '12:30 PM', hour24: 12.5, crowdPercent: 92, waitMinutes: 20, label: 'Class Break Surge', level: 'Peak' },
  { time: '1:15 PM', hour24: 13.25, crowdPercent: 96, waitMinutes: 24, label: 'Peak Lunch', level: 'Critical' },
  { time: '2:15 PM', hour24: 14.25, crowdPercent: 45, waitMinutes: 7, label: 'Winding Down', level: 'Moderate' },
  { time: '3:15 PM', hour24: 15.25, crowdPercent: 25, waitMinutes: 4, label: 'Quiet Study', level: 'Low' },
  { time: '4:15 PM', hour24: 16.25, crowdPercent: 78, waitMinutes: 13, label: 'Tea & Snacks', level: 'Busy' },
  { time: '5:30 PM', hour24: 17.5, crowdPercent: 35, waitMinutes: 5, label: 'Evening', level: 'Low' }
];

const CANTEEN_2_SCHEDULE = [
  { time: '8:30 AM', hour24: 8.5, crowdPercent: 20, waitMinutes: 3, label: 'Opening', level: 'Low' },
  { time: '9:30 AM', hour24: 9.5, crowdPercent: 45, waitMinutes: 6, label: 'Coffee Rush', level: 'Moderate' },
  { time: '10:30 AM', hour24: 10.5, crowdPercent: 30, waitMinutes: 4, label: 'Quiet', level: 'Low' },
  { time: '11:30 AM', hour24: 11.5, crowdPercent: 40, waitMinutes: 5, label: 'Quick Bites', level: 'Low' },
  { time: '12:30 PM', hour24: 12.5, crowdPercent: 75, waitMinutes: 14, label: 'Lunch Overflow', level: 'Busy' },
  { time: '1:15 PM', hour24: 13.25, crowdPercent: 82, waitMinutes: 16, label: 'Lunch Peak', level: 'Peak' },
  { time: '2:15 PM', hour24: 14.25, crowdPercent: 35, waitMinutes: 5, label: 'Lull', level: 'Low' },
  { time: '3:15 PM', hour24: 15.25, crowdPercent: 30, waitMinutes: 4, label: 'Afternoon', level: 'Low' },
  { time: '4:15 PM', hour24: 16.25, crowdPercent: 88, waitMinutes: 18, label: 'Snacks Rush', level: 'Peak' },
  { time: '5:30 PM', hour24: 17.5, crowdPercent: 65, waitMinutes: 10, label: 'Juice & Chaat', level: 'Moderate' }
];

export function CanteenRushMeter({ selectedCanteenId, canteenName }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update clock every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const currentHourDecimal = currentTime.getHours() + currentTime.getMinutes() / 60;
  const timeFormatted = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const schedule = useMemo(() => {
    if (selectedCanteenId === 'canteen-2') {
      return CANTEEN_2_SCHEDULE;
    }
    return CANTEEN_1_SCHEDULE;
  }, [selectedCanteenId]);

  // Find nearest time slot
  const currentSlotIndex = useMemo(() => {
    let closestIdx = 0;
    let minDiff = 999;
    schedule.forEach((slot, idx) => {
      const diff = Math.abs(slot.hour24 - currentHourDecimal);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = idx;
      }
    });
    return closestIdx;
  }, [schedule, currentHourDecimal]);

  const activeSlot = schedule[currentSlotIndex];

  // Dynamic advice based on current time
  const getContextualAdvice = () => {
    if (currentHourDecimal >= 11.5 && currentHourDecimal <= 14.0) {
      return {
        badge: 'High Rush Window',
        badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
        icon: Flame,
        title: 'Lunch Break Rush is Active (~18–24 min queue)',
        text: 'Counter queues surge between 12:45 PM and 1:30 PM. Order your prepaid token right now to reserve kitchen prep before class lets out!'
      };
    } else if (currentHourDecimal >= 15.75 && currentHourDecimal <= 17.25) {
      return {
        badge: 'Snacks Peak',
        badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: Zap,
        title: 'Evening Tea & Quick Bites Surge (~12–16 min queue)',
        text: 'Snack items, juices, and hot beverages have high demand right now. Pre-ordering ensures immediate pickup.'
      };
    } else if (currentHourDecimal >= 8.0 && currentHourDecimal <= 10.0) {
      return {
        badge: 'Breakfast Hours',
        badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: Clock,
        title: 'Morning Breakfast Window (~6–9 min queue)',
        text: 'Fresh dosas, idlis, and hot coffee moving fast. Short counter lines with fast turnarounds.'
      };
    } else {
      return {
        badge: 'Optimal Window',
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: Sparkles,
        title: 'Off-Peak Quiet Window (~3–5 min wait)',
        text: 'Currently at lowest wait times! Kitchen staff prepare orders almost immediately without physical lines.'
      };
    }
  };

  const advice = getContextualAdvice();
  const AdviceIcon = advice.icon;

  const getBarColor = (level, isNow) => {
    if (isNow) return 'bg-[#B0003A] ring-2 ring-[#B0003A]/30 shadow-md';
    switch (level) {
      case 'Critical':
      case 'Peak':
        return 'bg-rose-500 hover:bg-rose-600';
      case 'Busy':
        return 'bg-amber-400 hover:bg-amber-500';
      case 'Moderate':
        return 'bg-blue-400 hover:bg-blue-500';
      case 'Low':
      default:
        return 'bg-emerald-400 hover:bg-emerald-500';
    }
  };

  return (
    <div className="bg-white border border-[#E8E3D7] rounded-3xl p-4 sm:p-5 shadow-xs transition-all">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#FFF0F4] border border-[#FFD0DD] flex items-center justify-center text-[#B0003A] shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-sm sm:text-base text-slate-900 tracking-tight">
                Live Rush-Hour Peak Meter
              </h3>
              <span className="hidden xs:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF0F4] text-[#B0003A] border border-[#FFD0DD]">
                {canteenName || 'Campus Canteen'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Hourly crowd density & predicted kitchen preparation delays
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Real-time Clock Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-semibold text-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Now: {timeFormatted}</span>
          </div>

          {/* Toggle Accordion Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition"
            title={isExpanded ? 'Collapse Peak Meter' : 'Expand Peak Meter'}
            aria-label="Toggle peak meter"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
          {/* Hourly Visual Bars */}
          <div className="relative">
            <div className="flex items-end justify-between gap-1.5 sm:gap-2.5 overflow-x-auto pb-2 pt-5 px-1 scrollbar-none">
              {schedule.map((slot, idx) => {
                const isNow = idx === currentSlotIndex;
                const barHeight = Math.max(24, Math.round((slot.crowdPercent / 100) * 76));

                return (
                  <div
                    key={slot.time}
                    className={`flex flex-col items-center flex-1 min-w-[54px] sm:min-w-[62px] group transition-all relative ${
                      isNow ? 'scale-[1.03]' : 'opacity-85 hover:opacity-100'
                    }`}
                  >
                    {/* Floating NOW badge above the current bar */}
                    {isNow && (
                      <div className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap z-10">
                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#B0003A] text-white text-[9px] font-extrabold shadow-sm animate-bounce">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                          NOW
                        </span>
                      </div>
                    )}

                    {/* Wait time pill on hover / active */}
                    <span
                      className={`text-[10px] font-bold mb-1.5 transition ${
                        isNow ? 'text-[#B0003A] font-extrabold' : 'text-slate-500 group-hover:text-slate-800'
                      }`}
                    >
                      ~{slot.waitMinutes}m
                    </span>

                    {/* Bar graphic */}
                    <div className="w-full bg-slate-100 rounded-t-lg h-[80px] flex items-end justify-center p-0.5">
                      <div
                        style={{ height: `${barHeight}px` }}
                        className={`w-full rounded-t-md transition-all duration-300 ${getBarColor(
                          slot.level,
                          isNow
                        )}`}
                      />
                    </div>

                    {/* Time Label */}
                    <span
                      className={`text-[10px] mt-2 whitespace-nowrap text-center ${
                        isNow ? 'font-bold text-[#B0003A]' : 'font-medium text-slate-600'
                      }`}
                    >
                      {slot.time}
                    </span>

                    {/* Status Subtitle */}
                    <span className="text-[9px] text-slate-600 truncate max-w-full text-center">
                      {slot.level}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Bar: Smart Prediction Advice & Legend */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50 p-3 sm:p-3.5 rounded-2xl border border-[#E8E3D7]">
            {/* Contextual Advice */}
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white border border-[#E8E3D7] flex items-center justify-center text-[#B0003A] shrink-0 shadow-2xs mt-0.5 sm:mt-0">
                <AdviceIcon className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-900">{advice.title}</span>
                  <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold border ${advice.badgeColor}`}>
                    {advice.badge}
                  </span>
                </div>
                <p className="text-slate-600 text-[11px] mt-0.5 leading-snug">
                  {advice.text}
                </p>
              </div>
            </div>

            {/* Quick Color Legend */}
            <div className="flex items-center gap-2.5 text-[10px] text-slate-500 font-medium shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                &lt;5m
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                5–10m
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                10–15m
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                15m+ (Peak)
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
