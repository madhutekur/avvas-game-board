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
  position: number; // -1 = home, 0-51 = board, 100 = finished
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
    if (!isPlayerTurn || gameOver) return;
    
    const dice = rollDice();
    toast({
      title: `You rolled ${dice}!`,
      description: dice === 6 ? "You get another turn!" : "Click a token to move",
    });

    // If no valid moves, pass turn
    const hasValidMove = playerTokens.some(token => {
      if (token.position === 100) return false;
      if (token.position === -1) return dice === 6;
      return token.position + dice <= 51;
    });

    if (!hasValidMove) {
      setTimeout(() => {
        setIsPlayerTurn(false);
        makeAvvaMove();
      }, 1500);
    }
  };

  const movePlayerToken = (tokenId: number) => {
    if (!diceValue || !isPlayerTurn || gameOver) return;

    const token = playerTokens[tokenId];
    if (token.position === 100) return;

    let newPosition = token.position;
    
    if (token.position === -1 && diceValue === 6) {
      newPosition = 0;
    } else if (token.position >= 0) {
      newPosition = Math.min(token.position + diceValue, 100);
      if (token.position + diceValue > 51) newPosition = 100;
    } else {
      return;
    }

    const newTokens = [...playerTokens];
    newTokens[tokenId] = { ...token, position: newPosition };
    setPlayerTokens(newTokens);

    if (newPosition === 100) {
      const allFinished = newTokens.every(t => t.position === 100);
      if (allFinished) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
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
      
      // Simple AI: move token furthest ahead that can move
      const validTokens = avvaTokens.filter(token => {
        if (token.position === 100) return false;
        if (token.position === -1) return dice === 6;
        return token.position + dice <= 51;
      });

      if (validTokens.length > 0) {
        const tokenToMove = validTokens.reduce((best, current) => 
          current.position > best.position ? current : best
        );

        let newPosition = tokenToMove.position;
        if (tokenToMove.position === -1 && dice === 6) {
          newPosition = 0;
        } else {
          newPosition = Math.min(tokenToMove.position + dice, 100);
          if (tokenToMove.position + dice > 51) newPosition = 100;
        }

        const newTokens = [...avvaTokens];
        const idx = newTokens.findIndex(t => t.id === tokenToMove.id);
        newTokens[idx] = { ...tokenToMove, position: newPosition };
        setAvvaTokens(newTokens);

        if (newPosition === 100) {
          const allFinished = newTokens.every(t => t.position === 100);
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
      if (dice === 6) {
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

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-xl font-serif font-bold text-primary mb-4">
                Your Tokens (Red)
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {playerTokens.map((token) => (
                  <Button
                    key={token.id}
                    variant="outline"
                    className={`h-24 ${
                      token.position === 100 
                        ? "bg-success text-success-foreground" 
                        : "hover:border-primary"
                    }`}
                    onClick={() => movePlayerToken(token.id)}
                    disabled={!isPlayerTurn || !diceValue || gameOver}
                  >
                    <div className="text-center">
                      <div className="w-8 h-8 rounded-full bg-primary mx-auto mb-2"></div>
                      <div className="text-xs">
                        {token.position === -1
                          ? "Home"
                          : token.position === 100
                          ? "Finished!"
                          : `Step ${token.position}`}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-serif font-bold text-accent mb-4">
                Avva's Tokens (Blue)
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {avvaTokens.map((token) => (
                  <div
                    key={token.id}
                    className={`h-24 border-2 rounded-lg flex items-center justify-center ${
                      token.position === 100
                        ? "bg-success/20 border-success"
                        : "border-border"
                    }`}
                  >
                    <div className="text-center">
                      <div className="w-8 h-8 rounded-full bg-accent mx-auto mb-2"></div>
                      <div className="text-xs text-muted-foreground">
                        {token.position === -1
                          ? "Home"
                          : token.position === 100
                          ? "Finished!"
                          : `Step ${token.position}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card className="p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Roll 6 to start. Move all tokens to position 51+ to win!
            </p>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default LudoGame;
