import { useState, useEffect, useRef } from "react";
import Matter from "matter-js";
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
  const [queenPocketed, setQueenPocketed] = useState<"player" | "avva" | null>(null);
  const [queenCovered, setQueenCovered] = useState(false);
  const [strikerX, setStrikerX] = useState(300);
  const [gameOver, setGameOver] = useState(false);
  const { toast } = useToast();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const coinsRef = useRef<Matter.Body[]>([]);
  const strikerRef = useRef<Matter.Body | null>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = 600;
    const height = 600;
    canvas.width = width;
    canvas.height = height;

    // Create engine
    const engine = Matter.Engine.create();
    engine.gravity.y = 0;
    engineRef.current = engine;

    // Create walls
    const wallThickness = 20;
    const walls = [
      Matter.Bodies.rectangle(width / 2, wallThickness / 2, width, wallThickness, { isStatic: true }),
      Matter.Bodies.rectangle(width / 2, height - wallThickness / 2, width, wallThickness, { isStatic: true }),
      Matter.Bodies.rectangle(wallThickness / 2, height / 2, wallThickness, height, { isStatic: true }),
      Matter.Bodies.rectangle(width - wallThickness / 2, height / 2, wallThickness, height, { isStatic: true }),
    ];

    // Create pockets at corners
    const pocketRadius = 25;
    const pocketOffset = 30;
    const pockets = [
      { x: pocketOffset, y: pocketOffset },
      { x: width - pocketOffset, y: pocketOffset },
      { x: pocketOffset, y: height - pocketOffset },
      { x: width - pocketOffset, y: height - pocketOffset },
    ];

    // Create coins (9 white, 9 black, 1 red queen)
    const coins: Matter.Body[] = [];
    const coinRadius = 15;
    const center = { x: width / 2, y: height / 2 };

    // Red queen in center
    coins.push(
      Matter.Bodies.circle(center.x, center.y, coinRadius, {
        restitution: 0.7,
        friction: 0.05,
        frictionAir: 0.02,
        label: "queen",
      })
    );

    // Arrange other coins in a circle
    const positions = [
      { x: 0, y: -30 }, { x: 26, y: -15 }, { x: 26, y: 15 }, { x: 0, y: 30 },
      { x: -26, y: 15 }, { x: -26, y: -15 }, { x: 0, y: -60 }, { x: 52, y: -30 },
      { x: 52, y: 30 }, { x: 0, y: 60 }, { x: -52, y: 30 }, { x: -52, y: -30 },
      { x: 30, y: 0 }, { x: -30, y: 0 }, { x: 45, y: 0 }, { x: -45, y: 0 },
      { x: 15, y: -45 }, { x: -15, y: 45 },
    ];

    positions.forEach((pos, i) => {
      coins.push(
        Matter.Bodies.circle(center.x + pos.x, center.y + pos.y, coinRadius, {
          restitution: 0.7,
          friction: 0.05,
          frictionAir: 0.02,
          label: i < 9 ? "white" : "black",
        })
      );
    });

    coinsRef.current = coins;

    // Add all bodies to world
    Matter.World.add(engine.world, [...walls, ...coins]);

    // Render function
    const render = () => {
      ctx.fillStyle = "#F8E9D0";
      ctx.fillRect(0, 0, width, height);

      // Draw border
      ctx.strokeStyle = "#704214";
      ctx.lineWidth = wallThickness;
      ctx.strokeRect(wallThickness / 2, wallThickness / 2, width - wallThickness, height - wallThickness);

      // Draw center circle
      ctx.strokeStyle = "#704214";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(center.x, center.y, 80, 0, Math.PI * 2);
      ctx.stroke();

      // Draw pockets
      pockets.forEach(pocket => {
        ctx.fillStyle = "#000000";
        ctx.beginPath();
        ctx.arc(pocket.x, pocket.y, pocketRadius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw coins
      coinsRef.current.forEach(coin => {
        const { x, y } = coin.position;
        ctx.beginPath();
        ctx.arc(x, y, coinRadius, 0, Math.PI * 2);
        
        if (coin.label === "queen") {
          ctx.fillStyle = "#C93C20";
        } else if (coin.label === "white") {
          ctx.fillStyle = "#FFFFFF";
        } else {
          ctx.fillStyle = "#000000";
        }
        ctx.fill();
        ctx.strokeStyle = "#704214";
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // Draw striker if player's turn (both during placement and after shooting)
      if (strikerRef.current) {
        const { x, y } = strikerRef.current.position;
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2);
        ctx.fillStyle = "#3A7BD5";
        ctx.fill();
        ctx.strokeStyle = "#704214";
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (isPlayerTurn && !avvaThinking) {
        // Draw striker preview at baseline
        ctx.beginPath();
        ctx.arc(strikerX, 550, 20, 0, Math.PI * 2);
        ctx.fillStyle = "#3A7BD5";
        ctx.fill();
        ctx.strokeStyle = "#704214";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    // Run engine
    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);

    // Check for pocketed coins
    const checkPockets = () => {
      coinsRef.current = coinsRef.current.filter(coin => {
        const { x, y } = coin.position;
        const pocketed = pockets.some(p => 
          Math.hypot(p.x - x, p.y - y) < pocketRadius
        );

        if (pocketed) {
          Matter.World.remove(engine.world, coin);
          
          if (coin.label === "queen" && !queenCovered) {
            setQueenPocketed(isPlayerTurn ? "player" : "avva");
            toast({
              title: "Queen pocketed!",
              description: "Pocket another coin to cover it.",
            });
          } else if (coin.label === "white") {
            if (isPlayerTurn) {
              setPlayerScore(prev => prev + 1);
              if (queenPocketed === "player" && !queenCovered) {
                setQueenCovered(true);
                setPlayerScore(prev => prev + 3);
              }
            }
          } else if (coin.label === "black") {
            if (!isPlayerTurn) {
              setAvvaScore(prev => prev + 1);
              if (queenPocketed === "avva" && !queenCovered) {
                setQueenCovered(true);
                setAvvaScore(prev => prev + 3);
              }
            }
          }
          return false;
        }
        return true;
      });
    };

    const interval = setInterval(checkPockets, 100);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      Matter.Engine.clear(engine);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (playerScore >= 5 && playerScore > avvaScore && !gameOver) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      setGameOver(true);
      setAvvaMessage(getRandomMessage("losing"));
      toast({
        title: "You Won!",
        description: "You pocketed 5 coins first!",
      });
    } else if (avvaScore >= 5 && avvaScore > playerScore && !gameOver) {
      setGameOver(true);
      setAvvaMessage(getRandomMessage("winning"));
      toast({
        title: "Avva Won!",
        description: "She pocketed 5 coins first!",
      });
    }
  }, [playerScore, avvaScore, gameOver]);

  const handleShoot = () => {
    if (!isPlayerTurn || !engineRef.current || gameOver) return;

    const engine = engineRef.current;
    const width = 600;
    const strikerY = 550;

    // Create striker
    const striker = Matter.Bodies.circle(strikerX, strikerY, 20, {
      restitution: 0.8,
      friction: 0.05,
      frictionAir: 0.02,
    });

    strikerRef.current = striker;
    Matter.World.add(engine.world, striker);

    // Apply force based on angle and power
    const forceMultiplier = power / 2000;
    const angleRad = (angle * Math.PI) / 180;
    const forceX = Math.sin(angleRad) * forceMultiplier;
    const forceY = -Math.cos(angleRad) * forceMultiplier;

    Matter.Body.applyForce(striker, striker.position, { x: forceX, y: forceY });

    setIsPlayerTurn(false);

    setTimeout(() => {
      if (strikerRef.current) {
        Matter.World.remove(engine.world, strikerRef.current);
        strikerRef.current = null;
      }
      
      if (coinsRef.current.length > 0) {
        setTimeout(makeAvvaShot, 1500);
      }
    }, 3000);
  };

  const makeAvvaShot = () => {
    setAvvaThinking(true);
    setAvvaMessage(getRandomMessage("thinking"));

    setTimeout(() => {
      if (!engineRef.current || coinsRef.current.length === 0) {
        setAvvaThinking(false);
        setIsPlayerTurn(true);
        return;
      }

      const engine = engineRef.current;
      const width = 600;
      const strikerY = 100;
      const strikerX = width / 2 + (Math.random() - 0.5) * 100;

      const striker = Matter.Bodies.circle(strikerX, strikerY, 20, {
        restitution: 0.8,
        friction: 0.05,
        frictionAir: 0.02,
      });

      Matter.World.add(engine.world, striker);

      // Aim at a black coin
      const blackCoins = coinsRef.current.filter(c => c.label === "black");
      const targetCoin = blackCoins.length > 0 
        ? blackCoins[Math.floor(Math.random() * blackCoins.length)]
        : coinsRef.current[Math.floor(Math.random() * coinsRef.current.length)];

      if (targetCoin) {
        const dx = targetCoin.position.x - strikerX;
        const dy = targetCoin.position.y - strikerY;
        const distance = Math.hypot(dx, dy);
        const forceMultiplier = 0.015;
        
        Matter.Body.applyForce(striker, striker.position, {
          x: (dx / distance) * forceMultiplier,
          y: (dy / distance) * forceMultiplier,
        });
      }

      setTimeout(() => {
        Matter.World.remove(engine.world, striker);
        setAvvaThinking(false);
        setAvvaMessage(getRandomMessage("goodMove"));
        setIsPlayerTurn(true);
      }, 3000);
    }, 2000);
  };

  const handleRestart = () => {
    setPlayerScore(0);
    setAvvaScore(0);
    setQueenPocketed(null);
    setQueenCovered(false);
    setIsPlayerTurn(true);
    setGameOver(false);
    setAvvaMessage(getRandomMessage("greeting"));
    setAngle(0);
    setPower(50);
    setStrikerX(300);
    window.location.reload();
  };

  

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
              <div className="text-sm text-muted-foreground mb-2">Your Score (White)</div>
              <div className="text-4xl font-bold text-primary">{playerScore}</div>
            </Card>

            <Card className="p-4 text-center">
              <div className="text-sm text-muted-foreground mb-2">Coins Left</div>
              <div className="text-4xl font-bold text-accent">{coinsRef.current.length}</div>
            </Card>

            <Card className="p-4 text-center">
              <div className="text-sm text-muted-foreground mb-2">Avva's Score (Black)</div>
              <div className="text-4xl font-bold text-accent">{avvaScore}</div>
            </Card>
          </div>

          <Card className="p-4">
            <canvas ref={canvasRef} className="mx-auto border-4 border-[#704214] rounded-lg" />
          </Card>

          {isPlayerTurn && !gameOver && (
            <Card className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Striker Position: {strikerX}px
                </label>
                <Slider
                  value={[strikerX]}
                  onValueChange={(value) => setStrikerX(value[0])}
                  min={100}
                  max={500}
                  step={5}
                  className="w-full"
                />
              </div>

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
                  min={30}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>

              <Button size="lg" onClick={handleShoot} className="w-full">
                Shoot!
              </Button>
            </Card>
          )}

          {gameOver && (
            <Card className="p-6 text-center bg-[#D4AF37]/20 border-2 border-[#D4AF37]">
              <h2 className="text-2xl font-bold mb-2">
                {playerScore > avvaScore ? "🎉 You Won!" : "Avva Won!"}
              </h2>
              <p className="text-muted-foreground mb-4">
                Final Score: You {playerScore} - {avvaScore} Avva
              </p>
              <Button onClick={handleRestart}>Play Again</Button>
            </Card>
          )}

          {!isPlayerTurn && !gameOver && (
            <Card className="p-4 text-center">
              <p className="text-muted-foreground">Avva is taking her shot...</p>
            </Card>
          )}

          {!gameOver && (
            <Card className="p-4 text-center">
              <p className="text-sm text-muted-foreground">
                First to pocket 5 coins wins! Pocket the red queen and cover it with another coin for bonus points.
              </p>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default CarromGame;
