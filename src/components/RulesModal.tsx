import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";

interface RulesModalProps {
  gameName: string;
  rules: string[];
}

export const RulesModal = ({ gameName, rules }: RulesModalProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <HelpCircle className="w-4 h-4" />
          Rules
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif">How to Play {gameName}</DialogTitle>
          <DialogDescription>Official rules and gameplay instructions</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          {rules.map((rule, index) => (
            <div key={index} className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                {index + 1}
              </div>
              <p className="text-sm leading-relaxed">{rule}</p>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
