import { AppLayout } from "@/components/AppLayout";

interface TeamPageProps {
  user: any;
  onLogout: () => void;
}

export const TeamPage = ({ user, onLogout }: TeamPageProps) => {
  return (
    <AppLayout user={user} onLogout={onLogout}>
      <div className="p-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Team</h1>
        <p className="text-muted-foreground">Oversigt over team og rangeringer. (Kommer snart)</p>
      </div>
    </AppLayout>
  );
};