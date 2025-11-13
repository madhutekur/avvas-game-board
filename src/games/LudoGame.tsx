import { useState } from "react";
import GameHeader from "@/components/GameHeader";
import { GameOverModal } from "@/components/GameOverModal";
import { getRandomMessage } from "@/lib/avvaAI";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dices } from "lucide-react";
import confetti from "canvas-confetti";

type TokenPosition = {
  id: number;
  position: number; // -1 = home, 0-51 = board path, 52-57 = final lane, 58 = finished
  color: "yellow" | "blue";
};

const PATH_SQUARES = 52;

const START_POSITIONS = {
  yellow: 26,
  blue: 39,
};

const HOME_ENTRY = {
  yellow: 24,
  blue: 37,
};

const SAFE_SQUARES = [1, 9, 14, 22, 27, 35, 40, 48];

const RULES = [
  "Each player has 4 tokens starting in their home base.",
  "Roll a 6 to exit home. Rolling a 6 grants an extra turn.",
  "Tokens move clockwise along the track based on dice roll.",
  "Landing on an opponent's token (outside safe zones) sends it home.",
  "After completing the main path, enter your finish lane.",
  "First player to get all 4 tokens in the finish lane wins!",
];

const LudoGame = () => {
  const [playerTokens, setPlayerTokens] = useState<TokenPosition[]>([
    { id: 0, position: -1, color: "yellow" },
    { id: 1, position: -1, color: "yellow" },
    { id: 2, position: -1, color: "yellow" },
    { id: 3, position: -1, color: "yellow" },
  ]);
  
  const [avvaTokens, setAvvaTokens] = useState<TokenPosition[]>([
    { id: 0, position: -1, color: "blue" },
    { id: 1, position: -1, color: "blue" },
    { id: 2, position: -1, color: "blue" },
    { id: 3, position: -1, color: "blue" },
  ]);

  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [isRolling, setIsRolling] = useState(false);
  const [avvaMessage, setAvvaMessage] = useState(getRandomMessage("greeting"));
  const [avvaThinking, setAvvaThinking] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<"player" | "avva" | null>(null);
  const { toast } = useToast();

  const rollDice = () => {
    const value = Math.floor(Math.random() * 6) + 1;
    setDiceValue(value);
    return value;
  };

  const handlePlayerRoll = () => {
    if (!isPlayerTurn || gameOver || diceValue !== null || isRolling) return;
    
    setIsRolling(true);
    const dice = rollDice();
    
    setTimeout(() => {
      setIsRolling(false);
      toast({
        title: `You rolled ${dice}!`,
        description: dice === 6 ? "You get another turn!" : "Click a token to move",
      });

      const hasValidMove = playerTokens.some(token => canTokenMove(token, dice));

      if (!hasValidMove) {
        toast({
          title: "No legal moves",
          description: "Passing turn to Avva",
        });
        setTimeout(() => {
          setDiceValue(null);
          if (dice !== 6) {
            setIsPlayerTurn(false);
            makeAvvaMove();
          }
        }, 1500);
      }
    }, 500);
  };

  const canTokenMove = (token: TokenPosition, dice: number): boolean => {
    if (token.position === 58) return false;
    if (token.position === -1) return dice === 6;
    if (token.position >= 52) return token.position + dice <= 58;
    return true;
  };

  const movePlayerToken = (tokenId: number) => {
    if (!diceValue || !isPlayerTurn || gameOver || isRolling) return;

    const token = playerTokens[tokenId];
    if (!canTokenMove(token, diceValue)) return;

    let newPosition = token.position;
    
    if (token.position === -1 && diceValue === 6) {
      newPosition = START_POSITIONS[token.color];
    } else if (token.position >= 0 && token.position < PATH_SQUARES) {
      const currentRelative = (token.position - START_POSITIONS[token.color] + PATH_SQUARES) % PATH_SQUARES;
      
      if (currentRelative + diceValue >= 51) {
        newPosition = 52 + (currentRelative + diceValue - 51);
        if (newPosition > 58) return;
      } else {
        newPosition = (token.position + diceValue) % PATH_SQUARES;
      }
    } else if (token.position >= 52 && token.position < 58) {
      newPosition = token.position + diceValue;
      if (newPosition > 58) return;
    } else {
      return;
    }

    const newTokens = [...playerTokens];
    newTokens[tokenId] = { ...token, position: newPosition };
    
    // Check for capture
    if (newPosition >= 0 && newPosition < 52 && !SAFE_SQUARES.includes(newPosition)) {
      const capturedAvvaTokenIdx = avvaTokens.findIndex(t => t.position === newPosition);
      if (capturedAvvaTokenIdx !== -1) {
        const newAvvaTokens = [...avvaTokens];
        newAvvaTokens[capturedAvvaTokenIdx] = { ...avvaTokens[capturedAvvaTokenIdx], position: -1 };
        setAvvaTokens(newAvvaTokens);
        toast({
          title: "Captured!",
          description: "You sent Avva's token back home!",
        });
      }
    }
    
    setPlayerTokens(newTokens);

    if (newPosition === 58) {
      const allFinished = newTokens.every(t => t.position === 58);
      if (allFinished) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        setGameOver(true);
        setWinner("player");
        setAvvaMessage(getRandomMessage("losing"));
        return;
      }
    }

    const hadSix = diceValue === 6;
    setDiceValue(null);
    
    if (hadSix) {
      toast({
        title: "Roll again!",
        description: "You rolled a 6, take another turn!",
      });
    } else {
      setIsPlayerTurn(false);
      setTimeout(makeAvvaMove, 1000);
    }
  };

  const makeAvvaMove = () => {
    setAvvaThinking(true);
    setAvvaMessage(getRandomMessage("thinking"));

    setTimeout(() => {
      const dice = rollDice();
      
      const validTokens = avvaTokens.filter(token => canTokenMove(token, dice));

      if (validTokens.length > 0) {
        const tokenToMove = validTokens.reduce((best, current) => {
          if (current.position + dice === 58) return current;
          if (best.position + dice === 58) return best;
          return current.position > best.position ? current : best;
        });

        let newPosition = tokenToMove.position;
        if (tokenToMove.position === -1 && dice === 6) {
          newPosition = START_POSITIONS[tokenToMove.color];
        } else if (tokenToMove.position >= 0 && tokenToMove.position < PATH_SQUARES) {
          const currentRelative = (tokenToMove.position - START_POSITIONS[tokenToMove.color] + PATH_SQUARES) % PATH_SQUARES;
          
          if (currentRelative + dice >= 51) {
            newPosition = 52 + (currentRelative + dice - 51);
            if (newPosition > 58) {
              newPosition = tokenToMove.position;
            }
          } else {
            newPosition = (tokenToMove.position + dice) % PATH_SQUARES;
          }
        } else if (tokenToMove.position >= 52) {
          const target = tokenToMove.position + dice;
          if (target <= 58) {
            newPosition = target;
          } else {
            newPosition = tokenToMove.position;
          }
        }

        const newTokens = [...avvaTokens];
        const idx = newTokens.findIndex(t => t.id === tokenToMove.id);
        newTokens[idx] = { ...tokenToMove, position: newPosition };
        
        // Check for capture
        if (newPosition >= 0 && newPosition < 52 && !SAFE_SQUARES.includes(newPosition)) {
          const capturedPlayerTokenIdx = playerTokens.findIndex(t => t.position === newPosition);
          if (capturedPlayerTokenIdx !== -1) {
            const newPlayerTokens = [...playerTokens];
            newPlayerTokens[capturedPlayerTokenIdx] = { ...playerTokens[capturedPlayerTokenIdx], position: -1 };
            setPlayerTokens(newPlayerTokens);
          }
        }
        
        setAvvaTokens(newTokens);

        if (newPosition === 58) {
          const allFinished = newTokens.every(t => t.position === 58);
          if (allFinished) {
            setGameOver(true);
            setWinner("avva");
            setAvvaMessage(getRandomMessage("winning"));
            setAvvaThinking(false);
            setDiceValue(null);
            return;
          }
        }
      }

      setAvvaThinking(false);
      setDiceValue(null);
      
      if (dice === 6 && !gameOver) {
        setTimeout(makeAvvaMove, 1000);
      } else {
        setIsPlayerTurn(true);
        setAvvaMessage(getRandomMessage("goodMove"));
      }
    }, 1500);
  };

  const handleRestart = () => {
    setPlayerTokens([
      { id: 0, position: -1, color: "yellow" },
      { id: 1, position: -1, color: "yellow" },
      { id: 2, position: -1, color: "yellow" },
      { id: 3, position: -1, color: "yellow" },
    ]);
    setAvvaTokens([
      { id: 0, position: -1, color: "blue" },
      { id: 1, position: -1, color: "blue" },
      { id: 2, position: -1, color: "blue" },
      { id: 3, position: -1, color: "blue" },
    ]);
    setDiceValue(null);
    setIsPlayerTurn(true);
    setIsRolling(false);
    setGameOver(false);
    setWinner(null);
    setAvvaMessage(getRandomMessage("greeting"));
  };

  const getTokenStyle = (token: TokenPosition) => {
    const pos = token.position;
    
    if (pos === -1) {
      const homePositions = {
        yellow: [{ row: 10, col: 2 }, { row: 10, col: 4 }, { row: 12, col: 2 }, { row: 12, col: 4 }],
        blue: [{ row: 10, col: 10 }, { row: 10, col: 12 }, { row: 12, col: 10 }, { row: 12, col: 12 }],
      };
      const homePos = homePositions[token.color][token.id];
      return {
        position: 'absolute' as const,
        left: `${(homePos.col / 15) * 100}%`,
        top: `${(homePos.row / 15) * 100}%`,
        transform: 'translate(-50%, -50%)',
      };
    }
    
    if (pos === 58) return { display: 'none' };
    
    if (pos >= 52) {
      const finalLaneOffsets = {
        yellow: [{ row: 7, col: 1 }, { row: 7, col: 2 }, { row: 7, col: 3 }, { row: 7, col: 4 }, { row: 7, col: 5 }, { row: 7, col: 6 }],
        blue: [{ row: 7, col: 13 }, { row: 7, col: 12 }, { row: 7, col: 11 }, { row: 7, col: 10 }, { row: 7, col: 9 }, { row: 7, col: 8 }],
      };
      const laneIdx = Math.min(pos - 52, 5);
      const lanePos = finalLaneOffsets[token.color][laneIdx];
      return {
        position: 'absolute' as const,
        left: `${(lanePos.col / 15) * 100}%`,
        top: `${(lanePos.row / 15) * 100}%`,
        transform: 'translate(-50%, -50%)',
      };
    }
    
    const pathCoords = [
      { row: 8, col: 8 }, { row: 8, col: 7 }, { row: 8, col: 6 }, { row: 8, col: 5 }, { row: 8, col: 4 }, { row: 8, col: 3 },
      { row: 8, col: 2 }, { row: 8, col: 1 }, { row: 8, col: 0 }, { row: 7, col: 0 }, { row: 6, col: 0 },
      { row: 5, col: 0 }, { row: 4, col: 0 }, { row: 3, col: 0 }, { row: 2, col: 0 }, { row: 1, col: 0 }, { row: 0, col: 0 },
      { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 0, col: 3 }, { row: 0, col: 4 }, { row: 0, col: 5 }, { row: 0, col: 6 },
      { row: 0, col: 7 }, { row: 0, col: 8 }, { row: 0, col: 9 }, { row: 0, col: 10 }, { row: 0, col: 11 }, { row: 0, col: 12 }, { row: 0, col: 13 }, { row: 0, col: 14 },
      { row: 1, col: 14 }, { row: 2, col: 14 }, { row: 3, col: 14 }, { row: 4, col: 14 }, { row: 5, col: 14 }, { row: 6, col: 14 },
      { row: 7, col: 14 }, { row: 8, col: 14 }, { row: 9, col: 14 }, { row: 10, col: 14 }, { row: 11, col: 14 }, { row: 12, col: 14 }, { row: 13, col: 14 }, { row: 14, col: 14 },
      { row: 14, col: 13 }, { row: 14, col: 12 }, { row: 14, col: 11 }, { row: 14, col: 10 }, { row: 14, col: 9 }, { row: 14, col: 8 }, { row: 14, col: 7 }, { row: 14, col: 6 }
    ];
    
    const coord = pathCoords[pos] || { row: 7, col: 7 };
    return {
      position: 'absolute' as const,
      left: `${(coord.col / 15) * 100}%`,
      top: `${(coord.row / 15) * 100}%`,
      transform: 'translate(-50%, -50%)',
    };
  };

  const renderLudoBoard = () => {
    const squares = [];
    const size = 15;
    
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const key = `${row}-${col}`;
        let className = "w-8 h-8 border border-[#704214]/20";
        
        if (row < 6 && col < 6) className += " bg-[#C93C20]/10";
        if (row < 6 && col > 8) className += " bg-[#3E8E4E]/10";
        if (row > 8 && col < 6) className += " bg-[#F2C94C]/10";
        if (row > 8 && col > 8) className += " bg-[#3A7BD5]/10";
        
        if (row >= 6 && row <= 8 && col >= 6 && col <= 8) {
          className += " bg-[#D4AF37]/30";
        }
        
        const isPathSquare = (
          (row === 8 && col >= 0 && col <= 14) ||
          (row === 6 && col >= 0 && col <= 14) ||
          (row === 0 && col >= 0 && col <= 14) ||
          (row === 14 && col >= 0 && col <= 14) ||
          (col === 0 && row >= 0 && row <= 14) ||
          (col === 14 && row >= 0 && row <= 14) ||
          (row === 7 && (col >= 0 && col <= 6 || col >= 8 && col <= 14))
        );
        
        if (isPathSquare) {
          className += " bg-[#F8E9D0] border-2 border-[#704214]/40";
        }
        
        squares.push(<div key={key} className={className}></div>);
      }
    }
    
    return squares;
  };

  return (
    <div className="min-h-screen bg-background kolam-pattern">
      <GameHeader
        gameName="Ludo"
        onRestart={handleRestart}
        avvaMessage={avvaMessage}
        avvaThinking={avvaThinking}
        rules={RULES}
      />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card className="p-6">
            <div className="text-center space-y-4">
              <div className="text-2xl font-bold">
                {diceValue ? `Dice: ${diceValue}` : isRolling ? "Rolling..." : "Roll the Dice!"}
              </div>
              
              {isPlayerTurn && !gameOver && (
                <Button
                  size="lg"
                  onClick={handlePlayerRoll}
                  disabled={diceValue !== null || isRolling}
                  className="gap-2"
                >
                  <Dices className="w-5 h-5" />
                  Roll Dice
                </Button>
              )}

              {!isPlayerTurn && !gameOver && (
                <div className="text-muted-foreground">Avva is rolling...</div>
              )}
            </div>
          </Card>

          <Card className="p-4">
            <div className="relative aspect-square max-w-[600px] mx-auto bg-[#F8E9D0] border-4 border-[#704214] rounded-lg overflow-hidden">
              <div className="grid grid-cols-15 grid-rows-15 w-full h-full">
                {renderLudoBoard()}
              </div>

              {playerTokens.map((token) => (
                <div
                  key={`player-${token.id}`}
                  style={getTokenStyle(token)}
                  onClick={() => movePlayerToken(token.id)}
                  className={`w-6 h-6 rounded-full bg-[#F2C94C] border-2 border-white cursor-pointer hover:scale-110 transition-transform z-10 ${
                    !isPlayerTurn || !diceValue || gameOver || isRolling ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                />
              ))}

              {avvaTokens.map((token) => (
                <div
                  key={`avva-${token.id}`}
                  style={getTokenStyle(token)}
                  className="w-6 h-6 rounded-full bg-[#3A7BD5] border-2 border-white z-10"
                />
              ))}
            </div>
          </Card>

          {!gameOver && (
            <Card className="p-4 text-center">
              <p className="text-sm text-muted-foreground">
                Roll a 6 to exit home. First to get all 4 tokens in the finish lane wins!
              </p>
            </Card>
          )}
        </div>
      </main>

      <GameOverModal
        open={gameOver}
        winner={winner || "draw"}
        message={winner === "player" 
          ? "All your tokens reached the finish lane!" 
          : "All of Avva's tokens reached the finish lane!"}
        onRestart={handleRestart}
      />
    </div>
  );
};

export default LudoGame;
