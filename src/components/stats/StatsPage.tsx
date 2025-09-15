import { AppLayout } from "@/components/AppLayout";

interface StatsPageProps {
  user: any;
  onLogout: () => void;
}

export const StatsPage = ({ user, onLogout }: StatsPageProps) => {
  return (
    <AppLayout user={user} onLogout={onLogout}>
      <div className="p-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Statistikker</h1>
        <p className="text-muted-foreground">Oversigt over salg og performance. (Kommer snart)</p>
      </div>
    </AppLayout>
  );
};