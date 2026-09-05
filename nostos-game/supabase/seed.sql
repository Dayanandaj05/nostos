-- Seed Levels
INSERT INTO levels (level_number, title, story_text, puzzle_type, puzzle_data, correct_answer) VALUES
(1, 'The Lotus-Eaters', 'You have arrived at an island where time stands still. The inhabitants offer you lotus flowers, and your crew begins to forget their homes. Decode the ancient scrolls to find the true path before you all succumb.', 'decoder_wheel', '{"scrolls": ["VKH ZDLWV WKUHH GDBV ZHVW", "JLYH XS DQG VWDb", "WKH VHD LV FROG DQG GDUN", "IRUJHW BRXU KRPH"]}', 'SHE WAITS THREE DAYS WEST'),

(2, 'Aeolus''s Winds', 'The god of winds has gifted you a bag containing all the storm winds. But the bag is tied shut with a puzzle. Reveal the icons and arrange them to catch the favorable west wind.', 'icon_reveal', '{"words": ["FOLLOW", "THE", "WEST", "WIND", "HOME"]}', 'FOLLOW THE WEST WIND HOME'),

(3, 'The Cyclops''s Cave', 'Trapped in the cave of Polyphemus! He has rolled a massive boulder over the entrance. You must solve his three riddles to unlock the mechanism holding the rock in place.', 'visual_escape', '{"riddles": [{"q": "What is greater than the gods, more evil than the demons, the poor have it, the rich need it, and if you eat it, you will die?", "a": "NOTHING"}, {"q": "If you are NOTHING to him, what must you call yourself?", "a": "NOBODY"}]}', 'NOBODY'),

(4, 'The Laestrygonians', 'Giant cannibals hurl boulders at your fleeing ships! You must navigate the treacherous straits by quickly solving a series of navigational calculations. Be swift, or be sunk.', 'progress_bar', '{"questions": 12, "required": 6}', '6_CORRECT'),

(5, 'Circe''s Island', 'The sorceress Circe has turned half your crew into swine! Search her opulent hall for the hidden ingredients to counter her spell.', 'hidden_object', '{"hotspots": [{"id": 1, "letter": "P"}, {"id": 2, "letter": "I"}, {"id": 3, "letter": "G"}]}', 'PIG'),

(6, 'The Land of the Dead', 'You have descended into the Underworld. The spirits whisper fragmented truths. You must each listen to a different shade and combine their knowledge to find the way back to the living.', 'asymmetric_split', '{"variants": ["THE", "ROAD", "HOME"]}', 'THE ROAD HOME'),

(7, 'The Sirens'' Song', 'Approaching the island of the Sirens, some of your crew have stopped their ears with wax, seeing only blurred shapes. Others must listen to the song and pluck the golden words from the deceptive lyrics.', 'split_blurred', '{"clear_text": "TRUST NO SONG", "waves": 3}', 'TRUST NO SONG'),

(8, 'Scylla and Charybdis', 'You face a terrible choice. Sail close to the six-headed monster Scylla and lose some crew, or risk the whirlpool Charybdis and lose the entire ship. Commit to a path and solve its trial.', 'animated_fork', '{"paths": {"A": {"q": "A ship holds 6 crates. Half are unloaded, then 2 more are added. How many crates now?", "a": "5"}, "B": {"q": "A rope is 9 meters. It''s cut into 3 equal pieces, then one piece is cut in half. How long is that half-piece?", "a": "1.5"}}}', 'DEPENDS_ON_PATH'),

(9, 'The Cattle of Helios', 'Your starving crew eyes the sacred cattle of the Sun God. A glowing altar offers a tempting shortcut, but beware the wrath of Helios. Solve the logic puzzle carefully.', 'tempting_glow', '{"setup_q": "A number doubled is 20. Another number tripled is 30. What are the two numbers?", "main_q": "Subtract the second number from the first."}', '0'),

(10, 'Return to Ithaca', 'You have finally reached the shores of Ithaca. One last trial remains: align the stars perfectly and recall your past journey to prove you are the true king.', 'timing_bar', '{"combination_clue": "Take your Level 3 answer. Take the direction opposite of where the sun rises. Combine both, separated by a space."}', 'NOBODY WEST');
