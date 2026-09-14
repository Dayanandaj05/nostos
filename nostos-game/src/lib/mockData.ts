export const SEED_LEVELS = [
  {
    id: "mock-lvl-1",
    level_number: 1,
    title: "The Island of Time",
    story_text: "You have arrived at an island where time stands still. The inhabitants offer you a strange fruit that makes your crew forget their mission. Decode the ancient scrolls to find the true path before you all succumb.",
    puzzle_type: "decoder_wheel",
    puzzle_data: { scrolls: ["VKH ZDLWV WKUHH GDBV ZHVW", "JLYH XS DQG VWDb", "WKH VHD LV FROG DQG GDUN", "IRUJHW BRXU KRPH"] },
    correct_answer: "SHE WAITS THREE DAYS WEST",
    is_locked: false
  },
  {
    id: "mock-lvl-2",
    level_number: 2,
    title: "The Wind Chamber",
    story_text: "You found a mysterious bag containing all the storm winds. It's tied shut with a puzzle. Reveal the icons and arrange them to catch the favorable west wind.",
    puzzle_type: "icon_reveal",
    puzzle_data: { words: ["FOLLOW", "THE", "WEST", "WIND", "HOME"] },
    correct_answer: "FOLLOW THE WEST WIND HOME",
    is_locked: false
  },
  {
    id: "mock-lvl-3",
    level_number: 3,
    title: "The Locked Cave",
    story_text: "Trapped in a dark cave! A massive boulder blocks the entrance. You must solve three riddles to unlock the three heavy iron locks holding the stone door in place.",
    puzzle_type: "visual_escape",
    puzzle_data: { 
      riddles: [
        { q: "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?", a: "ECHO" },
        { q: "The more of this there is, the less you see. What is it?", a: "DARKNESS" },
        { q: "What has keys but can't open locks?", a: "PIANO" }
      ] 
    },
    correct_answer: "ECHO",
    is_locked: false
  },
  {
    id: "mock-lvl-4",
    level_number: 4,
    title: "The Treacherous Straits",
    story_text: "Hostile forces are hurling boulders at your fleeing ships! You must navigate the treacherous straits by quickly solving a series of navigational calculations. Be swift, or be sunk.",
    puzzle_type: "progress_bar",
    puzzle_data: { questions: 12, required: 6 },
    correct_answer: "6_CORRECT",
    is_locked: false
  },
  {
    id: "mock-lvl-5",
    level_number: 5,
    title: "The Alchemist's Lab",
    story_text: "A rogue alchemist has trapped your crew. Search the opulent lab for the hidden ingredients to counter the spell.",
    puzzle_type: "hidden_object",
    puzzle_data: { hotspots: [{ id: 1, letter: "G" }, { id: 2, letter: "O" }, { id: 3, letter: "L" }, { id: 4, letter: "D" }] },
    correct_answer: "GOLD",
    is_locked: false
  },
  {
    id: "mock-lvl-6",
    level_number: 6,
    title: "The Fragmented Truth",
    story_text: "You are in a dark room. The spirits whisper fragmented truths. You must each read a different clue and combine your knowledge to escape.",
    puzzle_type: "asymmetric_split",
    puzzle_data: { variants: ["OPEN", "THE", "DOOR", "NOW"] },
    correct_answer: "DYNAMIC",
    is_locked: false
  },
  {
    id: "mock-lvl-7",
    level_number: 7,
    title: "The Distorted Signal",
    story_text: "A scrambled radio signal is playing. Some of your crew hear blurred noise. Others must listen carefully to extract the hidden code from the deceptive transmission.",
    puzzle_type: "split_blurred",
    puzzle_data: { clear_text: "TRUST NO SIGNAL", waves: 3 },
    correct_answer: "TRUST NO SIGNAL",
    is_locked: false
  },
  {
    id: "mock-lvl-8",
    level_number: 8,
    title: "The Double Threat",
    story_text: "You face a terrible choice. Take the left path and face a barrage of traps, or take the right path and risk losing everything. Commit to a path and solve its trial.",
    puzzle_type: "animated_fork",
    puzzle_data: { paths: { A: { q: "A ship holds 6 crates. Half are unloaded, then 2 more are added. How many crates now?", a: "5" }, B: { q: "A rope is 9 meters. It's cut into 3 equal pieces, then one piece is cut in half. How long is that half-piece?", a: "1.5" } } },
    correct_answer: "DEPENDS_ON_PATH",
    is_locked: false
  },
  {
    id: "mock-lvl-9",
    level_number: 9,
    title: "The Glowing Altar",
    story_text: "Your starving crew eyes a glowing altar. It offers a tempting shortcut, but beware the hidden trap. Solve the logic puzzle carefully.",
    puzzle_type: "tempting_glow",
    puzzle_data: { setup_q: "A number doubled is 20. Another number tripled is 30. What are the two numbers?", main_q: "Subtract the second number from the first." },
    correct_answer: "0",
    is_locked: false
  },
  {
    id: "mock-lvl-10",
    level_number: 10,
    title: "The Final Gauntlet",
    story_text: "You have reached the final challenge. The door is secured by an ancient combination lock and a test of skill. Prove your worth.",
    puzzle_type: "timing_bar",
    puzzle_data: { targets: 12, speed: 2.5 },
    correct_answer: "VICTORY",
    is_locked: false
  }
];
