import { useState } from "react";
import GameHeader from "@/components/GameHeader";
import { getRandomMessage } from "@/lib/avvaAI";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";

type Peg = {
  row: number;
  col: number;
  player: "player" | "avva" | null;
};

// Star-shaped board layout (proper 6-pointed star with 121 positions)
const createStarBoard = (): Peg[][] => {
  const board: Peg[][] = [];
  
  // Row configurations for a proper star pattern (13x17 grid)
  const rowConfigs = [
    { start: 6, end: 6, player: "avva" as const }, // 0 - top point
    { start: 5, end: 7, player: "avva" as const }, // 1
    { start: 4, end: 8, player: "avva" as const }, // 2
    { start: 3, end: 9, player: "avva" as const }, // 3
    { start: 0, end: 12, player: null }, // 4 - wide section
    { start: 1, end: 11, player: null }, // 5
    { start: 2, end: 10, player: null }, // 6 - center
    { start: 1, end: 11, player: null }, // 7
    { start: 0, end: 12, player: null }, // 8 - wide section
    { start: 3, end: 9, player: "player" as const }, // 9
    { start: 4, end: 8, player: "player" as const }, // 10
    { start: 5, end: 7, player: "player" as const }, // 11
    { start: 6, end: 6, player: "player" as const }, // 12 - bottom point
  ];

  for (let row = 0; row < 13; row++) {
    board[row] = [];
    const config = rowConfigs[row];
    for (let col = 0; col < 13; col++) {
      if (col >= config.start && col <= config.end) {
        board[row][col] = { row, col, player: config.player };
      }
    }
  }
  
  return board;
};

