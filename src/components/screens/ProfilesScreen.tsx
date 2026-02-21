import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import type { Profile } from "../../types/app";

type ProfilesScreenProps = {
  profiles: Profile[];
  newProfileName: string;
  onNewProfileNameChange: (value: string) => void;
  onCreateProfile: () => void;
  onEditProfile: (profileId: string) => void;
  onDeleteProfile: (profileId: string) => void;
};

export function ProfilesScreen({
  profiles,
  newProfileName,
  onNewProfileNameChange,
  onCreateProfile,
  onEditProfile,
  onDeleteProfile,
}: ProfilesScreenProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profiles</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex flex-wrap gap-2">
          <Input
            placeholder="New profile name"
            value={newProfileName}
            onChange={(event) =>
              onNewProfileNameChange(event.currentTarget.value)
            }
            className="max-w-xs"
          />
          <Button onClick={onCreateProfile}>Create profile</Button>
        </div>

        <div className="grid gap-2">
          {profiles.map((profile) => (
            <div
              key={profile.id}
              className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2"
            >
              <p className="text-sm font-medium text-slate-900">
                {profile.name}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditProfile(profile.id)}
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDeleteProfile(profile.id)}
                  disabled={profiles.length <= 1}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
