import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

type AboutScreenProps = {
  appVersion: string;
};

export function AboutScreen({ appVersion }: AboutScreenProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>About</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-slate-700">
        <p>Smoothy is a Linux smooth-scroll utility running in safe mode.</p>
        <p>Version: {appVersion}</p>
      </CardContent>
    </Card>
  );
}
