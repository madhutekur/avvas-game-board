import { useState } from "react";
import GameHeader from "@/components/GameHeader";
import { getRandomMessage } from "@/lib/avvaAI";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import confetti from "canvas-confetti";

type Marble = {
  row: number;
  col: number;
  player: "player" | "avva" | null;
};

// Simplified 7x7 board (instead of full star shape for simplicity)
const createInitialBoard = (): Marble[][] => {
  const board: Marble[][] = [];
  for (let row = 0; row < 7; row++) {
    board[row] = [];
    for (let col = 0; col < 7; col++) {
      let player: "player" | "avva" | null = null;
      
      // Player marbles at top
      if (row <= 1 && col >= 2 && col <= 4) {
        player = "player";
      }
      // Avva marbles at bottom
      if (row >= 5 && col >= 2 && col <= 4) {
        player = "avva";
      }
      
      board[row][col] = { row, col, player };
    }
  }
  return board;
};

const ChineseCheckersGame = () => {
  const [board, setBoard] = useState<Marble[][]>(createInitialBoard());
  const [selectedMarble, setSelectedMarble] = useState<[number, number] | null>(null);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [avvaMessage, setAvvaMessage] = useState(getRandomMessage("greeting"));
  const [avvaThinking, setAvvaThinking] = useState(false);
  const { toast } = useToast();

  const isValidMove = (fromRow: number, fromCol: number, toRow: number, toCol: number): boolean => {
    if (board[toRow][toCol].player !== null) return false;

    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);

    // Adjacent move
    if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
      return true;
    }

    // Jump move
    if (rowDiff === 2 && colDiff === 0) {
      const midRow = (fromRow + toRow) / 2;
      return board[midRow][fromCol].player !== null;
    }
    if (rowDiff === 0 && colDiff === 2) {
      const midCol = (fromCol + toCol) / 2;
      return board[fromRow][midCol].player !== null;
    }

    return false;
  };

  const makeMove = (fromRow: number, fromCol: number, toRow: number, toCol: number) => {
    const newBoard = board.map(row => row.map(cell => ({ ...cell })));
    newBoard[toRow][toCol].player = newBoard[fromRow][fromCol].player;
    newBoard[fromRow][fromCol].player = null;
    setBoard(newBoard);
    setSelectedMarble(null);

    // Check for win (all marbles in opposite zone)
    const playerWon = newBoard[5].concat(newBoard[6]).every(
      cell => (cell.col >= 2 && cell.col <= 4 ? cell.player === "player" : true)
    );
    
    if (playerWon) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      setAvvaMessage(getRandomMessage("losing"));
      toast({
        title: "You Won!",
        description: "All your marbles reached the opposite corner!",
      });
      return;
    }

    setIsPlayerTurn(false);
    setTimeout(makeAvvaMove, 1500);
  };

  const makeAvvaMove = () => {
    setAvvaThinking(true);
    setAvvaMessage(getRandomMessage("thinking"));

    setTimeout(() => {
      // Find Avva's marbles
      const avvaMarbles: [number, number][] = [];
      board.forEach((row, r) => {
        row.forEach((cell, c) => {
          if (cell.player === "avva") {
            avvaMarbles.push([r, c]);
          }
        });
      });

      // Try to move a marble forward (towards player's side)
      for (const [row, col] of avvaMarbles) {
        const moves: [number, number][] = [
          [row - 1, col],
          [row - 2, col],
          [row, col - 1],
          [row, col + 1],
        ];

        for (const [newRow, newCol] of moves) {
          if (newRow >= 0 && newRow < 7 && newCol >= 0 && newCol < 7) {
            if (isValidMove(row, col, newRow, newCol)) {
              makeMove(row, col, newRow, newCol);
              setAvvaThinking(false);
              setAvvaMessage(getRandomMessage("goodMove"));
              setIsPlayerTurn(true);
              return;
            }
          }
        }
      }

      setAvvaThinking(false);
      setIsPlayerTurn(true);
    }, 2000);
  };

  const handleCellClick = (row: number, col: number) => {
    if (!isPlayerTurn) return;

    if (selectedMarble) {
      const [fromRow, fromCol] = selectedMarble;
      if (isValidMove(fromRow, fromCol, row, col)) {
        makeMove(fromRow, fromCol, row, col);
      } else {
        if (board[row][col].player === "player") {
          setSelectedMarble([row, col]);
        } else {
          setSelectedMarble(null);
        }
      }
    } else {
      if (board[row][col].player === "player") {
        setSelectedMarble([row, col]);
      }
    }
  };

  const handleRestart = () => {
    setBoard(createInitialBoard());
    setSelectedMarble(null);
    setIsPlayerTurn(true);
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
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="p-4 text-center">
            <p className="font-medium">
              {isPlayerTurn ? "Your Turn (Red)" : "Avva's Turn (Blue)"}
            </p>
          </Card>

          <Card className="p-8">
            <div className="inline-block mx-auto">
              {board.map((row, rowIndex) => (
                <div key={rowIndex} className="flex justify-center">
                  {row.map((cell, colIndex) => {
                    const isSelected =
                      selectedMarble &&
                      selectedMarble[0] === rowIndex &&
                      selectedMarble[1] === colIndex;

                    return (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        onClick={() => handleCellClick(rowIndex, colIndex)}
                        className={`
                          w-12 h-12 m-1 rounded-lg flex items-center justify-center
                          cursor-pointer border-2
                          ${cell.player === null ? "bg-muted border-border" : ""}
                          ${cell.player === "player" ? "bg-primary border-primary" : ""}
                          ${cell.player === "avva" ? "bg-accent border-accent" : ""}
                          ${isSelected ? "animate-pulse-glow ring-4 ring-primary" : ""}
                          hover:border-foreground/40
                        `}
                      >
                        {cell.player && (
                          <div className={`w-8 h-8 rounded-full ${
                            cell.player === "player" ? "bg-primary-foreground" : "bg-accent-foreground"
                          }`}></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Move your marbles to the opposite corner. Jump over other marbles to move faster!
            </p>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ChineseCheckersGame;
