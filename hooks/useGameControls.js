import { useRef, useEffect, useCallback, useMemo } from 'react';
import { useIceSlideStore } from '@/hooks/useIceSlideStore';
import { useSocketStore } from '@/hooks/useSocketStore';

/**
 * Returns stable action callbacks for game controls.
 * Each directional action advances the value by one step per call.
 * For held input (keyboard or touch), call the action repeatedly via a RAF loop.
 */
export function useGameControls({ server } = {}) {

    const setLaunchPlayer = useIceSlideStore(state => state.setLaunchPlayer);
    const setHitRotation = useIceSlideStore(state => state.setHitRotation);
    const setHitPower = useIceSlideStore(state => state.setHitPower);

    const hitRotationRef = useRef(useIceSlideStore.getState().hitRotation);
    const hitPowerRef = useRef(useIceSlideStore.getState().hitPower);

    useEffect(() => useIceSlideStore.subscribe(
        state => state.hitRotation,
        val => { hitRotationRef.current = val; }
    ), []);

    useEffect(() => useIceSlideStore.subscribe(
        state => state.hitPower,
        val => { hitPowerRef.current = val; }
    ), []);

    const emitAim = useRef(() => {});
    useEffect(() => {
        let lastR = null;
        let lastP = null;
        emitAim.current = () => {
            const r = hitRotationRef.current;
            const p = hitPowerRef.current;
            if (r !== lastR || p !== lastP) {
                useSocketStore.getState().socket?.emit('game:ice-slide:aim', {
                    hitRotation: r,
                    hitPower: p,
                    server,
                });
                lastR = r;
                lastP = p;
            }
        };
    }, [server]);

    const actions = useRef({
        rotateRight() {
            const next = hitRotationRef.current >= 360 ? 0 : hitRotationRef.current + 1;
            setHitRotation(next);
            hitRotationRef.current = next;
            emitAim.current();
        },
        rotateLeft() {
            const next = hitRotationRef.current <= 0 ? 360 : hitRotationRef.current - 1;
            setHitRotation(next);
            hitRotationRef.current = next;
            emitAim.current();
        },
        powerUp() {
            if (hitPowerRef.current >= 100) return;
            const next = hitPowerRef.current + 1;
            setHitPower(next);
            hitPowerRef.current = next;
            emitAim.current();
        },
        powerDown() {
            if (hitPowerRef.current <= 0) return;
            const next = hitPowerRef.current - 1;
            setHitPower(next);
            hitPowerRef.current = next;
            emitAim.current();
        },
        launch() {
            const socket = useSocketStore.getState().socket;
            socket?.emit('game:ice-slide:move', {
                hitRotation: hitRotationRef.current,
                hitPower: hitPowerRef.current,
                server,
            });
            setLaunchPlayer(true);
        },
    });

    return actions.current;
}

/**
 * Returns React event handler props that fire an action once on press
 * and then repeat every animation frame while held.
 *
 * Usage:
 *   <button {...useHeldAction(actions.rotateRight)} />
 */
export function useHeldAction(action) {
    const rafRef = useRef(null);
    const actionRef = useRef(action);
    actionRef.current = action;

    const stop = useCallback(() => {
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
    }, []);

    const start = useCallback((e) => {
        stop();
        actionRef.current();
        const loop = () => {
            actionRef.current();
            rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);
    }, [stop]);

    return useMemo(() => ({
        onPointerDown: start,
        onPointerUp: stop,
        onPointerLeave: stop,
        onPointerCancel: stop,
    }), [start, stop]);
}
