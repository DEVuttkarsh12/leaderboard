"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  CircleDollarSign,
  Coins,
  Crown,
  Diamond,
  Dices,
  Gem,
  Sparkles,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";

type PrizeDropFieldProps = {
  compact?: boolean;
  className?: string;
};

type PrizeToken = {
  Icon: LucideIcon;
  x: number;
  drift: number;
  delay: number;
  duration: number;
  rotate: number;
  scale: number;
  tone: "acid" | "cyan" | "pink";
};

const prizeTokens: PrizeToken[] = [
  { Icon: Crown, x: 8, drift: 38, delay: 0.2, duration: 10.8, rotate: 210, scale: 0.9, tone: "acid" },
  { Icon: Diamond, x: 20, drift: -24, delay: 2.8, duration: 12.4, rotate: -260, scale: 0.72, tone: "cyan" },
  { Icon: Coins, x: 33, drift: 42, delay: 5.4, duration: 11.6, rotate: 300, scale: 0.82, tone: "pink" },
  { Icon: Dices, x: 46, drift: -32, delay: 1.3, duration: 13.2, rotate: -320, scale: 1.02, tone: "acid" },
  { Icon: Trophy, x: 59, drift: 25, delay: 7.1, duration: 12.8, rotate: 240, scale: 0.7, tone: "cyan" },
  { Icon: Gem, x: 71, drift: -36, delay: 3.9, duration: 10.4, rotate: -220, scale: 0.88, tone: "pink" },
  { Icon: CircleDollarSign, x: 84, drift: 28, delay: 6.2, duration: 11.9, rotate: 280, scale: 1, tone: "acid" },
  { Icon: Sparkles, x: 94, drift: -22, delay: 0.8, duration: 13.6, rotate: -180, scale: 0.68, tone: "cyan" },
];

export function PrizeDropField({ compact = false, className = "" }: PrizeDropFieldProps) {
  const reduceMotion = useReducedMotion();
  const tokens = compact ? prizeTokens.filter((_, index) => index % 2 === 0) : prizeTokens;

  return (
    <div className={`prize-drop-field${compact ? " prize-drop-field--compact" : ""} ${className}`.trim()} aria-hidden="true">
      {tokens.map(({ Icon, x, drift, delay, duration, rotate, scale, tone }, index) => (
        <motion.span
          className={`prize-drop-token prize-drop-token--${tone}`}
          key={`${tone}-${x}`}
          style={{ left: `${x}%`, scale }}
          initial={reduceMotion ? { opacity: 0.28, y: `${12 + index * 8}%`, rotate: 0 } : { opacity: 0, y: "-18vh", rotate: 0 }}
          animate={reduceMotion ? undefined : {
            opacity: [0, 0.62, 0.48, 0],
            x: [0, drift * 0.42, drift, drift * 0.2],
            y: ["-18vh", "28vh", "72vh", "118vh"],
            rotate,
          }}
          transition={reduceMotion ? undefined : {
            delay,
            duration,
            ease: "linear",
            repeat: Infinity,
            repeatDelay: 0.6,
          }}
        >
          <Icon size={compact ? 18 : 24} strokeWidth={2.15} />
        </motion.span>
      ))}
    </div>
  );
}

export function RevealBlock({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={`reveal-block ${className}`.trim()}
      initial={reduceMotion ? false : { opacity: 0, y: 28, scale: 0.985 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ delay, duration: 0.68, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
