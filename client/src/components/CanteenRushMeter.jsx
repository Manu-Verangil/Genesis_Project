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
  CheckCircle2,
  RefreshCw,
  Activity
} from 'lucide-react';
import { api } from '../api';

// Timeline slots from 8:30 AM to 9:00 PM (Night)
const BASE_TIME_SLOTS = [
  { time: '8:30 AM', hour24: 8.5, label: 'Breakfast' },
  { time: '9:30 AM', hour24: 9.5, label: 'Morning Rush' },
  { time: '10:30 AM', hour24: 10.5, label: 'Mid-Morning' },
  { time: '11:30 AM', hour24: 11.5, label: 'Pre-Lunch' },
  { time: '12:30 PM', hour24: 12.5, label: 'Class Break Surge' },
  { time: '1:15 PM', hour24: 13.25, label: 'Peak Lunch' },
  { time: '2:15 PM', hour24: 14.25, label: 'Post-Lunch Lull' },
  { time: '3:15 PM', hour24: 15.25, label: 'Quiet Study' },
  { time: '4:15 PM', hour24: 16.25, label: 'Tea & Snacks' },
  { time: '5:30 PM', hour24: 17.5, label: 'Evening Snacks' },
  { time: '6:45 PM', hour24: 18.75, label: 'Pre-Dinner Bites' },
  { time: '7:45 PM', hour24: 19.75, label: 'Dinner Rush' },
  { time: '8:45 PM', hour24: 20.75, label: 'Night Closing' }
];

