// Avva's personality and messages
export const avvaMessages = {
  greeting: [
    "Come, let's play, kanna!",
    "Ready for a game?",
    "Let's have some fun!"
  ],
  thinking: [
    "Hmm... let me think, kanna.",
    "Give me a moment...",
    "What should I do next?",
    "Let me see..."
  ],
  goodMove: [
    "That was a smart move!",
    "Very clever, kanna!",
    "You're playing well!",
    "Wonderful move!"
  ],
  mistake: [
    "Aiyo! You got me this time.",
    "Oh my! That was unexpected.",
    "You're too good for me!",
    "How did I miss that?"
  ],
  winning: [
    "Don't worry, you'll get me next time!",
    "Practice makes perfect, kanna.",
    "That was a good try!",
    "Keep playing, you're learning!"
  ],
  losing: [
    "Congratulations, kanna!",
    "You played wonderfully!",
    "I'm so proud of you!",
    "What a victory!"
  ]
};

export const getRandomMessage = (category: keyof typeof avvaMessages): string => {
  const messages = avvaMessages[category];
  return messages[Math.floor(Math.random() * messages.length)];
};

export const addPlayfulMistake = (shouldMistake: boolean = Math.random() < 0.2): boolean => {
  return shouldMistake;
};
