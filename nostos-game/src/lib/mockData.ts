export const SEED_LEVELS = [
  {
    id: "mock-lvl-1",
    level_number: 1,
    title: "The Lotus-Eaters",
    story_text: "You have arrived at an island where time stands still. The inhabitants offer you lotus flowers, and your crew begins to forget their homes. Decode the ancient scrolls to find the true path before you all succumb.",
    puzzle_type: "decoder_wheel",
    puzzle_data: { scrolls: ["VKH ZDLWV WKUHH GDBV ZHVW", "JLYH XS DQG VWDb", "WKH VHD LV FROG DQG GDUN", "IRUJHW BRXU KRPH"] },
    correct_answer: "SHE WAITS THREE DAYS WEST",
    is_locked: false
  },
  {
    id: "mock-lvl-2",
    level_number: 2,
    title: "Aeolus's Winds",
    story_text: "The god of winds has gifted you a bag containing all the storm winds. But the bag is tied shut with a puzzle. Reveal the icons and arrange them to catch the favorable west wind.",
    puzzle_type: "icon_reveal",
    puzzle_data: { words: ["FOLLOW", "THE", "WEST", "WIND", "HOME"] },
    correct_answer: "FOLLOW THE WEST WIND HOME",
    is_locked: false
  },
  {
    id: "mock-lvl-3",
    level_number: 3,
    title: "The Cyclops's Cave",
    story_text: "Trapped in the cave of Polyphemus! He has rolled a massive boulder over the entrance. You must solve his three riddles to unlock the mechanism holding the rock in place.",
    puzzle_type: "visual_escape",
    puzzle_data: { riddles: [{ q: "What is greater than the gods, more evil than the demons, the poor have it, the rich need it, and if you eat it, you will die?", a: "NOTHING" }, { q: "If you are NOTHING to him, what must you call yourself?", a: "NOBODY" }] },
    correct_answer: "NOBODY",
    is_locked: false
  },
  {
    id: "mock-lvl-4",
    level_number: 4,
    title: "The Laestrygonians",
    story_text: "Giant cannibals hurl boulders at your fleeing ships! You must navigate the treacherous straits by quickly solving a series of navigational calculations. Be swift, or be sunk.",
    puzzle_type: "progress_bar",
    puzzle_data: { questions: 12, required: 6 },
    correct_answer: "6_CORRECT",
    is_locked: false
  },
  {
    id: "mock-lvl-5",
    level_number: 5,
    title: "Circe's Island",
    story_text: "The sorceress Circe has turned half your crew into swine! Search her opulent hall for the hidden ingredients to counter her spell.",
    puzzle_type: "hidden_object",
    puzzle_data: { hotspots: [{ id: 1, letter: "P" }, { id: 2, letter: "I" }, { id: 3, letter: "G" }] },
    correct_answer: "PIG",
    is_locked: false
  },
  {
    id: "mock-lvl-6",
    level_number: 6,
    title: "The Land of the Dead",
    story_text: "You have descended into the Underworld. The spirits whisper fragmented truths. You must each listen to a different shade and combine their knowledge to find the way back to the living.",
    puzzle_type: "asymmetric_split",
    puzzle_data: { variants: ["THE", "ROAD", "HOME"] },
    correct_answer: "THE ROAD HOME",
    is_locked: false
  },
  {
    id: "mock-lvl-7",
    level_number: 7,
    title: "The Sirens' Song",
    story_text: "Approaching the island of the Sirens, some of your crew have stopped their ears with wax, seeing only blurred shapes. Others must listen to the song and pluck the golden words from the deceptive lyrics.",
    puzzle_type: "split_blurred",
    puzzle_data: { clear_text: "TRUST NO SONG", waves: 3 },
    correct_answer: "TRUST NO SONG",
    is_locked: false
  },
  {
    id: "mock-lvl-8",
    level_number: 8,
    title: "Scylla and Charybdis",
    story_text: "You face a terrible choice. Sail close to the six-headed monster Scylla and lose some crew, or risk the whirlpool Charybdis and lose the entire ship. Commit to a path and solve its trial.",
    puzzle_type: "animated_fork",
    puzzle_data: { paths: { A: { q: "A ship holds 6 crates. Half are unloaded, then 2 more are added. How many crates now?", a: "5" }, B: { q: "A rope is 9 meters. It's cut into 3 equal pieces, then one piece is cut in half. How long is that half-piece?", a: "1.5" } } },
    correct_answer: "DEPENDS_ON_PATH",
    is_locked: false
  },
  {
    id: "mock-lvl-9",
    level_number: 9,
    title: "The Cattle of Helios",
    story_text: "Your starving crew eyes the sacred cattle of the Sun God. A glowing altar offers a tempting shortcut, but beware the wrath of Helios. Solve the logic puzzle carefully.",
    puzzle_type: "tempting_glow",
    puzzle_data: { setup_q: "A number doubled is 20. Another number tripled is 30. What are the two numbers?", main_q: "Subtract the second number from the first." },
    correct_answer: "0",
    is_locked: false
  },
  {
    id: "mock-lvl-10",
    level_number: 10,
    title: "Return to Ithaca",
    story_text: "You have finally reached the shores of Ithaca. One last trial remains: align the stars perfectly and recall your past journey to prove you are the true king.",
    puzzle_type: "timing_bar",
    puzzle_data: { combination_clue: "Take your Level 3 answer. Take the direction opposite of where the sun rises. Combine both, separated by a space." },
    correct_answer: "NOBODY WEST",
    is_locked: false
  }
];

// Fallback in-memory dev progress state when database is unreachable (persisted across Next.js HMR reloads)
const globalForDev = globalThis as unknown as {
  mockDevProgressState?: Record<string, { current_level: number; incorrect_count: number }>;
};

export const mockDevProgressState = globalForDev.mockDevProgressState ?? {};
if (process.env.NODE_ENV !== 'production') {
  globalForDev.mockDevProgressState = mockDevProgressState;
}
