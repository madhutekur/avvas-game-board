import { useState } from "react";
import GameHeader from "@/components/GameHeader";
import { GameOverModal } from "@/components/GameOverModal";
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

const createStarBoard = (): Peg[][] => {
  const board: Peg[][] = [];
  
  const rowConfigs = [
    { start: 6, end: 6, player: "avva" as const },
    { start: 5, end: 7, player: "avva" as const },
    { start: 4, end: 8, player: "avva" as const },
    { start: 3, end: 9, player: "avva" as const },
    { start: 0, end: 12, player: null },
    { start: 1, end: 11, player: null },
    { start: 2, end: 10, player: null },
    { start: 1, end: 11, player: null },
    { start: 0, end: 12, player: null },
    { start: 3, end: 9, player: "player" as const },
    { start: 4, end: 8, player: "player" as const },
    { start: 5, end: 7, player: "player" as const },
    { start: 6, end: 6, player: "player" as const },
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

const RULES = [
  "Move your blue pegs from the bottom triangle to the top red triangle.",
  "You can move to an adjacent empty spot in any of 6 directions.",
  "Or hop over adjacent pegs into empty holes (multiple hops allowed per turn!).",
  "Select a peg, then select where to move it.",
  "First player to get all 10 pegs in the opposite triangle wins!",
];

const ChineseCheckersGame = () => {
  const [board, setBoard] = useState<Peg[][]>(createStarBoard());
  const [selectedPeg, setSelectedPeg] = useState<[number, number] | null>(null);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [isTurnLocked, setIsTurnLocked] = useState(false);
  const [avvaMessage, setAvvaMessage] = useState(getRandomMessage("greeting"));
  const [avvaThinking, setAvvaThinking] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<"player" | "avva" | null>(null);
  const { toast } = useToast();

  const isValidMove = (fromRow: number, fromCol: number, toRow: number, toCol: number, currentBoard: Peg[][]): boolean => {
    const toPeg = currentBoard[toRow]?.[toCol];
    if (!toPeg || toPeg.player !== null) return false;

    const rowDiff = toRow - fromRow;
    const colDiff = toCol - fromCol;
    const absRowDiff = Math.abs(rowDiff);
    const absColDiff = Math.abs(colDiff);

    // Adjacent move in 6 directions (horizontal, vertical, and both diagonals)
    if ((absRowDiff === 0 && absColDiff === 1) || 
        (absRowDiff === 1 && absColDiff === 0) ||
        (absRowDiff === 1 && absColDiff === 1)) {
      return true;
    }

    // Jump move: must be exactly 2 spaces away in one of 6 directions
    if ((absRowDiff === 0 && absColDiff === 2) ||
        (absRowDiff === 2 && absColDiff === 0) ||
        (absRowDiff === 2 && absColDiff === 2)) {
      const midRow = fromRow + rowDiff / 2;
      const midCol = fromCol + colDiff / 2;
      const midPeg = currentBoard[midRow]?.[midCol];
      // Must have a peg in the middle to jump over
      return midPeg?.player !== null;
    }

    return false;
  };

  const commitMove = (fromRow: number, fromCol: number, toRow: number, toCol: number, player: "player" | "avva") => {
    setIsTurnLocked(true);
    
    const newBoard = board.map(row => row.map(cell => cell ? { ...cell } : cell));
    const movingPlayer = newBoard[fromRow][fromCol].player;
    
    newBoard[toRow][toCol] = { ...newBoard[toRow][toCol], player: movingPlayer };
    newBoard[fromRow][fromCol] = { ...newBoard[fromRow][fromCol], player: null };
    
    setBoard(newBoard);
    setSelectedPeg(null);

    setTimeout(() => {
      if (player === "player") {
        const playerPegsInGoal = newBoard.slice(0, 4).reduce((count, row) => 
          count + row.filter(cell => cell && cell.player === "player").length, 0
        );
        
        if (playerPegsInGoal === 10) {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
          setGameOver(true);
          setWinner("player");
          setAvvaMessage(getRandomMessage("losing"));
          setIsTurnLocked(false);
          return;
        }
        
        setIsPlayerTurn(false);
        setTimeout(() => makeAvvaMove(newBoard), 1000);
      }

      if (player === "avva") {
        const avvaPegsInGoal = newBoard.slice(9, 13).reduce((count, row) => 
          count + row.filter(cell => cell && cell.player === "avva").length, 0
        );
        
        if (avvaPegsInGoal === 10) {
          setGameOver(true);
          setWinner("avva");
          setAvvaMessage(getRandomMessage("winning"));
          setIsTurnLocked(false);
          return;
        }
        
        setAvvaThinking(false);
        setIsPlayerTurn(true);
        setIsTurnLocked(false);
        setAvvaMessage(getRandomMessage("goodMove"));
      }
    }, 100);
  };

  const makeAvvaMove = (currentBoard: Peg[][]) => {
    setAvvaThinking(true);
    setAvvaMessage(getRandomMessage("thinking"));

    setTimeout(() => {
      const avvaPegs: [number, number][] = [];
      currentBoard.forEach((row, r) => {
        row.forEach((cell, c) => {
          if (cell && cell.player === "avva") {
            avvaPegs.push([r, c]);
          }
        });
      });

      // All 6 directions plus their jump equivalents (12 total directions)
      const directions: [number, number][] = [
        [1, 0], [2, 0],     // down
        [0, 1], [0, 2],     // right
        [1, 1], [2, 2],     // down-right
        [-1, 0], [-2, 0],   // up
        [0, -1], [0, -2],   // left
        [-1, -1], [-2, -2], // up-left
        [1, -1], [2, -2],   // down-left
        [-1, 1], [-2, 2],   // up-right
      ];

      // Prioritize moves that go downward (toward player's goal)
      const movesWithScore: Array<{ row: number; col: number; newRow: number; newCol: number; score: number }> = [];

      for (const [row, col] of avvaPegs) {
        for (const [dRow, dCol] of directions) {
          const newRow = row + dRow;
          const newCol = col + dCol;
          
          if (newRow >= 0 && newRow < 13 && newCol >= 0 && newCol < 13) {
            if (isValidMove(row, col, newRow, newCol, currentBoard)) {
              // Score based on progress toward goal (bottom rows)
              const score = newRow - row + (Math.abs(dRow) === 2 ? 2 : 0); // Prefer jumps and downward moves
              movesWithScore.push({ row, col, newRow, newCol, score });
            }
          }
        }
      }

      if (movesWithScore.length > 0) {
        // Sort by score (higher is better)
        movesWithScore.sort((a, b) => b.score - a.score);
        const bestMove = movesWithScore[0];
        commitMove(bestMove.row, bestMove.col, bestMove.newRow, bestMove.newCol, "avva");
        return;
      }

      setAvvaThinking(false);
      setIsPlayerTurn(true);
      setIsTurnLocked(false);
      setAvvaMessage("Your turn, kanna!");
    }, 2000);
  };

  const handleCellClick = (row: number, col: number) => {
    if (!isPlayerTurn || gameOver || isTurnLocked) return;

    const cell = board[row][col];
    if (!cell) return;

    if (selectedPeg) {
      const [fromRow, fromCol] = selectedPeg;
      
      if (isValidMove(fromRow, fromCol, row, col, board)) {
        commitMove(fromRow, fromCol, row, col, "player");
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
    setIsTurnLocked(false);
    setGameOver(false);
    setWinner(null);
    setAvvaMessage(getRandomMessage("greeting"));
  };

  return (
    <div className="min-h-screen bg-background kolam-pattern">
      <GameHeader
        gameName="Chinese Checkers"
        onRestart={handleRestart}
        avvaMessage={avvaMessage}
        avvaThinking={avvaThinking}
        rules={RULES}
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
                          ${isSelected ? "animate-pulse ring-4 ring-[#D4AF37]" : ""}
                          ${isEmpty ? "hover:bg-[#704214]/30" : "hover:scale-110"}
                          ${gameOver || !isPlayerTurn || isTurnLocked ? "opacity-50 cursor-not-allowed" : ""}
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

          {!gameOver && (
            <Card className="p-4 text-center">
              <p className="text-sm text-muted-foreground">
                Move your blue pegs to the opposite red corner. Jump over other pegs to move faster!
              </p>
            </Card>
          )}
        </div>
      </main>

      <GameOverModal
        open={gameOver}
        winner={winner || "draw"}
        message={winner === "player" 
          ? "All your pegs reached the opposite corner!" 
          : "All of Avva's pegs reached the opposite corner!"}
        onRestart={handleRestart}
      />
    </div>
  );
};

export default ChineseCheckersGame;
