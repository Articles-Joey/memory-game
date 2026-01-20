import { useEffect, useRef } from 'react';
import { useGameStore } from '@/hooks/useGameStore';

import { useGameControllerKeyboardStore, usePieMenuStore } from '@articles-media/articles-gamepad-helper';
import { useStore } from './useStore';

export const useLandingNavigation = (elementsRef) => {

    const nicknameKeyboard = useStore((state) => state.nicknameKeyboard);
    const setNicknameKeyboard = useStore((state) => state.setNicknameKeyboard);

    const lastClosedTime = useGameControllerKeyboardStore((state) => state.lastClosedTime);
    const setStoreVisible = useGameControllerKeyboardStore((state) => state.setVisible);

    const visible = usePieMenuStore((state) => state.visible);

    const showInfoModal = useGameStore((state) => state.showInfoModal)
    const showSettingsModal = useGameStore((state) => state.showSettingsModal)
    const showCreditsModal = useGameStore((state) => state.showCreditsModal)

    const lastInputTime = useRef(0);
    const currentFocusIndex = useRef(-1);

    useEffect(() => {

        if (showInfoModal || showSettingsModal || showCreditsModal || visible || nicknameKeyboard) return;

        let animationFrameId;

        const loop = () => {
            const gamepads = navigator.getGamepads();
            const gp = gamepads[0];

            if (gp) {
                const now = performance.now();

                // Only process input every 150ms
                if (now - lastInputTime.current > 150) {

                    const axes = gp.axes;
                    const buttons = gp.buttons;
                    const threshold = 0.5;

                    const activeElement = document.activeElement;
                    if (activeElement && activeElement.tagName === 'INPUT') {
                        for (let i = 0; i < buttons.length; i++) {
                            if (buttons[i].pressed) {
                                console.log(activeElement.id);

                                if (activeElement.id == "nickname") {
                                    if (now - lastClosedTime < 1000) break;
                                    console.log("SHOW KEYBOARD");
                                    setNicknameKeyboard(true);
                                    setStoreVisible(true);
                                }
                                break;
                            }
                        }
                    }

                    let dx = 0;
                    let dy = 0;

                    // D-Pad
                    if (buttons[12].pressed) dy = -1; // Up
                    if (buttons[13].pressed) dy = 1;  // Down
                    if (buttons[14].pressed) dx = -1; // Left
                    if (buttons[15].pressed) dx = 1;  // Right

                    // Left Stick
                    if (axes[1] < -threshold) dy = -1;
                    if (axes[1] > threshold) dy = 1;
                    if (axes[0] < -threshold) dx = -1;
                    if (axes[0] > threshold) dx = 1;

                    if (dx !== 0 || dy !== 0) {
                        lastInputTime.current = now;
                        navigate(dx, dy);
                    }

                    // A Button (Select)
                    if (buttons[0].pressed) {
                        lastInputTime.current = now; // Debounce click too
                        const active = document.activeElement;
                        // Check if active element is one of ours
                        if (active && elementsRef.current.includes(active)) {
                            active.click();
                        }
                    }
                }
            }
            animationFrameId = requestAnimationFrame(loop);
        };

        const navigate = (dx, dy) => {
            // Define the grid layout
            // 0: Nickname
            // 1: Play
            // 2: Settings, 3: Rules
            // 4: Github, 5: Credits
            // 6: Return (if exists)

            const els = elementsRef.current;

            // If nothing focused, focus first available
            if (currentFocusIndex.current === -1 || !els[currentFocusIndex.current]) {
                // Find first non-null
                const first = els.findIndex(e => e);
                if (first !== -1) focus(first);
                return;
            }

            const curr = currentFocusIndex.current;
            let next = curr;

            // Logic based on the specific layout
            if (dy === 1) { // Down
                if (curr === 0) next = 1;
                else if (curr === 1) next = 2; // Go to Settings (left side preference)
                else if (curr === 2 || curr === 3) next = 4; // Go to Github (left side preference)
                else if (curr === 4 || curr === 5) {
                    if (els[6]) next = 6; // Return
                }
            } else if (dy === -1) { // Up
                if (curr === 6) next = 4;
                else if (curr === 4 || curr === 5) next = 2;
                else if (curr === 2 || curr === 3) next = 1;
                else if (curr === 1) next = 0;
            } else if (dx === 1) { // Right
                if (curr === 2) next = 3;
                else if (curr === 4) next = 5;
            } else if (dx === -1) { // Left
                if (curr === 3) next = 2;
                else if (curr === 5) next = 4;
            }

            // Ensure next exists
            if (els[next]) {
                focus(next);
            }
        };

        const focus = (index) => {
            if (elementsRef.current[index]) {
                elementsRef.current[index].focus();
                currentFocusIndex.current = index;
            }
        };

        animationFrameId = requestAnimationFrame(loop);

        return () => cancelAnimationFrame(animationFrameId);
    }, [elementsRef, showInfoModal, showSettingsModal, showCreditsModal, visible, nicknameKeyboard, lastClosedTime]);
};
