import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import type { PermissionStatus, RuntimeStatus } from "../../types/app";

type SettingsScreenProps = {
  appVersion: string;
  osVersion: string;
  status: RuntimeStatus;
  deviceCount: number;
  permission: PermissionStatus | null;
  exitBehavior: "ask" | "exit" | "minimize";
  velocityGraph: {
    points: string;
    zeroY: number;
    hasData: boolean;
    min: number;
    max: number;
  };
  onRefreshDiagnostics: () => void;
  onResetDefaults: () => void;
  onExitBehaviorChange: (value: "ask" | "exit" | "minimize") => void;
};

export function SettingsScreen({
  appVersion,
  osVersion,
  status,
  deviceCount,
  permission,
  exitBehavior,
  velocityGraph,
  onRefreshDiagnostics,
  onResetDefaults,
  onExitBehaviorChange,
}: SettingsScreenProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Settings</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-1 text-sm text-slate-700">
          <p>App version: {appVersion}</p>
          <p>OS version: {osVersion}</p>
          <p>Service status: {status.daemon_running ? "running" : "stopped"}</p>
          <p>Detected input devices: {deviceCount}</p>
          <p>Last velocity: {status.last_velocity.toFixed(4)}</p>
          <p>Readable input: {permission?.can_read_any_input ? "yes" : "no"}</p>
          <p>Writable uinput: {permission?.can_write_uinput ? "yes" : "no"}</p>
        </div>

        <div className="grid gap-2 rounded-md border border-slate-200 p-3">
          <p className="text-sm font-medium text-slate-900">
            Exit button behavior
          </p>
          <Select
            value={exitBehavior}
            onValueChange={(value) =>
              onExitBehaviorChange(value as "ask" | "exit" | "minimize")
            }
          >
            <SelectTrigger id="exit-button-behavior">
              <SelectValue placeholder="Select behavior" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ask">Ask on exit</SelectItem>
              <SelectItem value="exit">Exit app</SelectItem>
              <SelectItem value="minimize">Minimize to taskbar</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-slate-600">
            When set to Ask on exit, the close button in the window corner
            always shows the confirmation prompt.
          </p>
        </div>

        <div className="grid gap-2 rounded-md border border-slate-200 p-3">
          <p className="text-sm font-medium text-slate-900">Diagnostic</p>
          <div className="h-36 rounded-md border border-slate-200 bg-slate-50 p-2">
            <svg
              className="h-full w-full"
              viewBox="0 0 680 140"
              preserveAspectRatio="none"
              role="img"
              aria-label="velocity graph"
            >
              <line
                x1="0"
                y1={velocityGraph.zeroY}
                x2="680"
                y2={velocityGraph.zeroY}
                className="stroke-slate-300"
                strokeWidth="1"
              />
              {velocityGraph.hasData && (
                <polyline
                  points={velocityGraph.points}
                  fill="none"
                  className="stroke-blue-600"
                  strokeWidth="2"
                />
              )}
            </svg>
            {!velocityGraph.hasData && (
              <p className="text-xs text-slate-500">(no data yet)</p>
            )}
          </div>
          <p className="text-xs text-slate-600">
            min {velocityGraph.min.toFixed(3)} • max{" "}
            {velocityGraph.max.toFixed(3)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={onRefreshDiagnostics}>
            Refresh diagnostic info
          </Button>
          <Button variant="destructive" onClick={onResetDefaults}>
            Reset to default settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
