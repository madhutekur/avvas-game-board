import { useState } from "react";
import GameHeader from "@/components/GameHeader";
import { getRandomMessage } from "@/lib/avvaAI";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dices } from "lucide-react";
import confetti from "canvas-confetti";

type TokenPosition = {
  id: number;
  position: number; // -1 = home, 0-51 = board path, 52-57 = final lane, 58 = finished
  color: "red" | "green" | "yellow" | "blue";
};

// Board path positions (0-51 around the board)
const PATH_SQUARES = 52;

// Starting positions for each color on the board path
const START_POSITIONS = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39,
};

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
  const [avvaMessage, setAvvaMessage] = useState(getRandomMessage("greeting"));
  const [avvaThinking, setAvvaThinking] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const { toast } = useToast();

  const rollDice = () => {
    const value = Math.floor(Math.random() * 6) + 1;
    setDiceValue(value);
    return value;
  };

  const handlePlayerRoll = () => {
    if (!isPlayerTurn || gameOver || diceValue !== null) return;
    
    const dice = rollDice();
    toast({
      title: `You rolled ${dice}!`,
      description: dice === 6 ? "You get another turn!" : "Click a token to move",
    });

    const hasValidMove = playerTokens.some(token => {
      if (token.position === 58) return false;
      if (token.position === -1) return dice === 6;
      if (token.position >= 52) return token.position + dice <= 58;
      return true;
    });

    if (!hasValidMove) {
      setTimeout(() => {
        setDiceValue(null);
        setIsPlayerTurn(false);
        makeAvvaMove();
      }, 1500);
    }
  };

  const movePlayerToken = (tokenId: number) => {
    if (!diceValue || !isPlayerTurn || gameOver) return;

    const token = playerTokens[tokenId];
    if (token.position === 58) return;

    let newPosition = token.position;
    
    if (token.position === -1 && diceValue === 6) {
      newPosition = START_POSITIONS[token.color];
    } else if (token.position >= 0 && token.position < PATH_SQUARES) {
      const stepsToEntry = (START_POSITIONS[token.color] + 51) % PATH_SQUARES;
      const currentRelative = (token.position - START_POSITIONS[token.color] + PATH_SQUARES) % PATH_SQUARES;
      
      if (currentRelative + diceValue >= 51) {
        // Enter final lane
        newPosition = 52 + (currentRelative + diceValue - 51);
        if (newPosition > 58) return; // Can't overshoot
      } else {
        newPosition = (token.position + diceValue) % PATH_SQUARES;
      }
    } else if (token.position >= 52 && token.position < 58) {
      newPosition = token.position + diceValue;
      if (newPosition > 58) return; // Must roll exact
    } else {
      return;
    }

    const newTokens = [...playerTokens];
    newTokens[tokenId] = { ...token, position: newPosition };
    setPlayerTokens(newTokens);

    if (newPosition === 58) {
      const allFinished = newTokens.every(t => t.position === 58);
      if (allFinished) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        setGameOver(true);
        setAvvaMessage(getRandomMessage("losing"));
        toast({
          title: "You Won!",
          description: "All your tokens reached home!",
        });
        return;
      }
    }

    if (diceValue === 6) {
      setDiceValue(null);
    } else {
      setIsPlayerTurn(false);
      setDiceValue(null);
      setTimeout(makeAvvaMove, 1000);
    }
  };

  const makeAvvaMove = () => {
    setAvvaThinking(true);
    setAvvaMessage(getRandomMessage("thinking"));

    setTimeout(() => {
      const dice = rollDice();
      
      const validTokens = avvaTokens.filter(token => {
        if (token.position === 58) return false;
        if (token.position === -1) return dice === 6;
        if (token.position >= 52) return token.position + dice <= 58;
        return true;
      });

      if (validTokens.length > 0) {
        // Prioritize: finishing > advancing > exiting home
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
              newPosition = tokenToMove.position; // Can't move
            }
          } else {
            newPosition = (tokenToMove.position + dice) % PATH_SQUARES;
          }
        } else if (tokenToMove.position >= 52) {
          const target = tokenToMove.position + dice;
          if (target <= 58) {
            newPosition = target;
          } else {
            newPosition = tokenToMove.position; // Can't move
          }
        }

        const newTokens = [...avvaTokens];
        const idx = newTokens.findIndex(t => t.id === tokenToMove.id);
        newTokens[idx] = { ...tokenToMove, position: newPosition };
        setAvvaTokens(newTokens);

        if (newPosition === 58) {
          const allFinished = newTokens.every(t => t.position === 58);
          if (allFinished) {
            setGameOver(true);
            setAvvaMessage(getRandomMessage("winning"));
            toast({
              title: "Avva Won!",
              description: "All her tokens reached home!",
            });
            setAvvaThinking(false);
            return;
          }
        }
      }

      setAvvaThinking(false);
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
    setGameOver(false);
    setAvvaMessage(getRandomMessage("greeting"));
  };

  // Create proper Ludo cross board with paths
  const renderLudoBoard = () => {
    const squares = [];
    const size = 15;
    
    // Helper to get path square positions
    const getPathSquare = (pathIndex: number) => {
      // Bottom row (0-5): going left from bottom-right
      if (pathIndex >= 0 && pathIndex < 6) {
        return { row: 9, col: 8 - pathIndex };
      }
      // Left column (6-11): going up
      if (pathIndex >= 6 && pathIndex < 12) {
        return { row: 8 - (pathIndex - 6), col: 0 };
      }
      // Top-left to middle (12): corner
      if (pathIndex === 12) return { row: 0, col: 6 };
      // Top row (13-18): going right
      if (pathIndex >= 13 && pathIndex < 19) {
        return { row: 0, col: 6 + (pathIndex - 12) };
      }
      // Right column (19-24): going down
      if (pathIndex >= 19 && pathIndex < 25) {
        return { row: (pathIndex - 18), col: 14 };
      }
      // Bottom-right corner (25): turn
      if (pathIndex === 25) return { row: 9, col: 14 };
      // Bottom row (26-31): going left
      if (pathIndex >= 26 && pathIndex < 32) {
        return { row: 14, col: 14 - (pathIndex - 25) };
      }
      // Left column down (32-37): going down
      if (pathIndex >= 32 && pathIndex < 38) {
        return { row: 9 + (pathIndex - 31), col: 6 };
      }
      // Continue around (38-51)
      if (pathIndex >= 38 && pathIndex < 44) {
        return { row: 14, col: 6 - (pathIndex - 37) };
      }
      if (pathIndex >= 44 && pathIndex < 51) {
        return { row: 14 - (pathIndex - 43), col: 0 };
      }
      if (pathIndex === 51) return { row: 6, col: 0 };
      return { row: 7, col: 7 };
    };

    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const key = `${row}-${col}`;
        let className = "w-8 h-8 border border-[#704214]/20";
        let isPath = false;
        
        // Home zones
        if (row < 6 && col < 6) className += " bg-[#C93C20]/10"; // Red home
        if (row < 6 && col > 8) className += " bg-[#3E8E4E]/10"; // Green home
        if (row > 8 && col < 6) className += " bg-[#F2C94C]/10"; // Yellow home
        if (row > 8 && col > 8) className += " bg-[#3A7BD5]/10"; // Blue home
        
        // Center star
        if (row >= 6 && row <= 8 && col >= 6 && col <= 8) {
          className += " bg-[#D4AF37]/30";
        }
        
        squares.push(<div key={key} className={className}></div>);
      }
    }
    
    return squares;
  };

  const getTokenStyle = (token: TokenPosition) => {
    const pos = token.position;
    
    if (pos === -1) {
      // In home base
      const homePositions = {
        red: [{ row: 2, col: 2 }, { row: 2, col: 4 }, { row: 4, col: 2 }, { row: 4, col: 4 }],
        green: [{ row: 2, col: 10 }, { row: 2, col: 12 }, { row: 4, col: 10 }, { row: 4, col: 12 }],
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
    
    // Final lane positions
    if (pos >= 52) {
      const finalLaneOffsets = {
        red: [{ row: 13, col: 1 }, { row: 12, col: 1 }, { row: 11, col: 1 }, { row: 10, col: 1 }, { row: 9, col: 1 }, { row: 8, col: 1 }],
        green: [{ row: 1, col: 13 }, { row: 1, col: 12 }, { row: 1, col: 11 }, { row: 1, col: 10 }, { row: 1, col: 9 }, { row: 1, col: 8 }],
        yellow: [{ row: 1, col: 13 }, { row: 1, col: 12 }, { row: 1, col: 11 }, { row: 1, col: 10 }, { row: 1, col: 9 }, { row: 1, col: 8 }],
        blue: [{ row: 13, col: 13 }, { row: 12, col: 13 }, { row: 11, col: 13 }, { row: 10, col: 13 }, { row: 9, col: 13 }, { row: 8, col: 13 }],
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
    
    // Path positions
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

  return (
    <div className="min-h-screen bg-background kolam-pattern">
      <GameHeader
        gameName="Ludo"
        onRestart={handleRestart}
        avvaMessage={avvaMessage}
        avvaThinking={avvaThinking}
      />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card className="p-6">
            <div className="text-center space-y-4">
              <div className="text-2xl font-bold">
                {diceValue ? `Dice: ${diceValue}` : "Roll the Dice!"}
              </div>
              
              {isPlayerTurn && !gameOver && (
                <Button
                  size="lg"
                  onClick={handlePlayerRoll}
                  disabled={diceValue !== null}
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

          {/* Ludo Board Visualization */}
          <Card className="p-4">
            <div className="relative aspect-square max-w-[600px] mx-auto bg-[#F8E9D0] border-4 border-[#704214] rounded-lg overflow-hidden">
              {/* Ludo cross board grid */}
              <div className="grid grid-cols-15 grid-rows-15 w-full h-full">
                {renderLudoBoard()}
              </div>

              {/* Player tokens */}
              {playerTokens.map((token) => (
                <div
                  key={`player-${token.id}`}
                  style={getTokenStyle(token)}
                  onClick={() => movePlayerToken(token.id)}
                  className={`w-6 h-6 rounded-full bg-[#F2C94C] border-2 border-white cursor-pointer hover:scale-110 transition-transform z-10 ${
                    !isPlayerTurn || !diceValue || gameOver ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                />
              ))}

              {/* Avva tokens */}
              {avvaTokens.map((token) => (
                <div
                  key={`avva-${token.id}`}
                  style={getTokenStyle(token)}
                  className="w-6 h-6 rounded-full bg-[#3A7BD5] border-2 border-white z-10"
                />
              ))}
            </div>
          </Card>
          
          {gameOver && (
            <Card className="p-6 text-center bg-[#D4AF37]/20 border-2 border-[#D4AF37]">
              <h2 className="text-2xl font-bold mb-2">
                {playerTokens.every(t => t.position === 58) ? "🎉 You Won!" : "Avva Won!"}
              </h2>
              <p className="text-muted-foreground">
                {playerTokens.every(t => t.position === 58) 
                  ? "All your tokens reached home!" 
                  : "All of Avva's tokens reached home!"}
              </p>
              <Button onClick={handleRestart} className="mt-4">Play Again</Button>
            </Card>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-xl font-serif font-bold text-[#F2C94C] mb-4">
                Your Tokens (Yellow)
              </h3>
              <div className="space-y-2">
                {playerTokens.map((token) => (
                  <div
                    key={token.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full bg-[#F2C94C]"></div>
                      <span className="text-sm">Token {token.id + 1}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {token.position === -1
                        ? "Home"
                        : token.position === 58
                        ? "Finished!"
                        : token.position >= 52
                        ? `Final Lane ${token.position - 51}`
                        : `Step ${token.position}`}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-serif font-bold text-[#3A7BD5] mb-4">
                Avva's Tokens (Blue)
              </h3>
              <div className="space-y-2">
                {avvaTokens.map((token) => (
                  <div
                    key={token.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full bg-[#3A7BD5]"></div>
                      <span className="text-sm">Token {token.id + 1}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {token.position === -1
                        ? "Home"
                        : token.position === 58
                        ? "Finished!"
                        : token.position >= 52
                        ? `Final Lane ${token.position - 51}`
                        : `Step ${token.position}`}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {!gameOver && (
            <Card className="p-4 text-center">
              <p className="text-sm text-muted-foreground">
                Roll 6 to start. Move all tokens around the board and into the final lane to win!
              </p>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default LudoGame;
