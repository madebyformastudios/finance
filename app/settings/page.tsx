import { createClient } from "@/lib/supabase/server";
import { getCoupleSettings } from "@/lib/data";
import NavBar from "@/components/NavBar";
import SettingsForm from "@/components/SettingsForm";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const settings = await getCoupleSettings();

  return (
    <div className="flex min-h-screen flex-col">
      <NavBar email={user?.email} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <h1 className="mb-5 text-xl font-semibold text-slate-900">Settings</h1>
        <SettingsForm settings={settings} />
      </main>
    </div>
  );
}
