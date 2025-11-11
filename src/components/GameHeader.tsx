import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import AvvaAvatar from "./AvvaAvatar";

interface GameHeaderProps {
  gameName: string;
  onRestart?: () => void;
  onHowToPlay?: () => void;
  avvaMessage?: string;
  avvaThinking?: boolean;
}

const GameHeader = ({ 
  gameName, 
  onRestart, 
  onHowToPlay, 
  avvaMessage,
  avvaThinking = false 
}: GameHeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className="border-b-2 border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
          
          <h1 className="text-2xl font-serif font-bold text-primary">
            {gameName} vs Avva
          </h1>
          
          <div className="flex gap-2">
            {onHowToPlay && (
              <Button variant="outline" size="sm" onClick={onHowToPlay}>
                How to Play
              </Button>
            )}
            {onRestart && (
              <Button variant="default" size="sm" onClick={onRestart}>
                Restart
              </Button>
            )}
          </div>
        </div>
        
        <div className="flex justify-center">
          <AvvaAvatar 
            size="md" 
            message={avvaMessage}
            thinking={avvaThinking}
          />
        </div>
      </div>
    </header>
  );
};

export default GameHeader;
