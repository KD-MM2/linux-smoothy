import { useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getVersion } from "@tauri-apps/api/app";

import { AppHeader } from "./components/screens/AppHeader";
import { HomeScreen } from "./components/screens/HomeScreen";
import { SettingsScreen } from "./components/screens/SettingsScreen";
import { ProfilesScreen } from "./components/screens/ProfilesScreen";
import { ProfileEditorScreen } from "./components/screens/ProfileEditorScreen";
import { AboutScreen } from "./components/screens/AboutScreen";
// import { Button } from "./components/ui/button";
import {
  cloneConfig,
  FIELD_CONFIG,
  PRESETS,
  type DeviceInfo,
  type PermissionStatus,
  type PhysicsConfig,
  type Profile,
  type RuntimeStatus,
  type ViewScreen,
} from "./types/app";

function App() {
  const [config, setConfig] = useState<PhysicsConfig>(
    cloneConfig(PRESETS.custom),
  );
  const [status, setStatus] = useState<RuntimeStatus>({
    daemon_running: false,
    active_device: null,
    last_velocity: 0,
  });
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [velocityGraph, setVelocityGraph] = useState<number[]>([]);
  const [error, setError] = useState<string>("");
  const [permission, setPermission] = useState<PermissionStatus | null>(null);
  const [screen, setScreen] = useState<ViewScreen>("home");
  const [appVersion, setAppVersion] = useState<string>("unknown");
  const [osVersion, setOsVersion] = useState<string>("unknown");
  const [profiles, setProfiles] = useState<Profile[]>([
    { id: "custom", name: "custom", config: cloneConfig(PRESETS.custom) },
    { id: "normal", name: "normal", config: cloneConfig(PRESETS.normal) },
    {
      id: "aggressive",
      name: "aggressive",
      config: cloneConfig(PRESETS.aggressive),
    },
    {
      id: "precision",
      name: "precision",
      config: cloneConfig(PRESETS.precision),
    },
  ]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("custom");
  const [newProfileName, setNewProfileName] = useState<string>("");
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [editorConfig, setEditorConfig] = useState<PhysicsConfig>(
    cloneConfig(PRESETS.custom),
  );
  const [editorName, setEditorName] = useState<string>("Default");

  const selectedProfile = useMemo(
    () => profiles.find((profile) => profile.id === selectedProfileId) ?? null,
    [profiles, selectedProfileId],
  );

  const graphModel = useMemo(() => {
    const width = 680;
    const height = 140;

    if (velocityGraph.length === 0) {
      return {
        points: "",
        zeroY: height / 2,
        hasData: false,
        min: 0,
        max: 0,
      };
    }

    const min = Math.min(...velocityGraph);
    const max = Math.max(...velocityGraph);
    const span = Math.max(Math.abs(min), Math.abs(max), 1);

    const points = velocityGraph
      .map((value, index) => {
        const x =
          velocityGraph.length <= 1
            ? 0
            : (index / (velocityGraph.length - 1)) * width;
        const normalized = (value + span) / (2 * span);
        const y = height - normalized * height;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(" ");

    return {
      points,
      zeroY: height / 2,
      hasData: true,
      min,
      max,
    };
  }, [velocityGraph]);

  async function loadConfig() {
    const current = await invoke<PhysicsConfig>("get_physics");
    setConfig(current);
  }

  async function refreshDevices() {
    const list = await invoke<DeviceInfo[]>("get_devices");
    setDevices(list);
  }

  async function refreshStatus() {
    const current = await invoke<RuntimeStatus>("get_status");
    setStatus(current);
  }

  async function refreshPermissions() {
    const current = await invoke<PermissionStatus>("get_permission_status");
    setPermission(current);
  }

  async function refreshVelocityGraph() {
    const data = await invoke<number[]>("get_velocity_graph");
    setVelocityGraph(data);
  }

  useEffect(() => {
    const bootstrap = async () => {
      await Promise.all([
        loadConfig(),
        refreshDevices(),
        refreshStatus(),
        refreshPermissions(),
        refreshVelocityGraph(),
      ]);

      setOsVersion(`${navigator.platform} · ${navigator.userAgent}`);
      try {
        const version = await getVersion();
        setAppVersion(version);
      } catch {
        setAppVersion("unknown");
      }
    };

    bootstrap().catch((e) => setError(String(e)));
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        await invoke("update_physics", { config });
      } catch (e) {
        setError(String(e));
      }
    }, 70);

    return () => clearTimeout(timer);
  }, [config]);

  useEffect(() => {
    let unlistenStatus: (() => void) | undefined;
    let unlistenVelocity: (() => void) | undefined;

    const setupListeners = async () => {
      unlistenStatus = await listen<RuntimeStatus>(
        "runtime-status",
        (event) => {
          setStatus(event.payload);
        },
      );

      unlistenVelocity = await listen<number>("velocity-sample", (event) => {
        const value = event.payload;
        setStatus((prev) => ({ ...prev, last_velocity: value }));
        setVelocityGraph((prev) => {
          const next = [...prev, value];
          if (next.length > 240) {
            next.splice(0, next.length - 240);
          }
          return next;
        });
      });
    };

    setupListeners().catch((e) => setError(String(e)));

    return () => {
      unlistenStatus?.();
      unlistenVelocity?.();
    };
  }, []);

  async function startDaemon() {
    try {
      await invoke("start_daemon", { devicePath: null });
      await refreshStatus();
      await refreshPermissions();
      setError("");
    } catch (e) {
      setError(String(e));
    }
  }

  async function stopDaemon() {
    try {
      await invoke("stop_daemon");
      await refreshStatus();
      setError("");
    } catch (e) {
      setError(String(e));
    }
  }

  //   async function injectScroll(delta: number) {
  //     try {
  //       await invoke("push_scroll_delta", { delta });
  //       setError("");
  //     } catch (e) {
  //       setError(String(e));
  //     }
  //   }

  function updateNumberField(
    field: (typeof FIELD_CONFIG)[number]["key"],
    value: string,
  ) {
    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) {
      return;
    }

    setConfig((prev) => ({ ...prev, [field]: numericValue }));
  }

  function updateEditorNumberField(
    field: (typeof FIELD_CONFIG)[number]["key"],
    value: string,
  ) {
    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) {
      return;
    }

    setEditorConfig((prev) => ({ ...prev, [field]: numericValue }));
  }

  function loadProfile() {
    if (!selectedProfile) {
      return;
    }

    setConfig(cloneConfig(selectedProfile.config));
  }

  function saveProfile() {
    if (!selectedProfileId) {
      return;
    }

    setProfiles((prev) =>
      prev.map((profile) =>
        profile.id === selectedProfileId
          ? { ...profile, config: cloneConfig(config) }
          : profile,
      ),
    );
  }

  function openProfileEditor(profileId: string) {
    const profile = profiles.find((entry) => entry.id === profileId);
    if (!profile) {
      return;
    }

    setEditingProfileId(profile.id);
    setEditorName(profile.name);
    setEditorConfig(cloneConfig(profile.config));
    setScreen("profile-editor");
  }

  function saveProfileEditor() {
    if (!editingProfileId) {
      return;
    }

    setProfiles((prev) =>
      prev.map((profile) =>
        profile.id === editingProfileId
          ? {
              ...profile,
              name: editorName.trim() || profile.name,
              config: cloneConfig(editorConfig),
            }
          : profile,
      ),
    );
    setScreen("profiles");
  }

  function createProfile() {
    const nextName = newProfileName.trim();
    if (!nextName) {
      return;
    }

    const id = `${Date.now()}`;
    const created: Profile = {
      id,
      name: nextName,
      config: cloneConfig(config),
    };
    setProfiles((prev) => [...prev, created]);
    setSelectedProfileId(id);
    setNewProfileName("");
  }

  function deleteProfile(profileId: string) {
    if (profiles.length <= 1) {
      return;
    }

    setProfiles((prev) => prev.filter((profile) => profile.id !== profileId));
    if (selectedProfileId === profileId) {
      const fallback = profiles.find((profile) => profile.id !== profileId);
      setSelectedProfileId(fallback?.id ?? "");
    }
  }

  function resetDefaults() {
    setConfig(cloneConfig(PRESETS.custom));
    setError("");
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-4 sm:px-6">
        <AppHeader
          daemonRunning={status.daemon_running}
          onToggleService={status.daemon_running ? stopDaemon : startDaemon}
          onNavigate={setScreen}
        />

        {error && (
          <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        )}

        {screen === "home" && (
          <HomeScreen
            profiles={profiles}
            selectedProfileId={selectedProfileId}
            onSelectProfile={setSelectedProfileId}
            onLoadProfile={loadProfile}
            onSaveProfile={saveProfile}
            onEditProfile={() =>
              selectedProfile && openProfileEditor(selectedProfile.id)
            }
            canEditProfile={Boolean(selectedProfile)}
            config={config}
            onUpdateNumberField={updateNumberField}
            onChangeEasing={(easing) => {
              setConfig((prev) => ({ ...prev, easing }));
            }}
            onToggleOption={(key, checked) => {
              setConfig((prev) => ({ ...prev, [key]: checked }));
            }}
          />
        )}

        {screen === "settings" && (
          <SettingsScreen
            appVersion={appVersion}
            osVersion={osVersion}
            status={status}
            deviceCount={devices.length}
            permission={permission}
            velocityGraph={graphModel}
            onRefreshDiagnostics={refreshPermissions}
            onResetDefaults={resetDefaults}
          />
        )}

        {screen === "profiles" && (
          <ProfilesScreen
            profiles={profiles}
            newProfileName={newProfileName}
            onNewProfileNameChange={setNewProfileName}
            onCreateProfile={createProfile}
            onEditProfile={openProfileEditor}
            onDeleteProfile={deleteProfile}
          />
        )}

        {screen === "profile-editor" && editingProfileId && (
          <ProfileEditorScreen
            editorName={editorName}
            editorConfig={editorConfig}
            onEditorNameChange={setEditorName}
            onEditorFieldChange={updateEditorNumberField}
            onEditorEasingChange={(easing) =>
              setEditorConfig((prev) => ({ ...prev, easing }))
            }
            onEditorToggle={(key, checked) =>
              setEditorConfig((prev) => ({ ...prev, [key]: checked }))
            }
            onSave={saveProfileEditor}
            onCancel={() => setScreen("profiles")}
          />
        )}

        {screen === "about" && <AboutScreen appVersion={appVersion} />}

        {/* <footer className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
          <span>Service: {status.daemon_running ? "running" : "stopped"}</span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => injectScroll(90)}
            >
              Inject +90
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => injectScroll(-90)}
            >
              Inject -90
            </Button>
          </div>
        </footer> */}
      </div>
    </main>
  );
}

export default App;
