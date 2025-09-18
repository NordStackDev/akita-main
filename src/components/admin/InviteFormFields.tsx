import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import React from "react";

export function InviteFormFields({
  email, setEmail,
  firstName, setFirstName,
  lastName, setLastName,
  phone, setPhone,
  role, setRole,
  allowedRoles = ["sales", "admin"],
  showRole = true,
}: {
  email: string; setEmail: (v: string) => void;
  firstName: string; setFirstName: (v: string) => void;
  lastName: string; setLastName: (v: string) => void;
  phone: string; setPhone: (v: string) => void;
  role: string; setRole: (v: string) => void;
  allowedRoles?: string[];
  showRole?: boolean;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="firstName">Fornavn</Label>
        <Input id="firstName" value={firstName} onChange={e => setFirstName(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="lastName">Efternavn</Label>
        <Input id="lastName" value={lastName} onChange={e => setLastName(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Telefon</Label>
        <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} />
      </div>
      {showRole && (
        <div className="space-y-2">
          <Label htmlFor="role">Rolle</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger id="role">
              <SelectValue placeholder="Vælg rolle" />
            </SelectTrigger>
            <SelectContent>
              {allowedRoles.map(r => (
                <SelectItem key={r} value={r}>{r === "sales" ? "Sælger" : r.charAt(0).toUpperCase() + r.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </>
  );
}
