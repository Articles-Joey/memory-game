

const mysteryAdjectives = [
    'Clever', 'Sneaky', 'Curious', 'Mysterious', 'Brilliant', 'Cunning', 'Silent', 'Quick',
    'Logical', 'Shrewd', 'Secret', 'Shadowy', 'Astute', 'Wily', 'Sharp', 'Stealthy',
    'Intrepid', 'Savvy', 'Enigmatic', 'Resourceful', 'Observant', 'Crafty', 'Wise', 'Sleuthy',
    'Puzzle', 'Hidden', 'Cryptic', 'Covert', 'Discreet', 'Watchful'
];

const mysteryNouns = [
    'Detective', 'Sleuth', 'Inspector', 'Agent', 'Solver', 'Enigma', 'Puzzle', 'Riddle',
    'Clue', 'Cipher', 'Shadow', 'Case', 'Mystery', 'Tracker', 'Watcher', 'Spy',
    'Investigator', 'Analyst', 'Mastermind', 'Seeker', 'Decoder', 'Scout', 'Hunter', 'Whodunit',
    'Logic', 'Brain', 'Thinker', 'Strategist', 'Advisor', 'Consultant'
];

/**
 * Generates a random mystery/problem-solver themed nickname.
 * @returns {string} A random nickname like "CleverDetective42" or "SneakyPuzzle7".
 */
const generateRandomNickname = () => {
    const adj = mysteryAdjectives[Math.floor(Math.random() * mysteryAdjectives.length)];
    const noun = mysteryNouns[Math.floor(Math.random() * mysteryNouns.length)];
    const num = Math.floor(Math.random() * 100);
    return `${adj}${noun}${num}`;
};

export default generateRandomNickname;