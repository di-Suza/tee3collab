import React from "react";


const HomePage = () => {

    const handleGoogleSignIn = () => {
        window.location.href = "http://localhost:5000/api/v1/auth/google";
    }
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-xl p-8">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-xl bg-emerald-500 flex items-center justify-center text-3xl font-bold text-white">
            C
          </div>
        </div>

        {/* Heading */}
        <h1 className="mt-6 text-center text-3xl font-bold text-white">
          Welcome to CodeRoom
        </h1>

        <p className="mt-3 text-center text-slate-400">
          Collaborate with your team in real-time. Create rooms, join coding
          sessions, and build together from anywhere.
        </p>

        {/* Google Button */}
        <a
          onClick={handleGoogleSignIn}
          className="mt-8 flex w-full items-center justify-center gap-3 rounded-lg border border-slate-700 bg-white px-4 py-3 font-medium text-slate-900 transition hover:bg-slate-100"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 48 48"
            className="h-6 w-6"
          >
            <path
              fill="#FFC107"
              d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12S17.4 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"
            />
            <path
              fill="#FF3D00"
              d="M6.3 14.7l6.6 4.8C14.7 15.1 18.9 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.1 29.3 4 24 4c-7.7 0-14.4 4.3-17.7 10.7z"
            />
            <path
              fill="#4CAF50"
              d="M24 44c5.2 0 10-2 13.6-5.3l-6.3-5.2C29.3 35 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.6 5.1C9.4 39.6 16.1 44 24 44z"
            />
            <path
              fill="#1976D2"
              d="M43.6 20.5H42V20H24v8h11.3c-1.1 3-3.3 5.3-6 6.8l6.3 5.2C39.2 36.7 44 31 44 24c0-1.3-.1-2.3-.4-3.5z"
            />
          </svg>

          Continue with Google
          
        </a>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-slate-500">
          Secure authentication powered by Google.
        </p>
      </div>
    </div>
  );
};

export default HomePage;