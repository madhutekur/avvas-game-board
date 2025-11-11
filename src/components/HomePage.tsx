import { useState } from "react";
import { Gamepad2, Volume2, VolumeX } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AvvaAvatar from "./AvvaAvatar";
import GameCard from "./GameCard";
import { Button } from "@/components/ui/button";

// Game icons - we'll use Lucide icons that match each game
import { 
  Circle, // Carrom
  Crown, // Chess  
  Dices, // Ludo
  Star, // Chinese Checkers
  CircleDot // Brainvita
} from "lucide-react";

const games = [
  {
    id: "carrom",
    title: "Carrom",
    icon: Circle,
    description: "Strike and pocket the coins",
    route: "/carrom"
  },
  {
    id: "chess",
    title: "Chess",
    icon: Crown,
    description: "Checkmate Avva's king",
    route: "/chess"
  },
  {
    id: "ludo",
    title: "Ludo",
    icon: Dices,
    description: "Race your tokens home",
    route: "/ludo"
  },
  {
    id: "chinese-checkers",
    title: "Chinese Checkers",
    icon: Star,
    description: "Jump to the opposite corner",
    route: "/chinese-checkers"
  },
  {
    id: "brainvita",
    title: "Brainvita",
    icon: CircleDot,
    description: "Solve the peg puzzle",
    route: "/brainvita"
  }
];

const HomePage = () => {
  const [musicEnabled, setMusicEnabled] = useState(true);
  const navigate = useNavigate();

  const handleGameClick = (route: string) => {
    navigate(route);
  };

  return (
    <div className="min-h-screen bg-background kolam-pattern">
      {/* Header */}
      <header className="border-b-2 border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Gamepad2 className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-serif font-bold text-primary">Avva's Game Board</h1>
              <p className="text-xs text-muted-foreground">Centenary Edition</p>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMusicEnabled(!musicEnabled)}
            className="border-2 hover:border-accent"
          >
            {musicEnabled ? (
              <Volume2 className="w-5 h-5" />
            ) : (
              <VolumeX className="w-5 h-5" />
            )}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 md:py-12">
        {/* Hero Section */}
        <div className="text-center space-y-6 mb-12">
          <div className="flex justify-center">
            <AvvaAvatar 
              size="lg" 
              message="Come, let's play! Choose your game — I'll be waiting!"
            />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
              Play Traditional Games
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Celebrating her joy for play, togetherness, and family
            </p>
          </div>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-12">
          {games.map((game) => (
            <GameCard
              key={game.id}
              title={game.title}
              icon={game.icon}
              description={game.description}
              onClick={() => handleGameClick(game.route)}
            />
          ))}
        </div>

        {/* Info Card */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-card border-2 border-accent rounded-2xl p-6 shadow-lg text-center">
            <p className="text-sm text-muted-foreground">
              Each game brings back memories of sitting on the floor, rolling dice, 
              moving pieces, and sharing laughter. Play against Avva's gentle AI and 
              keep her spirit of play alive.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-border bg-card/80 backdrop-blur-sm mt-12">
        <div className="container mx-auto px-4 py-6 text-center">
          <p className="text-sm text-muted-foreground">
            Created with love by her family on her 100th year ❤️
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
