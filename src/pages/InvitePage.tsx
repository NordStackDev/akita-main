import React from "react";
import { InviteUserForm } from "@/components/admin/InviteUserForm";
import { InviteCEOForm } from "@/components/admin/InviteCEOForm";

const InvitePage = () => {
  // Her kan du evt. hente organizationId fra context eller props hvis nødvendigt
  // For nu vises begge former uden orgId
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Inviter bruger eller CEO</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InviteUserForm organizationId="" allowedRoles={["admin", "sales"]} />
        <InviteCEOForm organizationId="" />
      </div>
    </div>
  );
};

export default InvitePage;
