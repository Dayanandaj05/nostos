# NOSTOS: The Trials Guide

This document provides a comprehensive breakdown of the 10 core trials in the NOSTOS puzzle game. Each section details the narrative context, the front-end technical design of the puzzle component, and the specific solution path required to progress to the next stage.

---

## Trial 1: The Lotus-Eaters
**Puzzle Type:** `decoder_wheel`

* **Narrative:** You have arrived at an island where time stands still. The inhabitants offer you lotus flowers, and your crew begins to forget their homes. You must decode an ancient scroll to find the true path before you succumb.
* **Component Design:** (`src/components/puzzles/DecoderWheel.tsx`)
  A visual interactive puzzle featuring three concentric rings (outer, middle, inner) with alphabet characters. The player can drag or click to rotate the inner rings to create an offset (a Caesar cipher mechanism). A visual scroll displays the encrypted ciphertext: `VKH ZDLWV WKUHH GDBV ZHVW`. 
* **How to Solve:**
  By aligning the rings with a specific shift (Offset 3), the cipher maps back to standard English. The players must deduce the shift and decode the text manually.
  * **Answer:** `SHE WAITS THREE DAYS WEST`

---

## Trial 2: Aeolus's Winds
**Puzzle Type:** `icon_reveal`

* **Narrative:** The god of winds has gifted you a bag containing all the storm winds. But the bag is tied shut with a puzzle. You must reveal the icons and arrange them to catch the favorable west wind.
* **Component Design:** (`src/components/puzzles/IconReveal.tsx`)
  The UI presents a series of 5 enigmatic "Rune" cards. The cards are heavily stylized to look like ancient wind symbols. Players must interact with (hover or click) the runes to temporarily dispel the fog/magic and reveal the English words hidden underneath.
* **How to Solve:**
  The players must reveal all 5 words hidden beneath the runes and arrange them into a coherent sentence.
  * **Answer:** `FOLLOW THE WEST WIND HOME`

---

## Trial 3: The Cyclops's Cave
**Puzzle Type:** `visual_escape`

* **Narrative:** Trapped in the cave of Polyphemus! He has rolled a massive boulder over the entrance. You must solve his riddles to unlock the mechanism holding the rock in place.
* **Component Design:** (`src/components/puzzles/CyclopsCave.tsx`)
  A dark, claustrophobic UI featuring a massive unmovable boulder blocking a cave exit. It operates as a multi-stage riddle lock. Submitting a wrong answer triggers a violent screen-shake animation (simulating the Cyclops getting angry) and flashes the UI red. 
* **How to Solve:**
  The players must answer two sequential riddles:
  1. *Riddle 1:* "What is greater than the gods, more evil than the demons, the poor have it, the rich need it, and if you eat it, you will die?" -> **Answer:** `NOTHING`
  2. *Riddle 2:* "If you are NOTHING to him, what must you call yourself?" -> **Answer:** `NOBODY`
  * **Final Form Answer:** `NOBODY`

---

## Trial 4: The Laestrygonians
**Puzzle Type:** `progress_bar`

* **Narrative:** Giant cannibals hurl boulders at your fleeing ships! You must navigate the treacherous straits by quickly solving a series of navigational calculations before your ship is sunk.
* **Component Design:** (`src/components/puzzles/Laestrygonians.tsx`)
  A high-pressure time trial. A shrinking progress bar at the top of the screen visually represents the impending boulders. The component generates random mathematical/logic questions (e.g., `12 * 4`, `100 - 37`). Players must type the answers into an internal input box (bypassing the main Oracle form) and hit Enter rapidly. 
