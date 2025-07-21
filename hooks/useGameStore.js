// import { create } from 'zustand'
import { createWithEqualityFn as create } from 'zustand/traditional'

function generateMatchPairs(rows, cols) {
    // Step 1: Generate the cards with locations
    const cards = [];
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            cards.push({
                location: [row, col],
                flatLocation: `${row}-${col}`,
                flipped: false,
                matchValue: null, // will be assigned later
            });
        }
    }

    // Step 2: Generate match values (16 unique values, each repeated twice)
    const matchValues = [...Array(16).keys()].flatMap((val) => [val, val]);

    // Step 3: Shuffle the matchValues array
    for (let i = matchValues.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [matchValues[i], matchValues[j]] = [matchValues[j], matchValues[i]]; // Swap values
    }

    // Step 4: Assign match values to cards
    cards.forEach((card, index) => {
        card.matchValue = matchValues[index];
    });

    console.log(cards)
    return cards;
}

export const useGameStore = create((set) => ({

    cameraMode: 'Player',
    setCameraMode: (newValue) => {
        set((prev) => ({
            cameraMode: newValue
        }))
    },

    playerLocation: false,
    setPlayerLocation: (newValue) => {
        set((prev) => ({
            playerLocation: newValue
        }))
    },

    maxHeight: 0,
    setMaxHeight: (newValue) => {
        set((prev) => ({
            maxHeight: newValue
        }))
    },

    debug: false,
    setDebug: (newValue) => {
        set((prev) => ({
            debug: newValue
        }))
    },

    timer: 0,
    setTimer: (newValue) => {
        set((prev) => ({
            timer: newValue
        }))
    },
    addTimer: (newValue) => {
        set((prev) => ({
            timer: prev.timer + 1
        }))
    },

    matchPairs: generateMatchPairs(4, 8),
    setMatchPairs: (newValue) => {
        set((prev) => ({
            matchPairs: newValue
        }))
    },
    generateMatchPairs: () => {
        let newPairs = generateMatchPairs(4, 8)
        set((prev) => ({
            matchPairs: newPairs,
            flipCount: 0
        }))
    },

    distance: 0,
    setDistance: (newValue) => {
        set((prev) => ({
            distance: newValue
        }))
    },
    addDistance: (newValue) => {
        set((prev) => ({
            distance: (prev.distance + newValue)
        }))
    },

    obstacles: [],
    setObstacles: (newValue) => {
        set((prev) => ({
            obstacles: newValue
        }))
    },

    shift: false,
    setShift: (newValue) => {
        set((prev) => ({
            shift: newValue
        }))
    },

    flipCount: 0,
    setFlipCount: (newValue) => {
        set((prev) => ({
            flipCount: newValue
        }))
    },
    addFlipCount: (newValue) => {
        set((prev) => ({
            flipCount: prev.flipCount + 1
        }))
    },

    // Logic now inside matchPairs
    // flippedCards: [],
    // setFlippedCards: (newValue) => {
    //     set((prev) => ({
    //         flippedCards: newValue
    //     }))
    // },

    touchControls: {
        jump: false,
        left: false,
        right: false
    },
    setTouchControls: (newValue) => {
        set((prev) => ({
            touchControls: newValue
        }))
    },

    teleport: false,
    setTeleport: (newValue) => {
        set((prev) => ({
            teleport: newValue
        }))
    },

    gameState: {},
    setGameState: (newValue) => {
        set((prev) => ({
            gameState: newValue
        }))
    },
}))

export const useControlsStore = create((set) => ({

    touchControls: {
        jump: false,
        left: false,
        right: false,
        up: false,
        down: false
    },
    setTouchControls: (newValue) => {
        set((prev) => ({
            touchControls: newValue
        }))
    }

}))