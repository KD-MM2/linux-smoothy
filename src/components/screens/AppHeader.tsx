import { Menu, Minus } from "lucide-react";

import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import type { ViewScreen } from "../../types/app";

type AppHeaderProps = {
  daemonRunning: boolean;
  onToggleService: () => void;
  onMinimizeToTaskbar: () => void;
  onNavigate: (screen: ViewScreen) => void;
};

export function AppHeader({
  daemonRunning,
  onToggleService,
  onMinimizeToTaskbar,
  onNavigate,
}: AppHeaderProps) {
  return (
    <header className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <button
        type="button"
        onClick={() => onNavigate("home")}
        className="text-lg font-semibold text-slate-900"
      >
        Smoothy
      </button>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          aria-label="Minimize window"
          onClick={onMinimizeToTaskbar}
        >
          <Minus className="h-5 w-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Application menu">
              <Menu className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onNavigate("home")}>
              Home
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onToggleService}>
              {daemonRunning ? "Stop service" : "Start service"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onMinimizeToTaskbar}>
              Hide to taskbar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onNavigate("settings")}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onNavigate("profiles")}>
              Profiles
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onNavigate("about")}>
              About
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
