import { useState } from "react";
import GameHeader from "@/components/GameHeader";
import { getRandomMessage } from "@/lib/avvaAI";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import confetti from "canvas-confetti";

const CarromGame = () => {
  const [playerScore, setPlayerScore] = useState(0);
  const [avvaScore, setAvvaScore] = useState(0);
  const [angle, setAngle] = useState(0);
  const [power, setPower] = useState(50);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [avvaMessage, setAvvaMessage] = useState(getRandomMessage("greeting"));
  const [avvaThinking, setAvvaThinking] = useState(false);
  const [coinsLeft, setCoinsLeft] = useState(9);
  const { toast } = useToast();

  const handleShoot = () => {
    if (!isPlayerTurn) return;

    // Simulate hitting based on angle and power
    const hitChance = (power / 100) * (1 - Math.abs(angle) / 180);
    const hit = Math.random() < hitChance;

    if (hit) {
      const newScore = playerScore + 1;
      setPlayerScore(newScore);
      setCoinsLeft(coinsLeft - 1);
      setAvvaMessage(getRandomMessage("mistake"));
      toast({
        title: "Nice shot!",
        description: "You pocketed a coin!",
      });

      if (newScore >= 5) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        toast({
          title: "You Won!",
          description: "You scored 5 coins first!",
        });
        setAvvaMessage(getRandomMessage("losing"));
      } else {
        // Player gets another turn on successful pocket
        return;
      }
    } else {
      toast({
        title: "Missed!",
        description: "Avva's turn now.",
      });
    }

    setIsPlayerTurn(false);
    if (coinsLeft > 1 && playerScore < 5 && avvaScore < 5) {
      setTimeout(makeAvvaShot, 1500);
    }
  };

  const makeAvvaShot = () => {
    setAvvaThinking(true);
    setAvvaMessage(getRandomMessage("thinking"));

    setTimeout(() => {
      // Avva has 40% chance to hit (playful AI)
      const hit = Math.random() < 0.4;

      if (hit) {
        const newScore = avvaScore + 1;
        setAvvaScore(newScore);
        setCoinsLeft(coinsLeft - 1);
        setAvvaMessage(getRandomMessage("goodMove"));
        
        if (newScore >= 5) {
          toast({
            title: "Avva Won!",
            description: "She scored 5 coins first!",
          });
          setAvvaMessage(getRandomMessage("winning"));
          setAvvaThinking(false);
          return;
        }

        // Avva shoots again
        setTimeout(makeAvvaShot, 1500);
      } else {
        setAvvaMessage("Your turn now, kanna!");
        setIsPlayerTurn(true);
      }
      
      setAvvaThinking(false);
    }, 2000);
  };

  const handleRestart = () => {
    setPlayerScore(0);
    setAvvaScore(0);
    setCoinsLeft(9);
    setIsPlayerTurn(true);
    setAvvaMessage(getRandomMessage("greeting"));
    setAngle(0);
    setPower(50);
  };

  const gameOver = playerScore >= 5 || avvaScore >= 5;

  return (
    <div className="min-h-screen bg-background kolam-pattern">
      <GameHeader
        gameName="Carrom"
        onRestart={handleRestart}
        avvaMessage={avvaMessage}
        avvaThinking={avvaThinking}
      />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="p-4 text-center">
              <div className="text-sm text-muted-foreground mb-2">Your Score</div>
              <div className="text-4xl font-bold text-primary">{playerScore}</div>
            </Card>

            <Card className="p-4 text-center">
              <div className="text-sm text-muted-foreground mb-2">Coins Left</div>
              <div className="text-4xl font-bold text-accent">{coinsLeft}</div>
            </Card>

            <Card className="p-4 text-center">
              <div className="text-sm text-muted-foreground mb-2">Avva's Score</div>
              <div className="text-4xl font-bold text-accent">{avvaScore}</div>
            </Card>
          </div>

          <Card className="p-8">
            <div className="aspect-square bg-muted rounded-lg border-4 border-primary relative overflow-hidden">
              {/* Simplified Carrom board visualization */}
              <div className="absolute inset-4 border-2 border-foreground/20 rounded-lg"></div>
              
              {/* Center circle */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border-2 border-foreground/20"></div>
              
              {/* Coins */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 grid grid-cols-3 gap-2">
                {Array.from({ length: coinsLeft }).map((_, i) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded-full bg-accent border-2 border-accent-foreground"
                  ></div>
                ))}
              </div>

              {/* Striker angle indicator */}
              {isPlayerTurn && !gameOver && (
                <div
                  className="absolute bottom-8 left-1/2 -translate-x-1/2 w-1 h-20 bg-primary origin-bottom transition-transform"
                  style={{ transform: `translateX(-50%) rotate(${angle}deg)` }}
                ></div>
              )}
              
              {/* Striker */}
              {isPlayerTurn && !gameOver && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-primary border-2 border-primary-foreground"></div>
              )}
            </div>
          </Card>

          {isPlayerTurn && !gameOver && (
            <Card className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Angle: {angle}°
                </label>
                <Slider
                  value={[angle]}
                  onValueChange={(value) => setAngle(value[0])}
                  min={-45}
                  max={45}
                  step={1}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Power: {power}%
                </label>
                <Slider
                  value={[power]}
                  onValueChange={(value) => setPower(value[0])}
                  min={10}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>

              <Button
                size="lg"
                onClick={handleShoot}
                className="w-full"
              >
                Shoot!
              </Button>
            </Card>
          )}

          {!isPlayerTurn && !gameOver && (
            <Card className="p-4 text-center">
              <p className="text-muted-foreground">Avva is taking her shot...</p>
            </Card>
          )}

          <Card className="p-4 text-center">
            <p className="text-sm text-muted-foreground">
              First to pocket 5 coins wins! Adjust angle and power, then shoot.
            </p>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default CarromGame;
