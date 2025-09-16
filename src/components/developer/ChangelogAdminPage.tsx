import React, { useState } from "react";
import { changelog as initialChangelog } from "@/changelog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const ChangelogAdminPage = () => {
  const [changelog, setChangelog] = useState(initialChangelog);
  const [form, setForm] = useState({
    version: "",
    date: new Date().toISOString().slice(0, 10),
    changes: "",
  });
  const [editIndex, setEditIndex] = useState<number | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAdd = () => {
    if (!form.date.trim() || !form.changes.trim()) return;
    setChangelog([
      {
        version: form.version || undefined,
        date: form.date,
        changes: form.changes.split("\n").filter((c) => c.trim()),
      },
      ...changelog,
    ]);
    setForm({
      version: "",
      date: new Date().toISOString().slice(0, 10),
      changes: "",
    });
    setEditIndex(null);
  };

  const handleEdit = (idx: number) => {
    const entry = changelog[idx];
    setForm({
      version: entry.version || "",
      date: entry.date,
      changes: Array.isArray(entry.changes)
        ? entry.changes.join("\n")
        : entry.changes || "",
    });
    setEditIndex(idx);
  };

  const handleSaveEdit = () => {
    if (editIndex === null) return;
    const updated = [...changelog];
    updated[editIndex] = {
      version: form.version || undefined,
      date: form.date,
      changes: form.changes.split("\n").filter((c) => c.trim()),
    };
    setChangelog(updated);
    setForm({
      version: "",
      date: new Date().toISOString().slice(0, 10),
      changes: "",
    });
    setEditIndex(null);
  };

  const handleDelete = (idx: number) => {
    setChangelog(changelog.filter((_, i) => i !== idx));
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">
        Changelog Administration (Dev Only)
      </h1>
      <div className="space-y-2 mb-6">
        <Input
          name="version"
          placeholder="Version (valgfri)"
          value={form.version}
          onChange={handleChange}
        />
        <Input
          name="date"
          type="date"
          value={form.date}
          onChange={handleChange}
          className="w-48"
        />
        <Textarea
          name="changes"
          placeholder="Ændringer (ét punkt pr. linje)"
          value={form.changes}
          onChange={handleChange}
          rows={4}
        />
        {editIndex === null ? (
          <Button onClick={handleAdd}>Tilføj changelog</Button>
        ) : (
          <Button onClick={handleSaveEdit}>Gem ændringer</Button>
        )}
      </div>
      <div className="space-y-6">
        {changelog.map((entry, idx) => (
          <div
            key={entry.date + (entry.version || idx)}
            className="border-b pb-4"
          >
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-muted-foreground">
                {entry.date}
              </span>
              <div className="space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(idx)}
                >
                  Rediger
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(idx)}
                >
                  Slet
                </Button>
              </div>
            </div>
            {entry.version && (
              <div className="text-xs text-muted-foreground mb-1">
                {entry.version}
              </div>
            )}
            <ul className="list-disc pl-6 space-y-1 text-sm">
              {(Array.isArray(entry.changes)
                ? entry.changes
                : [entry.changes]
              ).map((desc, i) => (
                <li key={i}>{desc}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};
