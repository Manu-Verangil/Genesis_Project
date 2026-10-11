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
  Activity,
  CheckCircle2
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

  // Real-time live active orders count (reacts dynamically to orders created / completed)
  const [liveOrdersCount, setLiveOrdersCount] = useState(currentCanteen?.activeOrdersCount ?? 4);

  // Sync whenever canteen changes
  useEffect(() => {
    if (typeof currentCanteen?.activeOrdersCount === 'number') {
      setLiveOrdersCount(currentCanteen.activeOrdersCount);
    }
  }, [currentCanteen?.activeOrdersCount, selectedCanteenId]);

  // Live polling: updates order count every 3 seconds so placing or finishing orders reflects instantly!
  useEffect(() => {
    let isMounted = true;
    const fetchActiveOrders = async () => {
      try {
        const res = await api.getOrders({ canteenId: selectedCanteenId });
        if (res && res.success && Array.isArray(res.data) && isMounted) {
          const activeOrders = res.data.filter((o) =>
            ['serving', 'ready', 'cooking', 'received'].includes(o.status)
          );
          setLiveOrdersCount(activeOrders.length);
        }
      } catch (err) {
        // Fallback silently
      }
    };

    fetchActiveOrders();
    const interval = setInterval(fetchActiveOrders, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [selectedCanteenId]);

  // Clock updates
  useEffect(() => {
    const clockTimer = setInterval(() => setCurrentTime(new Date()), 15000);
    return () => clearInterval(clockTimer);
  }, []);

  const currentHourDecimal = currentTime.getHours() + currentTime.getMinutes() / 60;
  const timeFormatted = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const todayFormatted = currentTime.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  const isC2 = selectedCanteenId === 'canteen-2';

  // Dynamic multiplier driven directly by real-time kitchen order volume:
  // 0–2 orders = Low load (0.65x)
  // 3–4 orders = Moderate load (1.0x)
  // 5–6 orders = Busy load (1.35x)
  // 7+ orders = Rush Hour (1.7x)
  const orderLoadMultiplier = useMemo(() => {
    if (liveOrdersCount <= 2) return 0.65;
    if (liveOrdersCount <= 4) return 1.0;
    if (liveOrdersCount <= 6) return 1.35;
    return 1.7;
  }, [liveOrdersCount]);

  // Compute live schedule dynamically linked to liveOrdersCount
  const schedule = useMemo(() => {
    // Base curves
    const baseCrowd = isC2
      ? [20, 45, 30, 42, 70, 80, 35, 30, 86, 60, 42, 60, 25]
      : [35, 58, 30, 50, 92, 95, 42, 25, 78, 38, 52, 84, 30];

    const baseWait = isC2
      ? [3, 6, 4, 6, 13, 16, 5, 4, 18, 9, 6, 11, 4]
      : [6, 9, 4, 8, 20, 24, 7, 4, 13, 6, 8, 17, 5];

    // Find current time slot
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
      const distanceToNow = Math.abs(i - closestIdx);
      let slotMultiplier = 1.0;

      if (distanceToNow === 0) {
        // Current active hour responds directly to live order queue load
        slotMultiplier = orderLoadMultiplier;
      } else if (distanceToNow === 1) {
        slotMultiplier = 1.0 + (orderLoadMultiplier - 1.0) * 0.65;
      } else if (distanceToNow === 2) {
        slotMultiplier = 1.0 + (orderLoadMultiplier - 1.0) * 0.3;
      }

      // Each active order adds realistic prep queue time
      const orderDelayBonus = distanceToNow === 0 ? Math.round(liveOrdersCount * 1.5) : 0;

      const computedCrowd = Math.min(
        98,
        Math.max(12, Math.round(baseCrowd[i] * slotMultiplier))
      );
      const computedWait = Math.min(
        35,
        Math.max(2, Math.round(baseWait[i] * slotMultiplier + orderDelayBonus))
      );

      let level = 'Low';
      if (computedCrowd >= 85 || computedWait >= 18) level = 'Critical';
      else if (computedCrowd >= 70 || computedWait >= 13) level = 'Peak';
      else if (computedCrowd >= 48 || computedWait >= 8) level = 'Busy';
      else if (computedCrowd >= 30 || computedWait >= 5) level = 'Moderate';

      return {
        time: slot.time,
        hour24: slot.hour24,
        label: slot.label,
        crowdPercent: computedCrowd,
        waitMinutes: computedWait,
        level
      };
    });
  }, [isC2, orderLoadMultiplier, currentHourDecimal, liveOrdersCount]);

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

  // Dynamic advice reacting directly to live kitchen order load
  const contextualAdvice = useMemo(() => {
    if (liveOrdersCount >= 7 || activeSlot.level === 'Critical' || activeSlot.level === 'Peak') {
      return {
        badge: `🔥 Kitchen Queue Surge (${liveOrdersCount} Active)`,
        badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
        icon: Flame,
        title: `Heavy Kitchen Rush Active (~${activeSlot.waitMinutes} min queue)`,
        text: `Kitchen currently has ${liveOrdersCount} active tickets in preparation. Estimated order delay is ~${activeSlot.waitMinutes} mins. Reserve your single-use digital token right now to lock your queue spot!`
      };
    } else if (liveOrdersCount >= 5 || activeSlot.level === 'Busy') {
      return {
        badge: `🟠 Busy Kitchen (${liveOrdersCount} Active)`,
        badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: Zap,
        title: `Moderate-High Load (~${activeSlot.waitMinutes} min queue)`,
        text: `Kitchen has ${liveOrdersCount} orders currently cooking. Counter line is moving at a steady pace (~${activeSlot.waitMinutes} min wait).`
      };
    } else if (liveOrdersCount <= 2) {
      return {
        badge: `⚡ Low Load (${liveOrdersCount} Active)`,
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: Sparkles,
        title: `Kitchen Queue Cleared (~${activeSlot.waitMinutes} min wait)!`,
        text: `Only ${liveOrdersCount} orders currently in the kitchen! Food is being prepared immediately without any physical counter delays.`
      };
    } else {
      return {
        badge: `🔵 Normal Flow (${liveOrdersCount} Active)`,
        badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: Clock,
        title: `Steady Flow (~${activeSlot.waitMinutes} min turnaround)`,
        text: `Kitchen has ${liveOrdersCount} orders in active preparation. Orders are served predictably in ~${activeSlot.waitMinutes} mins.`
      };
    }
  }, [liveOrdersCount, activeSlot]);

  const AdviceIcon = contextualAdvice.icon;

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

  const getTelemetryBadgeColor = (level) => {
    switch (level) {
      case 'Critical':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'Peak':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Busy':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Moderate':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Low':
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
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
          {/* Dynamic Status Bar syncing Live Orders & Detected Rush */}
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
              <span className="text-slate-500 text-[11px] flex items-center gap-1">
                Active Kitchen Orders:{' '}
                <span className="px-2 py-0.5 rounded-md bg-white border border-[#E8E3D7] font-bold text-slate-900 font-mono shadow-2xs transition-all duration-300">
                  {liveOrdersCount}
                </span>
              </span>
            </div>

            {/* Read-Only Live IoT Sensor Telemetry Badge (Auto-updates with live order volume) */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500 font-medium hidden sm:inline flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-slate-400" />
                Live Kitchen Load:
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-all duration-500 ${getTelemetryBadgeColor(
                  activeSlot.level
                )}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                {activeSlot.level} Rush ({liveOrdersCount} Orders Active)
              </span>
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
                    className={`flex flex-col items-center flex-1 min-w-[56px] sm:min-w-[62px] group transition-all duration-500 relative ${
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
                      className={`text-[10px] font-bold mb-1.5 transition-all duration-500 ${
                        isNow
                          ? 'text-[#B0003A] font-extrabold text-[11px]'
                          : 'text-slate-500 group-hover:text-slate-800'
                      }`}
                    >
                      ~{slot.waitMinutes}m
                    </span>

                    {/* Bar graphic with smooth height & color transitions */}
                    <div className="w-full bg-slate-100 rounded-t-lg h-[80px] flex items-end justify-center p-0.5">
                      <div
                        style={{ height: `${barHeight}px` }}
                        className={`w-full rounded-t-md transition-all duration-700 ease-in-out ${getBarColor(
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
                      className={`text-[9px] truncate max-w-full text-center mt-0.5 transition-all duration-500 ${
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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50 p-3 sm:p-4 rounded-2xl border border-[#E8E3D7] transition-all duration-500">
            {/* Dynamic Advice reacting automatically to live kitchen orders */}
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
