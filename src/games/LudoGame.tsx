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
  color: "red" | "blue";
};

const LudoGame = () => {
  const [playerTokens, setPlayerTokens] = useState<TokenPosition[]>([
    { id: 0, position: -1, color: "red" },
    { id: 1, position: -1, color: "red" },
    { id: 2, position: -1, color: "red" },
    { id: 3, position: -1, color: "red" },
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
      newPosition = 0; // Red starts at 0
    } else if (token.position >= 0 && token.position < 51) {
      newPosition = token.position + diceValue;
      if (newPosition > 51) {
        newPosition = 51 - (newPosition - 51); // Bounce back
      }
    } else if (token.position === 51) {
      // Enter final lane
      newPosition = 52;
    } else if (token.position >= 52 && token.position < 58) {
      newPosition = Math.min(token.position + diceValue, 58);
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
          newPosition = 13; // Blue starts at position 13
        } else if (tokenToMove.position >= 0 && tokenToMove.position < 51) {
          newPosition = (tokenToMove.position + dice) % 52;
        } else if (tokenToMove.position === 51) {
          newPosition = 52;
        } else if (tokenToMove.position >= 52) {
          newPosition = Math.min(tokenToMove.position + dice, 58);
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
      { id: 0, position: -1, color: "red" },
      { id: 1, position: -1, color: "red" },
      { id: 2, position: -1, color: "red" },
      { id: 3, position: -1, color: "red" },
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

  const getTokenStyle = (token: TokenPosition) => {
    const pos = token.position;
    
    if (pos === -1) return { display: 'none' };
    if (pos === 58) return { display: 'none' };
    
    // Calculate position on board (simplified visualization)
    const boardSize = 600;
    const cellSize = boardSize / 15;
    
    // Map positions to coordinates (simplified cross pattern)
    let x = 0, y = 0;
    
    if (pos >= 0 && pos < 13) {
      // Bottom row going left
      x = boardSize - (pos + 1) * cellSize;
      y = boardSize - cellSize * 2;
    } else if (pos >= 13 && pos < 26) {
      // Left column going up
      x = cellSize;
      y = boardSize - (pos - 12) * cellSize;
    } else if (pos >= 26 && pos < 39) {
      // Top row going right
      x = (pos - 25) * cellSize;
      y = cellSize * 2;
    } else if (pos >= 39 && pos < 52) {
      // Right column going down
      x = boardSize - cellSize * 2;
      y = (pos - 38) * cellSize;
    } else if (pos >= 52 && pos < 58) {
      // Final lane (center)
      const lanePos = pos - 52;
      if (token.color === 'red') {
        x = boardSize / 2 - cellSize;
        y = boardSize - (lanePos + 3) * cellSize;
      } else {
        x = boardSize / 2 + cellSize;
        y = (lanePos + 3) * cellSize;
      }
    }
    
    return {
      position: 'absolute' as const,
      left: `${(x / boardSize) * 100}%`,
      top: `${(y / boardSize) * 100}%`,
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
            <div className="relative aspect-square max-w-[600px] mx-auto bg-[#F8E9D0] border-4 border-[#704214] rounded-lg">
              {/* Cross-shaped board outline */}
              <div className="absolute inset-0 grid grid-cols-15 grid-rows-15">
                {/* Red quadrant (bottom-left) */}
                <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-[#C93C20]/20 border-2 border-[#C93C20] rounded-tl-lg"></div>
                {/* Blue quadrant (top-right) */}
                <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-[#3A7BD5]/20 border-2 border-[#3A7BD5] rounded-br-lg"></div>
                {/* Center star */}
                <div className="absolute top-1/2 left-1/2 w-[20%] h-[20%] -translate-x-1/2 -translate-y-1/2 bg-[#D4AF37] rounded-full flex items-center justify-center">
                  <span className="text-2xl">★</span>
                </div>
              </div>

              {/* Player tokens */}
              {playerTokens.map((token) => (
                <div
                  key={`player-${token.id}`}
                  style={getTokenStyle(token)}
                  onClick={() => movePlayerToken(token.id)}
                  className={`w-6 h-6 rounded-full bg-[#C93C20] border-2 border-white cursor-pointer hover:scale-110 transition-transform ${
                    !isPlayerTurn || !diceValue || gameOver ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                />
              ))}

              {/* Avva tokens */}
              {avvaTokens.map((token) => (
                <div
                  key={`avva-${token.id}`}
                  style={getTokenStyle(token)}
                  className="w-6 h-6 rounded-full bg-[#3A7BD5] border-2 border-white"
                />
              ))}
            </div>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-xl font-serif font-bold text-[#C93C20] mb-4">
                Your Tokens (Red)
              </h3>
              <div className="space-y-2">
                {playerTokens.map((token) => (
                  <div
                    key={token.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full bg-[#C93C20]"></div>
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

          <Card className="p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Roll 6 to start. Move all tokens around the board and into the final lane to win!
            </p>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default LudoGame;
