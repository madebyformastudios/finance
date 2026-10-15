import { getCoupleSettings, getUserEmail } from "@/lib/data";
import NavBar from "@/components/NavBar";
import SettingsForm from "@/components/SettingsForm";

export default async function SettingsPage() {
  const [email, settings] = await Promise.all([getUserEmail(), getCoupleSettings()]);

  return (
    <div className="flex min-h-screen flex-col">
      <NavBar email={email} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <h1 className="mb-5 font-display text-xl font-semibold text-ink">Instellingen</h1>
        <SettingsForm settings={settings} />
      </main>
    </div>
  );
}
