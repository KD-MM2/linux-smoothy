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
import type { PhysicsConfig } from "../../types/app";

type ProfileEditorScreenProps = {
  editorName: string;
  editorConfig: PhysicsConfig;
  onEditorNameChange: (value: string) => void;
  onEditorFieldChange: (
    key: (typeof FIELD_CONFIG)[number]["key"],
    value: string,
  ) => void;
  onEditorEasingChange: (easing: "easeOutCubic" | "linear") => void;
  onEditorToggle: (
    key: keyof Pick<
      PhysicsConfig,
      | "reverse_direction"
      | "enable_acceleration"
      | "enable_smoothing"
      | "enable_horizontal"
    >,
    checked: boolean,
  ) => void;
  onSave: () => void;
  onCancel: () => void;
};

export function ProfileEditorScreen({
  editorName,
  editorConfig,
  onEditorNameChange,
  onEditorFieldChange,
  onEditorEasingChange,
  onEditorToggle,
  onSave,
  onCancel,
}: ProfileEditorScreenProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Editor</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2 md:max-w-sm">
          <Label htmlFor="editor-name">Profile name</Label>
          <Input
            id="editor-name"
            value={editorName}
            onChange={(event) => onEditorNameChange(event.currentTarget.value)}
          />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {FIELD_CONFIG.map((field) => (
            <div key={field.key} className="grid gap-2">
              <Label htmlFor={`editor-${field.key}`}>{field.label}</Label>
              <Input
                id={`editor-${field.key}`}
                type="number"
                min={field.min}
                max={field.max}
                step={field.step}
                value={editorConfig[field.key]}
                onChange={(event) =>
                  onEditorFieldChange(field.key, event.currentTarget.value)
                }
              />
            </div>
          ))}
        </div>

        <div className="grid gap-2 md:max-w-sm">
          <Label htmlFor="editor-easing">Easing mode</Label>
          <Select
            value={editorConfig.easing}
            onValueChange={(value) =>
              onEditorEasingChange(value as "easeOutCubic" | "linear")
            }
          >
            <SelectTrigger id="editor-easing">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easeOutCubic">easeOutCubic</SelectItem>
              <SelectItem value="linear">linear</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-3">
          <div className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
            <Label className="capitalize">reverse scroll direction</Label>
            <Switch
              checked={editorConfig.reverse_direction}
              onCheckedChange={(checked) =>
                onEditorToggle("reverse_direction", checked)
              }
            />
          </div>
          <div className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
            <Label className="capitalize">
              enable mouse wheel acceleration
            </Label>
            <Switch
              checked={editorConfig.enable_acceleration}
              onCheckedChange={(checked) =>
                onEditorToggle("enable_acceleration", checked)
              }
            />
          </div>
          <div className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
            <Label className="capitalize">enable mouse wheel smoothing</Label>
            <Switch
              checked={editorConfig.enable_smoothing}
              onCheckedChange={(checked) =>
                onEditorToggle("enable_smoothing", checked)
              }
            />
          </div>
          <div className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
            <Label className="capitalize">enable horizontal scrolling</Label>
            <Switch
              checked={editorConfig.enable_horizontal}
              onCheckedChange={(checked) =>
                onEditorToggle("enable_horizontal", checked)
              }
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={onSave}>Save</Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