* **How to Solve:**
  The players must correctly answer 6 randomly generated math questions before the timer reaches zero. Upon the 6th correct answer, the component automatically submits a hidden override code to the game engine.
  * **Hidden System Answer:** `6_CORRECT` *(Players don't type this; surviving the mini-game submits it automatically)*

---

## Trial 5: Circe's Island
**Puzzle Type:** `hidden_object`

* **Narrative:** The sorceress Circe has turned half your crew into swine! Search her opulent hall for the hidden ingredients to counter her spell.
* **Component Design:** (`src/components/puzzles/HiddenObject.tsx`)
  A visual "point-and-click" style interaction. The UI displays an opulent, stylized scene of Circe's hall. Certain subtle geometric elements in the background act as invisible/faint clickable hotspots. When clicked, a specific letter illuminates.
* **How to Solve:**
  Players must scour the image to find the 3 hidden hotspots. Clicking them reveals the letters P, I, and G. They must deduce the word to break the swine spell.
  * **Answer:** `PIG`

---

## Trial 6: The Land of the Dead
**Puzzle Type:** `asymmetric_split`

* **Narrative:** You have descended into the Underworld. The spirits whisper fragmented truths. You must each listen to a different shade and combine their knowledge to find the way back to the living.
* **Component Design:** (`src/components/puzzles/AsymmetricSplit.tsx`)
  This puzzle requires team communication across multiple devices. When a device loads the page, the server assigns it a specific "variant" (e.g., Device A gets "THE", Device B gets "ROAD", Device C gets "HOME"). A single device will only ever see their specific fragment. 
* **How to Solve:**
  Players sitting at the same physical table must look at each other's screens, communicate the fragments they see, and combine them into the final phrase.
  * **Answer:** `THE ROAD HOME`

---

## Trial 7: The Sirens' Song
**Puzzle Type:** `split_blurred`

* **Narrative:** Approaching the island of the Sirens, some of your crew have stopped their ears with wax (seeing only blurred shapes). Others must listen to the song and pluck the golden words from the deceptive lyrics.
* **Component Design:** (`src/components/puzzles/SirensSong.tsx`)
  Another asymmetric puzzle relying on client-side randomization. 50% of the time, a device will load the "waxed ears" view: heavily blurred text obscured by a dynamic CSS wave animation that makes reading impossible. The other 50% of the time, the device sees the clear text. 
* **How to Solve:**
  The players whose screens are blurred cannot solve the puzzle. They must rely on a teammate whose screen loaded the clear text. The teammate reads the golden phrase hidden in the text.
  * **Answer:** `TRUST NO SONG`

---

## Trial 8: Scylla and Charybdis
**Puzzle Type:** `animated_fork`

* **Narrative:** You face a terrible choice. Sail close to the six-headed monster Scylla and lose some crew, or risk the whirlpool Charybdis and lose the entire ship. Commit to a path and solve its trial.
* **Component Design:** (`src/components/puzzles/ScyllaCharybdis.tsx`)
  A divergent path UI. The screen splits into two buttons: Path A (Scylla) and Path B (Charybdis). The puzzle content is completely hidden until the team votes/clicks on a path. Once a path is chosen, the UI locks into that path and reveals a specific word problem.
* **How to Solve:**
  The answer changes depending on the path chosen. The main game engine accepts multiple correct answers for this specific trial.
  * **Path A (Scylla) Answer:** `5` *(A ship holds 6 crates. Half are unloaded, then 2 more are added.)*
  * **Path B (Charybdis) Answer:** `1.5` *(A rope is 9 meters. It's cut into 3 equal pieces, then one piece is cut in half.)*

---

## Trial 9: The Cattle of Helios
**Puzzle Type:** `tempting_glow`

* **Narrative:** Your starving crew eyes the sacred cattle of the Sun God. A glowing altar offers a tempting shortcut, but beware the wrath of Helios. Solve the logic puzzle carefully.
* **Component Design:** (`src/components/puzzles/CattleOfHelios.tsx`)
  A psychological trap. The UI presents a math problem but includes a massive, pulsing, beautifully animated "golden button" that offers an incredibly obvious (but wrong) shortcut answer. The UI is designed to draw the eye away from the actual text and trick impulsive players.
* **How to Solve:**
  Players must ignore the glowing trap button and actually solve the logic: "A number doubled is 20 (10). Another number tripled is 30 (10). Subtract the second number from the first (10 - 10)."
  * **Answer:** `0`

---

## Trial 10: Return to Ithaca
**Puzzle Type:** `timing_bar`

* **Narrative:** You have finally reached the shores of Ithaca. One last trial remains: align the stars perfectly and recall your past journey to prove you are the true king.
* **Component Design:** (`src/components/puzzles/ReturnToIthaca.tsx`)
  The final meta-puzzle. A beautiful star-field UI. It requires no new complex mechanics, but tests the players' memory of the entire event. It asks players to recall the answer to Trial 3 and combine it with a directional clue.
* **How to Solve:**
  Clue: "Take your Level 3 answer (`NOBODY`). Take the direction opposite of where the sun rises (`WEST`). Combine both, separated by a space."
  * **Answer:** `NOBODY WEST`
