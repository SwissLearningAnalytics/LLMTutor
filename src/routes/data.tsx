import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getMessages } from "@/lib/api/messages";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/data")({
  component: RouteComponent,
});

function RouteComponent() {
  const [error, setError] = useState<Error | undefined>(undefined);
  const [key, setKey] = useState("");
  async function exportData() {
    try {
      const data = await getMessages({ data: key });

      const json = JSON.stringify(data, null, 2);

      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "Sokratischer_Tutor_Daten.json";
      document.body.appendChild(a);
      a.click();

      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setError(undefined);
    } catch (error: unknown) {
      console.error("Error exporting data:", (error as Error).message);
      setError(error as Error);
    }
  }

  return (
    <Layout flex header={""}>
      <Card
        variant="question"
        className="mx-auto my-auto flex w-full flex-col justify-center"
      >
        <CardContent className="p-6">
          <div className="flex w-full flex-col">
            <h1 className="mb-6 text-xl font-extrabold">Daten Exportieren</h1>

            <Label
              htmlFor="audience"
              className="mb-1 flex items-center gap-1 text-base font-bold leading-none"
            >
              <div>Key</div>
            </Label>
            <Input
              type="password"
              id="key"
              className="max-w-60 text-xs font-normal disabled:bg-surface-feedback-neutral-light disabled:opacity-100"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              required
            />
          </div>
          {error && (
            <p className="mt-2 text-red-600">
              Error exporting data: {error.message}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex justify-end py-3">
          <Button
            variant={"destructive"}
            onClick={() => exportData()}
            disabled={!key}
          >
            Daten exportieren
          </Button>
        </CardFooter>
      </Card>
    </Layout>
  );
}
