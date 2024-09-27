import { type CredentialResponse, GoogleLogin } from "@react-oauth/google";
import type React from "react";
import { useState } from "react";

const LoginWarningPopup: React.FC = () => {
  const [showPopup, setShowPopup] = useState(false);

  const handleLogin = async (credentialResponse: CredentialResponse) => {
    console.log("Login successful", credentialResponse);
    // In a real implementation, you would call your login function here
    setShowPopup(false);
  };

  const handleProceedWithoutLogin = () => {
    console.log("Proceeding without login");
    setShowPopup(false);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Login Warning Popup Demo</h1>
      <button
        onClick={() => setShowPopup(true)}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
        type="submit"
      >
        Show Login Warning Popup
      </button>
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-md">
            <h2 className="text-xl font-bold mb-4">Login Recommended</h2>
            <p className="mb-4">
              You are not logged in. Your test results won&apos;t be saved to
              your account.
            </p>
            <div className="mb-4">
              <button
                onClick={() => console.log("Show more info about benefits")}
                className="text-blue-500 hover:underline"
                type="submit"
              >
                Learn more about the benefits of logging in
              </button>
            </div>
            <div className="mb-4">
              <GoogleLogin
                onSuccess={handleLogin}
                onError={() => {
                  console.log("Login Failed");
                }}
              />
            </div>
            <button
              onClick={handleProceedWithoutLogin}
              className="mt-4 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              type="submit"
            >
              Continue without logging in
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginWarningPopup;
