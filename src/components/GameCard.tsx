import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface GameCardProps {
  title: string;
  icon: LucideIcon;
  description: string;
  onClick: () => void;
}

const GameCard = ({ title, icon: Icon, description, onClick }: GameCardProps) => {
  return (
    <Card 
      onClick={onClick}
      className="group cursor-pointer bg-card hover:bg-accent/10 border-2 border-border hover:border-accent transition-all duration-300 hover:scale-105 hover:shadow-xl overflow-hidden"
    >
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300 mx-auto">
          <Icon className="w-8 h-8 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
        </div>
        
        <div className="text-center space-y-2">
          <h3 className="text-xl font-serif font-semibold text-foreground group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        </div>
        
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-center text-muted-foreground font-medium">
            Play with Avva
          </p>
        </div>
      </div>
    </Card>
  );
};

export default GameCard;
