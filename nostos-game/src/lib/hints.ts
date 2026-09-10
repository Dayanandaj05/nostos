export function getHintForLevel(levelNumber: number): string {
  switch (levelNumber) {
    case 1:
      return "The cipher is a simple shift. Align the rings so the offset is exactly 3.";
    case 2:
      return "You must reveal all the ancient wind symbols. Hover over them to dispel the magic.";
    case 3:
      return "Think carefully: What is greater than the gods, but if you eat it you die? And if you are that to him, who are you?";
    case 4:
      return "You just need to answer 6 correctly! Have one crew member calculate while another types.";
    case 5:
      return "The clickable areas are the large background objects themselves: the Door, Altar, Bush, and Cauldron.";
    case 6:
      return "Your screen only shows a fragment. You must read your word aloud to your crewmates!";
    case 7:
      return "If your screen is blurred with waves, you cannot read it. Ask a teammate whose screen is clear!";
    case 8:
      return "Both paths lead to a math problem. Scylla asks about crates, Charybdis asks about a rope.";
    case 9:
      return "The massive glowing button is a psychological trap! Ignore it and solve the logic puzzle in the text.";
    case 10:
      return "The answer to Trial 3 was NOBODY. The opposite of where the sun rises is WEST.";
    default:
      return "Trust in your crew. The gods are watching.";
  }
}
