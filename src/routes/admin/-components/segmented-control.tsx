import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  disabled,
}: {
  label: string;
  options: { value: T; label: string; className?: string }[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  return (
    <fieldset
      aria-label={label}
      // w-fit! because Field stretches its children to the full width
      className="flex w-fit! gap-1 rounded-md border bg-surface-primary p-0.5"
    >
      {options.map((option) => (
        <Button
          key={option.value}
          type="button"
          size="sm"
          variant={value === option.value ? "default" : "ghost"}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          disabled={disabled}
          className={cn(
            // outer radius (md) minus the padding (0.5), so the corners stay concentric
            "h-7 rounded-sm px-3",
            value !== option.value && "text-secondary hover:text-primary",
            option.className,
          )}
        >
          {option.label}
        </Button>
      ))}
    </fieldset>
  );
}