const ChineseCheckersGame = () => {
  const [board, setBoard] = useState<Peg[][]>(createStarBoard());
  const [selectedPeg, setSelectedPeg] = useState<[number, number] | null>(null);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [avvaMessage, setAvvaMessage] = useState(getRandomMessage("greeting"));
  const [avvaThinking, setAvvaThinking] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const { toast } = useToast();

  const isValidMove = (fromRow: number, fromCol: number, toRow: number, toCol: number): boolean => {
    const toPeg = board[toRow]?.[toCol];
    if (!toPeg || toPeg.player !== null) return false;

    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);

    // Adjacent move (1 step in any of 6 directions)
    if ((rowDiff === 0 && colDiff === 1) || 
        (rowDiff === 1 && colDiff === 0) ||
        (rowDiff === 1 && colDiff === 1)) {
      return true;
    }

    // Jump move (must hop over exactly one peg)
    if ((rowDiff === 0 && colDiff === 2) ||
        (rowDiff === 2 && colDiff === 0) ||
        (rowDiff === 2 && colDiff === 2)) {
      const midRow = (fromRow + toRow) / 2;
      const midCol = (fromCol + toCol) / 2;
      const midPeg = board[midRow]?.[midCol];
      return midPeg?.player !== null;
    }

    return false;
  };

  const makeMove = (fromRow: number, fromCol: number, toRow: number, toCol: number, player: "player" | "avva") => {
    const newBoard = board.map(row => row.map(cell => cell ? { ...cell } : cell));
    const movingPlayer = newBoard[fromRow][fromCol].player;
    newBoard[toRow][toCol].player = movingPlayer;
    newBoard[fromRow][fromCol].player = null;
    setBoard(newBoard);
    setSelectedPeg(null);

    // Check for win - player needs all pegs in top triangle (rows 0-3)
    if (player === "player") {
      const playerPegsInGoal = newBoard.slice(0, 4).reduce((count, row) => 
        count + row.filter(cell => cell && cell.player === "player").length, 0
      );
      
      if (playerPegsInGoal === 10) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        setGameOver(true);
        setAvvaMessage(getRandomMessage("losing"));
        toast({
          title: "You Won!",
          description: "All your pegs reached the opposite corner!",
        });
        return;
      }
      
      setIsPlayerTurn(false);
      setTimeout(makeAvvaMove, 1500);
    }

    // Check for Avva win - Avva needs all pegs in bottom triangle (rows 9-12)
    if (player === "avva") {
      const avvaPegsInGoal = newBoard.slice(9, 13).reduce((count, row) => 
        count + row.filter(cell => cell && cell.player === "avva").length, 0
      );
      
      if (avvaPegsInGoal === 10) {
        setGameOver(true);
        setAvvaMessage(getRandomMessage("winning"));
        toast({
          title: "Avva Won!",
          description: "All her pegs reached the opposite corner!",
        });
        return;
      }
      
      setAvvaThinking(false);
      setIsPlayerTurn(true);
      setAvvaMessage(getRandomMessage("goodMove"));
    }
  };

  const makeAvvaMove = () => {
    setAvvaThinking(true);
    setAvvaMessage(getRandomMessage("thinking"));

    setTimeout(() => {
      // Find Avva's pegs
      const avvaPegs: [number, number][] = [];
      board.forEach((row, r) => {
        row.forEach((cell, c) => {
          if (cell.player === "avva") {
            avvaPegs.push([r, c]);
          }
        });
      });

      // Try to move a peg toward bottom (player's starting area)
      const directions: [number, number][] = [
        [1, 0], [2, 0], [1, 1], [2, 2],
        [0, 1], [0, 2], [1, -1], [0, -1],
        [-1, 0], [-2, 0], [-1, -1], [-2, -2],
        [0, -1], [0, -2], [-1, 1], [2, -2],
      ];

      for (const [row, col] of avvaPegs) {
        // Prioritize moves that go downward (towards higher row numbers)
        const sortedDirs = [...directions].sort((a, b) => b[0] - a[0]);
        
        for (const [dRow, dCol] of sortedDirs) {
          const newRow = row + dRow;
          const newCol = col + dCol;
          
          if (newRow >= 0 && newRow < 13 && newCol >= 0 && newCol < 13) {
            if (isValidMove(row, col, newRow, newCol)) {
              makeMove(row, col, newRow, newCol, "avva");
              return;
            }
          }
        }
      }

      setAvvaThinking(false);
      setIsPlayerTurn(true);
      setAvvaMessage("Your turn, kanna!");
    }, 2000);
  };

  const handleCellClick = (row: number, col: number) => {
    if (!isPlayerTurn || gameOver) return;

    const cell = board[row][col];
    if (!cell) return;

    if (selectedPeg) {
      const [fromRow, fromCol] = selectedPeg;
      if (isValidMove(fromRow, fromCol, row, col)) {
        makeMove(fromRow, fromCol, row, col, "player");
      } else {
        if (cell.player === "player") {
          setSelectedPeg([row, col]);
        } else {
          setSelectedPeg(null);
        }
      }
    } else {
      if (cell.player === "player") {
        setSelectedPeg([row, col]);
      }
    }
  };

  const handleRestart = () => {
    setBoard(createStarBoard());
    setSelectedPeg(null);
    setIsPlayerTurn(true);
    setGameOver(false);
    setAvvaMessage(getRandomMessage("greeting"));
  };

  return (
    <div className="min-h-screen bg-background kolam-pattern">
      <GameHeader
        gameName="Chinese Checkers"
        onRestart={handleRestart}
        avvaMessage={avvaMessage}
        avvaThinking={avvaThinking}
      />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <Card className="p-4 text-center">
            <p className="font-medium">
              {isPlayerTurn ? "Your Turn (Blue)" : "Avva's Turn (Red)"}
            </p>
          </Card>

          <Card className="p-8 bg-[#F8E9D0]">
            <div className="inline-block mx-auto">
              {board.map((row, rowIndex) => (
                <div key={rowIndex} className="flex justify-center" style={{ minHeight: '42px' }}>
                  {row.map((cell, colIndex) => {
                    if (!cell) return <div key={`empty-${rowIndex}-${colIndex}`} className="w-10 h-10" />;
                    
                    const isSelected =
                      selectedPeg &&
                      selectedPeg[0] === rowIndex &&
                      selectedPeg[1] === colIndex;

                    const isEmpty = cell.player === null;

                    return (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        onClick={() => handleCellClick(rowIndex, colIndex)}
                        className={`
                          w-10 h-10 m-0.5 rounded-full flex items-center justify-center
                          cursor-pointer transition-all
                          ${isEmpty ? "bg-[#704214]/20 border border-[#704214]/40" : ""}
                          ${cell.player === "player" ? "bg-[#3A7BD5] border-2 border-[#3A7BD5]" : ""}
                          ${cell.player === "avva" ? "bg-[#C93C20] border-2 border-[#C93C20]" : ""}
                          ${isSelected ? "animate-pulse-glow ring-4 ring-[#D4AF37]" : ""}
                          ${isEmpty ? "hover:bg-[#704214]/30" : "hover:scale-110"}
                          ${gameOver ? "opacity-50 cursor-not-allowed" : ""}
                        `}
                      >
                        {cell.player && (
                          <div className={`w-7 h-7 rounded-full ${
                            cell.player === "player" ? "bg-white/90" : "bg-white/90"
                          }`}></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </Card>

          {gameOver && (
            <Card className="p-6 text-center bg-[#D4AF37]/20 border-2 border-[#D4AF37]">
              <h2 className="text-2xl font-bold mb-2">
                {board.slice(0, 4).reduce((count, row) => 
                  count + row.filter(cell => cell && cell.player === "player").length, 0
                ) === 10 ? "🎉 You Won!" : "Avva Won!"}
              </h2>
              <p className="text-muted-foreground">
                All pegs reached the opposite corner!
              </p>
              <Button onClick={handleRestart} className="mt-4">Play Again</Button>
            </Card>
          )}

          {!gameOver && (
            <Card className="p-4 text-center">
              <p className="text-sm text-muted-foreground">
                Move your blue pegs to the opposite red corner. Jump over other pegs to move faster!
              </p>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default ChineseCheckersGame;
