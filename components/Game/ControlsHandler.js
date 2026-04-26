"use client"
import { useEffect } from 'react';
import { useGameControls } from '@/hooks/useGameControls';
import { useSearchParams } from 'next/navigation';

export default function ControlsHandler() {

    const searchParams = useSearchParams()
    const { server } = Object.fromEntries(searchParams.entries());

    const actions = useGameControls({ server });

    useEffect(() => {
        const heldKeys = new Set();
        let rafId = null;

        const keyActions = {
            arrowright: actions.rotateRight,
            d:          actions.rotateRight,
            arrowleft:  actions.rotateLeft,
            a:          actions.rotateLeft,
            arrowup:    actions.powerUp,
            w:          actions.powerUp,
            arrowdown:  actions.powerDown,
            s:          actions.powerDown,
        };

        const loop = () => {
            if (heldKeys.size === 0) { rafId = null; return; }
            heldKeys.forEach(key => keyActions[key]?.());
            rafId = requestAnimationFrame(loop);
        };

        const onKeyDown = (e) => {
            const key = e.key.toLowerCase();
            if (key === 'enter' || key === ' ') { actions.launch(); return; }
            if (key in keyActions) {
                e.preventDefault();
                heldKeys.add(key);
                if (!rafId) rafId = requestAnimationFrame(loop);
            }
        };

        const onKeyUp = (e) => { heldKeys.delete(e.key.toLowerCase()); };

        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);

        return () => {
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
            if (rafId) cancelAnimationFrame(rafId);
        };
    }, [actions]);

    return <></>;
}