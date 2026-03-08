"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function AgentsBackground() {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePos({ x: e.clientX, y: e.clientY });
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    return (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            {/* Base Dot Grid */}
            <div
                className="absolute inset-0 opacity-[0.4] dark:opacity-[0.15]"
                style={{
                    backgroundImage: `radial-gradient(circle at center, var(--neutral-400, #a3a3a3) 1px, transparent 1px)`,
                    backgroundSize: "24px 24px"
                }}
            />

            {/* Interactive Desktop Spotlight - Very subtle mouse follow glow */}
            <motion.div
                className="absolute inset-0 opacity-0 dark:opacity-100 hidden md:block transition-opacity duration-1000"
                animate={{
                    background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255,255,255,0.03), transparent 40%)`
                }}
                transition={{ type: "tween", ease: "linear", duration: 0.1 }}
            />

            {/* Interactive Desktop Spotlight for Light Mode - Darker subtle glow */}
            <motion.div
                className="absolute inset-0 opacity-100 dark:opacity-0 hidden md:block transition-opacity duration-1000"
                animate={{
                    background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(0,0,0,0.02), transparent 40%)`
                }}
                transition={{ type: "tween", ease: "linear", duration: 0.1 }}
            />

            {/* Ambient static sweep for mobile or fallback */}
            <div
                className="absolute inset-[-100%] animate-[spin_60s_linear_infinite] opacity-30 dark:opacity-10 pointer-events-none"
                style={{
                    background: 'conic-gradient(from 90deg at 50% 50%, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)'
                }}
            />

            {/* Vignette overlay to keep focus on the center content */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.05)_100%)] dark:bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
        </div>
    );
}
