"use client";

import React from "react";
import { useScenario, Scenario } from "@/hooks/useScenario";
import * as Select from "@radix-ui/react-select";
import { ChevronDownIcon } from "@radix-ui/react-icons";
import { Button } from "./Button";

const scenarios: { value: Scenario; label: string }[] = [
  { value: "auth-visible", label: "Authenticated user" },
  { value: "auth-hidden", label: "Authenticated user (can't see comments)" },
  { value: "anonymous", label: "Anonymous user (can read everything)" },
];

export function ScenarioMenu() {
  const { scenario, updateScenario, isLoaded } = useScenario();

  if (!isLoaded) {
    return null;
  }

  return (
    <Select.Root value={scenario || ""} onValueChange={updateScenario}>
      <Select.Trigger asChild>
        <Button variant="secondary">
          <div className="flex items-center justify-between">
            <Select.Value />
            <ChevronDownIcon className="ml-1.5 w-4 h-4" />
          </div>
        </Button>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content className="z-50 bg-surface-elevated border rounded-sm shadow-xl overflow-hidden">
          <Select.Viewport>
            {scenarios.map((item) => (
              <Select.Item
                key={item.value}
                value={item.value}
                className="bg-white px-4 py-3 text-sm cursor-pointer hover:bg-neutral-100 focus:bg-neutral-100 focus:outline-none"
              >
                <Select.ItemText>{item.label}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