export function CanteenRushMeter({
  selectedCanteenId,
  canteenName,
  currentCanteen,
  onRefreshData
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isUpdatingCrowd, setIsUpdatingCrowd] = useState(false);

  // Sync clock every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const currentHourDecimal = currentTime.getHours() + currentTime.getMinutes() / 60;
  const timeFormatted = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const todayFormatted = currentTime.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  // Effective real-time crowd level from currentCanteen prop
  const liveCrowdLevel = currentCanteen?.crowdLevel || 'Moderate';
  const liveActiveOrders = currentCanteen?.activeOrdersCount || 3;
  const isC2 = selectedCanteenId === 'canteen-2';

  // Real-time multiplier based on live crowd changes
  const crowdMultiplier = useMemo(() => {
    switch (liveCrowdLevel) {
      case 'Low':
        return 0.55;
      case 'Moderate':
        return 1.0;
      case 'Busy':
        return 1.35;
      case 'Rush Hour':
        return 1.65;
      default:
        return 1.0;
    }
  }, [liveCrowdLevel]);

  // Compute live dynamic schedule reflecting real-time kitchen changes
  const schedule = useMemo(() => {
    // Base profiles for today
    const baseCrowd = isC2
      ? [20, 45, 30, 42, 70, 80, 35, 30, 86, 60, 42, 60, 25]
      : [35, 58, 30, 50, 92, 95, 42, 25, 78, 38, 52, 84, 30];

    const baseWait = isC2
      ? [3, 6, 4, 6, 13, 16, 5, 4, 18, 9, 6, 11, 4]
      : [6, 9, 4, 8, 20, 24, 7, 4, 13, 6, 8, 17, 5];

    // Find closest current time slot index
    let closestIdx = 0;
    let minDiff = 999;
    BASE_TIME_SLOTS.forEach((slot, idx) => {
      const diff = Math.abs(slot.hour24 - currentHourDecimal);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = idx;
      }
    });

    return BASE_TIME_SLOTS.map((slot, i) => {
      // Dynamic shift: slots near the current hour react strongly to the live sudden surge/drop
      const distanceToNow = Math.abs(i - closestIdx);
      let slotMultiplier = 1.0;

      if (distanceToNow === 0) {
        // Current active slot reacts 100% to live crowd level
        slotMultiplier = crowdMultiplier;
      } else if (distanceToNow === 1) {
        // Immediate next/prev hour reflects 70% of live surge
        slotMultiplier = 1.0 + (crowdMultiplier - 1.0) * 0.7;
      } else if (distanceToNow === 2) {
        slotMultiplier = 1.0 + (crowdMultiplier - 1.0) * 0.35;
      }

      // Add extra wait if active orders are surging
      const ordersBonus = distanceToNow === 0 ? Math.round(Math.max(0, liveActiveOrders - 2) * 1.2) : 0;

      const computedCrowd = Math.min(
        98,
        Math.max(14, Math.round(baseCrowd[i] * slotMultiplier))
      );
      const computedWait = Math.min(
        35,
        Math.max(2, Math.round(baseWait[i] * slotMultiplier + ordersBonus))
      );

      let level = 'Low';
      if (computedCrowd >= 86 || computedWait >= 18) level = 'Critical';
      else if (computedCrowd >= 72 || computedWait >= 14) level = 'Peak';
      else if (computedCrowd >= 50 || computedWait >= 8) level = 'Busy';
      else if (computedCrowd >= 32 || computedWait >= 5) level = 'Moderate';

      return {
        time: slot.time,
        hour24: slot.hour24,
        label: slot.label,
        crowdPercent: computedCrowd,
        waitMinutes: computedWait,
        level
      };
    });
  }, [isC2, crowdMultiplier, currentHourDecimal, liveActiveOrders]);

  // Current active slot
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

  const activeSlot = schedule[currentSlotIndex] || schedule[0];

  // Dynamic advice reacting live to sudden rush jumps or drops
  const contextualAdvice = useMemo(() => {
    if (liveCrowdLevel === 'Rush Hour' || activeSlot.level === 'Critical' || activeSlot.level === 'Peak') {
      return {
        badge: '🔥 Sudden Surge Active',
        badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
        icon: Flame,
        title: `Kitchen Rush Active (~${activeSlot.waitMinutes} min queue)`,
        text: `Live sensors detect sudden rush surge at ${canteenName || 'canteen'}. Orders take ~${activeSlot.waitMinutes} mins to prepare. Pre-order your single-use token now to hold your place in line!`
      };
    } else if (liveCrowdLevel === 'Busy' || activeSlot.level === 'Busy') {
      return {
        badge: '🟠 Moderate-High Rush',
        badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: Zap,
        title: `Active Kitchen Movement (~${activeSlot.waitMinutes} min queue)`,
        text: `Kitchen is bustling with ${liveActiveOrders} active orders. Digital pickup token lets you skip the counter payment line directly.`
      };
    } else if (liveCrowdLevel === 'Low' || activeSlot.level === 'Low') {
      return {
        badge: '⚡ Rush Cleared / Low Wait',
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: Sparkles,
        title: `Queue Just Dropped to Low (~${activeSlot.waitMinutes} min wait)!`,
        text: `Live crowd has cleared up! Kitchen is preparing dishes in just ~${activeSlot.waitMinutes} mins. Best time to order without standing in any line.`
      };
    } else {
      return {
        badge: '🔵 Normal Flow',
        badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: Clock,
        title: `Steady Flow (~${activeSlot.waitMinutes} min wait)`,
        text: `Crowd density is moderate. Food preparation running smoothly with ~${activeSlot.waitMinutes} min turnaround.`
      };
    }
  }, [liveCrowdLevel, activeSlot, liveActiveOrders, canteenName]);

  const AdviceIcon = contextualAdvice.icon;

  // Handler to toggle live crowd during demo
  const handleSetCrowd = async (newLevel) => {
    try {
      setIsUpdatingCrowd(true);
      await api.updateCrowdLevel(selectedCanteenId, newLevel);
      if (onRefreshData) {
        await onRefreshData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdatingCrowd(false);
    }
  };

  const getBarColor = (level, isNow) => {
    if (isNow) return 'bg-[#B0003A] ring-2 ring-[#B0003A]/40 shadow-md';
    switch (level) {
      case 'Critical':
        return 'bg-rose-500 hover:bg-rose-600';
      case 'Peak':
        return 'bg-rose-400 hover:bg-rose-500';
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
    <div className="bg-white border border-[#E8E3D7] rounded-3xl p-4 sm:p-5 shadow-xs transition-all overflow-visible">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
              Real-time crowd response & predicted wait times (8:30 AM – 9:00 PM)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Live Clock Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-semibold text-slate-700">
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
          {/* Live Kitchen Real-Time Status Bar with Quick Live Crowd Toggle */}
          <div className="flex items-center justify-between flex-wrap gap-2.5 bg-slate-50 p-2.5 rounded-2xl border border-[#E8E3D7] text-xs">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>{todayFormatted} (Live Today)</span>
              </div>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500 text-[11px]">
                Active Kitchen Orders: <b className="text-slate-900 font-mono">{liveActiveOrders}</b>
              </span>
            </div>

            {/* Quick Live Crowd Selector: Allows immediate demonstration of sudden surge/drop */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-600 font-medium hidden sm:inline">Live Rush Sensor:</span>
              {[
                { level: 'Low', color: 'bg-emerald-500 text-white', border: 'border-emerald-500', active: liveCrowdLevel === 'Low' },
                { level: 'Moderate', color: 'bg-blue-500 text-white', border: 'border-blue-500', active: liveCrowdLevel === 'Moderate' },
                { level: 'Busy', color: 'bg-amber-500 text-white', border: 'border-amber-500', active: liveCrowdLevel === 'Busy' },
                { level: 'Rush Hour', color: 'bg-rose-500 text-white', border: 'border-rose-500', active: liveCrowdLevel === 'Rush Hour' }
              ].map((btn) => (
                <button
                  key={btn.level}
                  onClick={() => handleSetCrowd(btn.level)}
                  disabled={isUpdatingCrowd}
                  title={`Set live crowd to ${btn.level}`}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                    btn.active
                      ? `${btn.color} shadow-xs scale-105`
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {btn.level}
                </button>
              ))}
            </div>
          </div>

          {/* Hourly Visual Bars: Roomy padding-top (pt-9) so the "NOW" badge is NEVER cut off */}
          <div className="relative">
            <div className="flex items-end justify-between gap-1 sm:gap-2 overflow-x-auto pb-3 pt-9 px-2 scrollbar-none">
              {schedule.map((slot, idx) => {
                const isNow = idx === currentSlotIndex;
                const barHeight = Math.max(24, Math.round((slot.crowdPercent / 100) * 78));

                return (
                  <div
                    key={slot.time}
                    className={`flex flex-col items-center flex-1 min-w-[56px] sm:min-w-[62px] group transition-all duration-300 relative ${
                      isNow
                        ? 'scale-[1.03] z-20'
                        : 'opacity-85 hover:opacity-100'
                    }`}
                  >
                    {/* The "NOW" floating badge - Generous spacing, full pill shape, drop shadow, never cut off */}
                    {isNow && (
                      <div className="absolute -top-7.5 left-1/2 -translate-x-1/2 whitespace-nowrap z-30 pointer-events-none">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#B0003A] text-white text-[10px] font-extrabold shadow-md border border-white">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                          NOW
                        </span>
                      </div>
                    )}

                    {/* Wait time text above bar (e.g. ~4m, ~24m) */}
                    <span
                      className={`text-[10px] font-bold mb-1.5 transition-all duration-300 ${
                        isNow
                          ? 'text-[#B0003A] font-extrabold text-[11px]'
                          : 'text-slate-500 group-hover:text-slate-800'
                      }`}
                    >
                      ~{slot.waitMinutes}m
                    </span>

                    {/* Bar graphic */}
                    <div className="w-full bg-slate-100 rounded-t-lg h-[80px] flex items-end justify-center p-0.5">
                      <div
                        style={{ height: `${barHeight}px` }}
                        className={`w-full rounded-t-md transition-all duration-500 ${getBarColor(
                          slot.level,
                          isNow
                        )}`}
                      />
                    </div>

                    {/* Time Label */}
                    <span
                      className={`text-[10px] mt-2 whitespace-nowrap text-center ${
                        isNow ? 'font-extrabold text-[#B0003A]' : 'font-medium text-slate-600'
                      }`}
                    >
                      {slot.time}
                    </span>

                    {/* Status Subtitle */}
                    <span
                      className={`text-[9px] truncate max-w-full text-center mt-0.5 transition-all duration-300 ${
                        slot.level === 'Critical'
                          ? 'text-rose-600 font-bold'
                          : slot.level === 'Peak'
                          ? 'text-rose-500 font-semibold'
                          : slot.level === 'Busy'
                          ? 'text-amber-600 font-semibold'
                          : slot.level === 'Moderate'
                          ? 'text-blue-600 font-medium'
                          : 'text-emerald-600 font-medium'
                      }`}
                    >
                      {slot.level}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Card: Dynamic Contextual Advice & Legend */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50 p-3 sm:p-4 rounded-2xl border border-[#E8E3D7] transition-all duration-300">
            {/* Dynamic Advice reacting to sudden rush spikes or drops */}
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white border border-[#E8E3D7] flex items-center justify-center text-[#B0003A] shrink-0 shadow-2xs mt-0.5 sm:mt-0">
                <AdviceIcon className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-900">{contextualAdvice.title}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${contextualAdvice.badgeColor}`}>
                    {contextualAdvice.badge}
                  </span>
                </div>
                <p className="text-slate-600 text-[11px] mt-0.5 leading-snug">
                  {contextualAdvice.text}
                </p>
              </div>
            </div>

            {/* Quick Color Legend */}
            <div className="flex items-center gap-2.5 text-[10px] text-slate-500 font-medium shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                &lt;5m (Low)
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
