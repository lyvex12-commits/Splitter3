"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Info, CircleCheck, AlertTriangle, Target } from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from "recharts";
import { MUSCLES, MUSCLE_COLORS } from "@/lib/muscles";
import { addDays, daysAgoLabel, formatWeekRange, getMonday, startOfDay, toKey } from "@/lib/dates";
import { aggregateMuscles, calculateSplitterScore, getScoreContributions, getGoalProgress, getRecommendedNext } from "@/lib/calculations";
import { Goals, WorkoutEntry } from "@/lib/types";
import RankList from "@/components/ui/RankList";
import GoalBarChart, { GoalBarDatum } from "@/components/ui/GoalBarChart";
import ScoreRing from "@/components/ui/ScoreRing";
import AnimatedNumber from "@/components/ui/AnimatedNumber";
import { SegButton } from "@/components/ui/Field";
import { makeSlide, useSlideDirection } from "@/lib/useSlideDirection";

const slideWeek = makeSlide(24);
const slideRecText = makeSlide(16);
const slideRecList = makeSlide(24);

export default function DataTab({
  entries,
  viewedWeekStart,
  onNavigateWeek,
  goals,
}: {
  entries: WorkoutEntry[];
  viewedWeekStart: Date;
  onNavigateWeek: (monday: Date) => void;
  goals: Goals;
}) {
  const thisMonday = getMonday(new Date());
  const viewedMonday = viewedWeekStart;
  const viewedSunday = addDays(viewedMonday, 6);
  const isCurrentWeek = toKey(viewedMonday) === toKey(thisMonday);
  const weekComplete = viewedSunday < startOfDay(new Date());

  const weekEntries = useMemo(
    () => entries.filter((e) => e.date >= toKey(viewedMonday) && e.date <= toKey(viewedSunday)),
    [entries, viewedMonday, viewedSunday]
  );
  const { stats, total } = useMemo(() => aggregateMuscles(weekEntries), [weekEntries]);
  const allTimeAgg = useMemo(() => aggregateMuscles(entries), [entries]);
  const score = useMemo(() => calculateSplitterScore(stats), [stats]);
  const contributions = useMemo(() => getScoreContributions(score), [score]);
  const totalPoints = useMemo(() => contributions.reduce((s, c) => s + c.points, 0), [contributions]);

  // "Recommended Next" is deliberately always about the ACTUAL current week
  // and TODAY specifically — a live decide-what-to-train tool — so it does
  // NOT follow weekOffset when you're browsing a past week elsewhere on
  // this page; it stays anchored to "right now" regardless of what week
  // the rest of the page is showing.
  const thisSunday = addDays(thisMonday, 6);
  const currentWeekEntries = useMemo(
    () => entries.filter((e) => e.date >= toKey(thisMonday) && e.date <= toKey(thisSunday)),
    [entries, thisMonday, thisSunday]
  );
  const { stats: currentWeekStats } = useMemo(() => aggregateMuscles(currentWeekEntries), [currentWeekEntries]);
  const todayKey = toKey(new Date());
  const todayEntries = useMemo(() => entries.filter((e) => e.date === todayKey), [entries, todayKey]);
  const { stats: todayStats } = useMemo(() => aggregateMuscles(todayEntries), [todayEntries]);
  const recProgress = useMemo(
    () => getGoalProgress(currentWeekStats, goals, todayStats),
    [currentWeekStats, goals, todayStats]
  );
  const [recMode, setRecMode] = useState<"week" | "today">("week");
  // Slide direction for the Recommended Next tab switch (week -> today moves left).
  const recDir = useSlideDirection(recMode === "today" ? 1 : 0);

  // Direction of the last week change (derived synchronously, see hook).
  const weekDir = useSlideDirection(viewedWeekStart.getTime());
  const recommended = useMemo(() => getRecommendedNext(recProgress, 5, recMode), [recProgress, recMode]);

  const daysLogged = new Set(weekEntries.map((e) => e.date)).size;

  const barData: GoalBarDatum[] = MUSCLES.map((m) => ({
    name: m.key,
    value: Math.round(stats[m.key].effectiveSets * 10) / 10,
    goal: goals[m.key] ?? 0,
    color: MUSCLE_COLORS[m.key],
  }));
  const pieData = MUSCLES.filter((m) => stats[m.key].effectiveSets > 0).map((m) => ({
    name: m.key,
    value: Math.round(stats[m.key].effectiveSets * 10) / 10,
  }));

  const sortedByVolume = MUSCLES.map((m) => stats[m.key]).sort((a, b) => a.effectiveSets - b.effectiveSets);
  const leastTrained = sortedByVolume.slice(0, 5);
  const mostTrained = [...sortedByVolume].reverse().slice(0, 5);

  const history = useMemo(() => {
    const out: { offset: number; monday: Date; sunday: Date; score: number; entries: WorkoutEntry[] }[] = [];
    for (let i = 0; i >= -5; i--) {
      const mon = addDays(thisMonday, i * 7);
      const sun = addDays(mon, 6);
      const wEntries = entries.filter((e) => e.date >= toKey(mon) && e.date <= toKey(sun));
      if (wEntries.length === 0 && i !== 0) continue;
      const { stats: s } = aggregateMuscles(wEntries);
      const sc = calculateSplitterScore(s);
      out.push({ offset: i, monday: mon, sunday: sun, score: sc.overall, entries: wEntries });
    }
    return out.reverse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries]);

  return (
    <div className="max-w-md mx-auto px-4 pt-6 space-y-6">
      <h1 className="text-2xl font-semibold font-display">Data</h1>

      {/* Weekly overview */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => onNavigateWeek(addDays(viewedWeekStart, -7))} className="p-1 text-zinc-500 active:scale-90 transition-transform">
            <ChevronLeft size={18} />
          </button>
          <div className="relative flex-1 h-10 overflow-hidden">
            <AnimatePresence initial={false} mode="popLayout" custom={weekDir}>
              <motion.div
                key={toKey(viewedMonday)}
                custom={weekDir}
                variants={slideWeek}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2 }}
                className="text-center"
              >
                <div className="text-xs uppercase tracking-wider text-zinc-500">{isCurrentWeek ? "This Week" : "Week"}</div>
                <div className="font-medium">{formatWeekRange(viewedMonday)}</div>
              </motion.div>
            </AnimatePresence>
          </div>
          <button
            onClick={() => !isCurrentWeek && onNavigateWeek(addDays(viewedWeekStart, 7))}
            className={`p-1 active:scale-90 transition-transform ${!isCurrentWeek ? "text-zinc-500" : "text-zinc-800"}`}
            disabled={isCurrentWeek}
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <AnimatePresence initial={false}>
          {!isCurrentWeek && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <button
                onClick={() => onNavigateWeek(thisMonday)}
                className="w-full text-center text-xs text-amber-400 underline underline-offset-2 mb-3 active:opacity-70"
              >
                Back to this week
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-xl font-semibold tabular-nums font-display">
              <AnimatedNumber value={daysLogged} />/7
            </div>
            <div className="text-[11px] text-zinc-500">days logged</div>
          </div>
          <div>
            <div className="text-xl font-semibold tabular-nums font-display">
              <AnimatedNumber value={Math.round(total * 10) / 10} decimals={1} />
            </div>
            <div className="text-[11px] text-zinc-500">effective sets</div>
          </div>
          <div>
            <div className="text-xl font-semibold tabular-nums font-display">
              <AnimatedNumber value={score.overall} />
            </div>
            <div className="text-[11px] text-zinc-500">{weekComplete ? "score" : "provisional"}</div>
          </div>
        </div>
        {!weekComplete && (
          <div className="mt-3 text-[11px] text-amber-400/80 bg-amber-400/10 rounded-xl px-3 py-2 flex items-start gap-1.5">
            <Info size={13} className="mt-0.5 shrink-0" />
            Week in progress — the score will keep shifting until Sunday.
          </div>
        )}
      </section>

      {/* Splitter Score */}
      <section className="bg-gradient-to-b from-zinc-900 to-zinc-900/60 border border-zinc-800 rounded-2xl p-4 overflow-hidden relative">
        <div className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Splitter Score</div>
        <div className="flex items-end gap-2 mb-5">
          <span className="text-5xl font-bold tabular-nums font-display glow-amber">
            <AnimatedNumber value={score.overall} />
          </span>
          <span className="text-zinc-500 mb-1.5">/ 100</span>
        </div>

        <div className="flex justify-between mb-2 px-1">
          <ScoreRing value={score.volume} color="#f0a24a" label="Volume" />
          <ScoreRing value={score.balance} color="#5fb0e8" label="Balance" />
          <ScoreRing value={score.frequency} color="#6ae8b0" label="Frequency" />
          <ScoreRing value={score.undertraining} color="#c98ae8" label="Coverage" />
        </div>
        <p className="text-[10px] text-zinc-600 leading-relaxed mb-5 px-1">
          Volume = productive set range · Balance = push/pull &amp; arm symmetry · Frequency = 2+ sessions/wk ·
          Coverage = nothing left at zero
        </p>

        <div className="space-y-2 mb-4">
          {contributions.map((c) => (
            <div key={c.label} className="flex items-center justify-between text-sm">
              <span className="text-zinc-300 w-20 shrink-0">{c.label}</span>
              <span className="text-zinc-500 text-xs flex-1 text-center">
                {c.subScore}/100 score × {c.weightPct}% weight
              </span>
              <span className="font-semibold tabular-nums w-20 text-right">
                {c.points.toFixed(1)} / {c.maxPoints} pts
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between text-sm pt-2 mt-1 border-t border-zinc-800">
            <span className="text-zinc-400 font-medium">Total</span>
            <span className="font-semibold tabular-nums">
              {totalPoints.toFixed(1)} pts → {score.overall} / 100
            </span>
          </div>
        </div>
        <div className="space-y-1.5 mb-3">
          {score.good.map((g, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex gap-2 text-sm text-emerald-400/90"
            >
              <CircleCheck size={15} className="mt-0.5 shrink-0" />
              <span>{g}</span>
            </motion.div>
          ))}
        </div>
        <div className="space-y-1.5">
          {score.improve.map((g, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: (score.good.length + i) * 0.05 }}
              className="flex gap-2 text-sm text-amber-400/90"
            >
              <AlertTriangle size={15} className="mt-0.5 shrink-0" />
              <span>{g}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Recommended Next */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
        <div className="flex items-center gap-1.5 mb-1">
          <Target size={14} className="text-amber-400" />
          <div className="text-xs uppercase tracking-wider text-zinc-500">Recommended Next</div>
        </div>
        <div className="relative overflow-hidden mb-3">
          <AnimatePresence initial={false} mode="popLayout" custom={recDir}>
            <motion.p
              key={recMode}
              custom={recDir}
              variants={slideRecText}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2 }}
              className="text-zinc-600 text-xs leading-relaxed"
            >
              {recMode === "week"
                ? "Muscles furthest behind your own weekly goals — guidance based on your data, not medical advice."
                : "Same ranking, but skips anything you've already given 2+ sets to today."}
            </motion.p>
          </AnimatePresence>
        </div>
        <div className="flex gap-2 mb-3">
          <SegButton active={recMode === "week"} onClick={() => setRecMode("week")}>
            This Week
          </SegButton>
          <SegButton active={recMode === "today"} onClick={() => setRecMode("today")}>
            Today
          </SegButton>
        </div>
        <div className="relative overflow-hidden">
        <AnimatePresence initial={false} mode="popLayout" custom={recDir}>
        <motion.div
          key={recMode}
          custom={recDir}
          variants={slideRecList}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        >
        {recommended.length === 0 ? (
          <div className="text-zinc-600 text-sm py-4 text-center">
            {recProgress.every((p) => p.goal === 0)
              ? "Set some goals on the Goals tab to get recommendations."
              : recMode === "today"
              ? "Nothing left to flag — today's gaps are covered, or everything behind goal is already trained today."
              : "You're at or above goal everywhere you've set one — nice work."}
          </div>
        ) : (
          <div className="space-y-2">
            {recommended.map((p, i) => (
              <motion.div
                key={p.muscle}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="text-zinc-600 text-xs w-4">{i + 1}</span>
                  <span className="text-sm text-zinc-200">{p.muscle}</span>
                </div>
                <span className="text-sm font-medium tabular-nums text-zinc-400">
                  {p.timesTrained}x this wk · {round1(p.effectiveSets)}/{p.goal}
                </span>
              </motion.div>
            ))}
          </div>
        )}
        </motion.div>
        </AnimatePresence>
        </div>
      </section>

      {/* Muscle Set Distribution */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs uppercase tracking-wider text-zinc-500">Muscle Set Distribution</div>
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
            <span className="w-2 h-0.5 bg-zinc-200 inline-block" /> your goal
          </div>
        </div>
        <GoalBarChart data={barData} />
        <div className="text-center text-[10px] text-zinc-600 mt-2">swipe for more muscles →</div>
      </section>

      {/* Percentage distribution */}
      {pieData.length > 0 && (
        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <div className="text-xs uppercase tracking-wider text-zinc-500 mb-3">Share of Weekly Volume</div>
          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                  {pieData.map((d, i) => (
                    <Cell key={i} fill={MUSCLE_COLORS[d.name]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 12, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2">
            {[...pieData]
              .sort((a, b) => b.value - a.value)
              .map((d) => (
                <div key={d.name} className="flex items-center gap-2 text-xs text-zinc-400">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: MUSCLE_COLORS[d.name] }} />
                  {d.name} · {Math.round((d.value / total) * 100)}%
                </div>
              ))}
          </div>
        </section>
      )}

      {/* Least / Most trained */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
        <div className="text-xs uppercase tracking-wider text-zinc-500 mb-3">Least Trained</div>
        <RankList items={leastTrained} />
      </section>
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
        <div className="text-xs uppercase tracking-wider text-zinc-500 mb-3">Most Trained</div>
        <RankList items={mostTrained} />
      </section>

      {/* Training frequency */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
        <div className="text-xs uppercase tracking-wider text-zinc-500 mb-3">Training Frequency &amp; Recency</div>
        <div className="space-y-2">
          {MUSCLES.map((m) => {
            const s = stats[m.key];
            const overallLast = allTimeAgg.stats[m.key]?.lastTrained ?? null;
            return (
              <div key={m.key} className="flex items-center justify-between text-sm py-1.5 border-b border-zinc-800/60 last:border-0">
                <span className="text-zinc-300">{m.key}</span>
                <div className="flex gap-4 text-zinc-500 text-xs">
                  <span>{s.timesTrained}x this wk</span>
                  <span className="w-20 text-right">{daysAgoLabel(overallLast)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Weekly history */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
        <div className="text-xs uppercase tracking-wider text-zinc-500 mb-3">Week History</div>
        <div className="space-y-2">
          {history.map((h) => (
            <motion.button
              key={h.offset}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigateWeek(h.monday)}
              className={`w-full flex justify-between items-center px-3 py-2 rounded-xl transition-colors ${
                toKey(h.monday) === toKey(viewedWeekStart) ? "bg-zinc-800" : ""
              }`}
            >
              <span className="text-sm text-zinc-400">{formatWeekRange(h.monday)}</span>
              <span className="font-semibold tabular-nums">{h.entries.length ? h.score : "—"}</span>
            </motion.button>
          ))}
        </div>
      </section>
    </div>
  );
}

function round1(n: number): string {
  return (Math.round(n * 10) / 10).toString();
}
