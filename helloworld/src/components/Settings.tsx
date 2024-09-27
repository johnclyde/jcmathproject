import { useState } from "react";

const Settings = () => {
  const [fullName, setFullName] = useState("John Doe");
  const [preferences, setPreferences] = useState({
    language: "en",
    timezone: "UTC",
    theme: "light",
    notificationsEnabled: true,
  });
  const [saveAlert, setSaveAlert] = useState(false);

  const handleFullNameChange = (e) => {
    setFullName(e.target.value);
  };

  const handlePreferenceChange = (e) => {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setPreferences({ ...preferences, [e.target.name]: value });
  };

  const handleSave = (e) => {
    e.preventDefault();
    console.log("Saving settings:", { fullName, preferences });
    setSaveAlert(true);
    setTimeout(() => setSaveAlert(false), 3000);
  };

  return (
    <div className="w-[400px] mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Settings</h2>
      <form onSubmit={handleSave}>
        <section className="mb-6">
          <h3 className="text-xl font-semibold mb-2">Personal Information</h3>
          <div className="mb-2">
            <label htmlFor="fullName" className="block mb-1">
              Full Name
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={fullName}
              onChange={handleFullNameChange}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
        </section>

        <section className="mb-6">
          <h3 className="text-xl font-semibold mb-2">Preferences</h3>
          <div className="mb-2">
            <label htmlFor="language" className="block mb-1">
              Language
            </label>
            <select
              id="language"
              name="language"
              value={preferences.language}
              onChange={handlePreferenceChange}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
            </select>
          </div>
          <div className="mb-2">
            <label htmlFor="timezone" className="block mb-1">
              Timezone
            </label>
            <select
              id="timezone"
              name="timezone"
              value={preferences.timezone}
              onChange={handlePreferenceChange}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="UTC">UTC</option>
              <option value="EST">Eastern Time</option>
              <option value="PST">Pacific Time</option>
            </select>
          </div>
          <div className="mb-2">
            <label htmlFor="theme" className="block mb-1">
              Theme
            </label>
            <select
              id="theme"
              name="theme"
              value={preferences.theme}
              onChange={handlePreferenceChange}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </div>
          <div className="mb-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="notificationsEnabled"
                checked={preferences.notificationsEnabled}
                onChange={handlePreferenceChange}
                className="mr-2"
              />
              Enable Notifications
            </label>
          </div>
        </section>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white px-4 py-2 rounded"
        >
          Save Settings
        </button>
      </form>
      {saveAlert && (
        <div className="mt-4 p-2 bg-green-100 text-green-700 rounded">
          Settings saved successfully!
        </div>
      )}
    </div>
  );
};

export default Settings;
