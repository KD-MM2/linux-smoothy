import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Switch } from "../ui/switch";
import { FIELD_CONFIG } from "../../types/app";
import type { PhysicsConfig, Profile } from "../../types/app";

type HomeScreenProps = {
  profiles: Profile[];
  selectedProfileId: string;
  onSelectProfile: (profileId: string) => void;
  onLoadProfile: () => void;
  onSaveProfile: () => void;
  onEditProfile: () => void;
  canEditProfile: boolean;
  config: PhysicsConfig;
  onUpdateNumberField: (
    key: (typeof FIELD_CONFIG)[number]["key"],
    value: string,
  ) => void;
  onChangeEasing: (easing: "easeOutCubic" | "linear") => void;
  onToggleOption: (
    key: keyof Pick<
      PhysicsConfig,
      | "reverse_direction"
      | "enable_acceleration"
      | "enable_smoothing"
      | "enable_horizontal"
    >,
    checked: boolean,
  ) => void;
};

export function HomeScreen({
  profiles,
  selectedProfileId,
  onSelectProfile,
  onLoadProfile,
  onSaveProfile,
  onEditProfile,
  canEditProfile,
  config,
  onUpdateNumberField,
  onChangeEasing,
  onToggleOption,
}: HomeScreenProps) {
  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Profiles</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="grid gap-2 md:max-w-md">
            <Label htmlFor="profile-select">Profile selector</Label>
            <Select value={selectedProfileId} onValueChange={onSelectProfile}>
              <SelectTrigger id="profile-select">
                <SelectValue placeholder="Select profile" />
              </SelectTrigger>
              <SelectContent>
                {profiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={onLoadProfile}>
              Load profile
            </Button>
            <Button variant="secondary" onClick={onSaveProfile}>
              Save profile
            </Button>
            <Button
              variant="outline"
              onClick={onEditProfile}
              disabled={!canEditProfile}
            >
              Edit profile
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Smooth tuning</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="grid gap-3 md:grid-cols-2">
            {FIELD_CONFIG.map((field) => (
              <div key={field.key} className="grid gap-2">
                <Label htmlFor={field.key}>{field.label}</Label>
                <Input
                  id={field.key}
                  type="number"
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  value={config[field.key]}
                  onChange={(event) =>
                    onUpdateNumberField(field.key, event.currentTarget.value)
                  }
                />
              </div>
            ))}
          </div>

          <div className="grid gap-2 md:max-w-sm">
            <Label htmlFor="easing-mode">Easing mode</Label>
            <Select
              value={config.easing}
              onValueChange={(value) =>
                onChangeEasing(value as "easeOutCubic" | "linear")
              }
            >
              <SelectTrigger id="easing-mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easeOutCubic">easeOutCubic</SelectItem>
                <SelectItem value="linear">linear</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Options</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
            <Label className="capitalize">reverse scroll direction</Label>
            <Switch
              checked={config.reverse_direction}
              onCheckedChange={(checked) =>
                onToggleOption("reverse_direction", checked)
              }
            />
          </div>
          <div className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
            <Label className="capitalize">
              enable mouse wheel acceleration
            </Label>
            <Switch
              checked={config.enable_acceleration}
              onCheckedChange={(checked) =>
                onToggleOption("enable_acceleration", checked)
              }
            />
          </div>
          <div className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
            <Label className="capitalize">enable mouse wheel smoothing</Label>
            <Switch
              checked={config.enable_smoothing}
              onCheckedChange={(checked) =>
                onToggleOption("enable_smoothing", checked)
              }
            />
          </div>
          <div className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
            <Label className="capitalize">enable horizontal scrolling</Label>
            <Switch
              checked={config.enable_horizontal}
              onCheckedChange={(checked) =>
                onToggleOption("enable_horizontal", checked)
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
