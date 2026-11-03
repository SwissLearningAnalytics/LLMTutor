import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { AiModelSelect } from "@/lib/db/schema";
import { cn } from "@/lib/utils/cn";

type AiModelOption = Pick<AiModelSelect, "id" | "name" | "label" | "isDefault">;

export function AiModelCombobox({
  id,
  models,
  value,
  onChange,
  onBlur,
  disabled,
  "aria-invalid": ariaInvalid,
}: {
  id?: string;
  models: AiModelOption[];
  // null means the default model is used
  value: number | null;
  onChange: (value: number | null) => void;
  onBlur?: () => void;
  disabled?: boolean;
  "aria-invalid"?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const defaultModel = models.find((model) => model.isDefault);
  const selectedModel = models.find((model) => model.id === value);
  const defaultLabel = `Standardmodell${defaultModel ? ` (${formatModel(defaultModel)})` : ""}`;

  function select(modelId: number | null) {
    onChange(modelId);
    setOpen(false);
  }

  return (
    <Popover
      open={open}
      onOpenChange={(open) => {
        setOpen(open);
        if (!open) {
          onBlur?.();
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={ariaInvalid}
          disabled={disabled}
          className="h-10 w-full justify-between bg-surface-primary px-2 font-normal"
        >
          <span className="truncate">
            {selectedModel ? formatModel(selectedModel) : defaultLabel}
          </span>
          <ChevronsUpDownIcon className="text-secondary" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        showArrow={false}
        className="w-(--radix-popover-trigger-width) max-w-none border border-border-primary bg-surface-primary p-0 text-primary shadow-floating"
      >
        <Command>
          <CommandInput placeholder="Modell suchen" />
          <CommandList>
            <CommandEmpty>Kein Modell gefunden.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="Standardmodell"
                keywords={defaultModel ? [defaultModel.name] : []}
                onSelect={() => select(null)}
              >
                <CheckIcon
                  className={cn(value === null ? "opacity-100" : "opacity-0")}
                />
                {defaultLabel}
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              {models.map((model) => (
                <CommandItem
                  key={model.id}
                  value={model.name}
                  keywords={model.label ? [model.label] : []}
                  onSelect={() => select(model.id)}
                >
                  <CheckIcon
                    className={cn(
                      value === model.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {formatModel(model)}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function formatModel(model: Pick<AiModelSelect, "name" | "label">) {
  return model.label ? `${model.label} (${model.name})` : model.name;
}
