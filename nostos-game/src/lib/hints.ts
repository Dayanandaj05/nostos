export function getHintForLevel(levelNumber: number): string {
  switch (levelNumber) {
    case 1:
      return "The Caesar cipher turns back the wheel. Rotate the outer ring until the ancient letters align into meaningful words.";
    case 2:
      return "Dispel the storm clouds to reveal the wind symbols, then align them to catch the favorable breeze.";
    case 3:
      return "Riddle 1 asks for the ultimate void. Riddle 3 asks for the clever alias Odysseus gave the monster.";
    case 4:
      return "Be swift and precise. Work together to solve the rapid nautical calculations before your fleet founders.";
    case 5:
      return "Search Circe's hall carefully. Equipping the right tools will reveal the letters of the antidote herb.";
    case 6:
      return "The Underworld speaks in fragments. Combine the word unlocked on your screen with your crewmates' fragments in chat.";
    case 7:
      return "The Sirens' song deafens most. The crew member who can hear clearly must transmit the floating lyrics to the crew.";
    case 8:
      return "Calculate your route carefully. Analyze the tactical dilemma of the monster or whirlpool path.";
    case 9:
      return "Do not let divine temptation blind you. Ignore the glowing shortcut and solve the sacred herd equation.";
    case 10:
      return "Recall your past voyage: remember the alias used in the Cyclops' cave and the cardinal direction where the sun sets.";
    default:
      return "Trust in your crew. The gods are watching.";
  }
}
