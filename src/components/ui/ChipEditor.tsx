"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";

interface ChipEditorProps {
  label: string;
  placeholder: string;
  list: string[];
  setList: (v: string[]) => void;
  max?: number;
}

/** Chip-style multi-value editor used across onboarding, settings and profile. */
export function ChipEditor({ label, placeholder, list, setList, max = 24 }: ChipEditorProps) {
  const [draft, setDraft] = useState("");

  const commit = () => {
    const cleaned = draft.trim();
    if (cleaned && !list.includes(cleaned) && list.length < max) setList([...list, cleaned]);
    setDraft("");
  };

  return (
    <div>
      <span className="label">{label}</span>
      <div className="flex gap-2">
        <input
          className="input"
          placeholder={`${placeholder} (Enter to add)`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            }
          }}
        />
        <button type="button" onClick={commit} className="btn btn-subtle !px-3" aria-label={`Add to ${label}`}>
          <Plus className="h-4 w-4" />
        </button>
      </div>
      {list.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {list.map((item) => (
            <span key={item} className="chip chip-active">
              {item}
              <button
                onClick={() => setList(list.filter((x) => x !== item))}
                aria-label={`Remove ${item}`}
                className="rounded-full p-0.5 hover:bg-white/10"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
