"use client";

import { cn } from "@/lib/utils";

type TColorProp = string | string[];

interface ShineBorderProps {
  borderRadius?: number;
  borderWidth?: number;
  duration?: number;
  color?: TColorProp;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

/**
 * @name Shine Border
 * @description It is an animated background border effect component with easy to use and configurable props.
 * @param borderRadius defines the radius of the border.
 * @param borderWidth defines the width of the border.
 * @param duration defines the animation duration to be applied on the shining border
 * @param color a string or string array to define border color.
 * @param className defines the class name to be applied to the component
 * @param children contains react node elements.
 */
function ShineBorder({
  borderRadius = 8,
  borderWidth = 1,
  duration = 14,
  color = "#000000",
  className,
  style,
  children,
}: ShineBorderProps) {
  return (
    <div
      style={
        {
          "--border-radius": `${borderRadius}px`,
          ...style,
        } as React.CSSProperties
      }
      className={cn(
        "relative grid h-full w-full place-items-center rounded-3xl bg-white p-3 text-black dark:bg-black dark:text-white",
        className,
      )}
    >
      {/* Border layer: absolute so it fills the container; gradient uses var() so it applies */}
      <div
        style={
          {
            "--border-width": `${borderWidth}px`,
            "--border-radius": `${borderRadius}px`,
            "--shine-pulse-duration": `${duration}s`,
            "--mask-linear-gradient": `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
            "--background-radial-gradient": `radial-gradient(transparent,transparent, ${color instanceof Array ? color.join(",") : color},transparent,transparent)`,
          } as React.CSSProperties
        }
        className="absolute inset-0 pointer-events-none rounded-[var(--border-radius)] [&::before]:absolute [&::before]:inset-0 [&::before]:size-full [&::before]:rounded-[var(--border-radius)] [&::before]:p-[var(--border-width)] [&::before]:content-[''] [&::before]:will-change-[background-position] [&::before]:[-webkit-mask-composite:xor] [&::before]:[background-image:var(--background-radial-gradient)] [&::before]:[background-size:300%_300%] [&::before]:[mask-composite:exclude] [&::before]:[mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] motion-safe:[&::before]:animate-[shine-pulse_var(--shine-pulse-duration)_infinite_linear]"
      />
      <div className="relative z-10 h-full w-full">
        {children}
      </div>
    </div>
  );
}

export { ShineBorder };
