"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import type * as React from "react";
import { cn } from "@/lib/utils";

// ponytail: shared, restrained motion presets — fast, subtle, reduced-motion safe
const EASE = [0.21, 0.47, 0.32, 0.98] as const;

type RevealProps = Omit<React.ComponentProps<typeof motion.div>, "children"> & {
  children?: React.ReactNode;
  delay?: number;
  y?: number;
  as?:
    | "div"
    | "section"
    | "ul"
    | "li"
    | "article"
    | "span"
    | "h1"
    | "h2"
    | "h3"
    | "p"
    | "a";
};

export function Reveal({
  children,
  className,
  delay = 0,
  y = 16,
  as = "div",
  ...props
}: RevealProps) {
  const reduce = useReducedMotion();
  const MotionTag = motion[as] as typeof motion.div;
  return (
    <MotionTag
      initial={reduce ? { opacity: 0 } : { opacity: 0, y }}
      whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.45, ease: EASE, delay }}
      className={className}
      {...props}
    >
      {children}
    </MotionTag>
  );
}

// ponytail: stagger container — children fade/slide in sequence via index-based delay
export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
};

export function StaggerGroup({
  children,
  className,
  ...props
}: Omit<React.ComponentProps<typeof motion.div>, "children"> & {
  children?: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      variants={reduce ? undefined : staggerContainer}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
  ...props
}: Omit<React.ComponentProps<typeof motion.div>, "children"> & {
  children?: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  if (reduce) {
    return <div className={cn("min-w-0", className)}>{children}</div>;
  }
  return (
    <motion.div
      variants={staggerItem}
      className={cn("min-w-0", className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// ponytail: hover lift for interactive cards — gentle, only y + shadow (shadow handled via tailwind classes)
export function hoverLift(reduce?: boolean | null) {
  if (reduce) return undefined;
  return {
    whileHover: { y: -3, transition: { duration: 0.2, ease: EASE } },
    whileTap: { y: -1 },
  };
}
