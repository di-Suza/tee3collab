import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const HomeLobbyPage = () => {
  const navigate = useNavigate();
  const [roomID, setRoomID] = useState("");

  const handleJoinRoom = () => {
    navigate("/app/join-lobby");
  };

  return (
    <div
      className="min-h-screen w-full text-white font-sans selection:bg-zinc-700"
      style={{
        backgroundImage:
          "url('https://i.pinimg.com/736x/0c/5a/99/0c5a990ae7e9489192d6f7abf916ae19.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="min-h-screen w-full bg-black/80 backdrop-blur-sm flex flex-col">
        
        {/* --- MINIMAL NAVBAR --- */}
        <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full">
          <div 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={() => window.location.href = "/"}
          >
            <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center">
              <span className="text-black font-bold text-xl">&lt;/&gt;</span>
            </div>
            <span className="text-xl font-semibold tracking-tight">Darkweb X</span>
          </div>
          <button 
            onClick={() => window.location.href = "/"} 
            className="text-zinc-400 hover:text-white text-sm transition-colors"
          >
            ← Back to Home
          </button>
        </nav>

        {/* --- LOBBY MAIN SECTION --- */}
        <main className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4">
              Collaboration <span className="text-zinc-500">Hub</span>
            </h1>
            <p className="text-zinc-400 max-w-md mx-auto">
              Create a secure space to code together in real-time or join an existing session.
            </p>
          </div>

          {/* --- ACTION CARDS --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
            
            {/* Card 1: Create Room */}
            <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl backdrop-blur-md hover:border-zinc-600 transition-all group text-center flex flex-col justify-between">
              <div>
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <span className="text-3xl">⚡</span>
                </div>
                <h2 className="text-2xl font-semibold mb-3">Start New Session</h2>
                <p className="text-zinc-500 text-sm mb-8">
                  Generate a unique room ID and invite your teammates to collaborate instantly.
                </p>
              </div>
              <button 
                onClick={() => navigate("/app/create-lobby")}
                className="w-full bg-white text-black py-4 rounded-2xl font-bold hover:bg-zinc-200 transition-all transform active:scale-95"
              >
                Create Room
              </button>
            </div>

            {/* Card 2: Join Room */}
            <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl backdrop-blur-md hover:border-zinc-600 transition-all group text-center flex flex-col justify-between">
              <div>
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <span className="text-3xl">🔑</span>
                </div>
                <h2 className="text-2xl font-semibold mb-3">Enter a Session</h2>
                <p className="text-zinc-500 text-sm mb-8">
                  Have a room ID and password? Continue to the secure join screen.
                </p>
              </div>

              <button 
                onClick={() => navigate("/app/join-lobby")}
                className="w-full bg-zinc-100 text-black py-4 rounded-2xl font-bold hover:bg-white transition-all transform active:scale-95"
              >
                Join Room
              </button>

              <div className="hidden">
                {/* Command Palette Style Input */}
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                    🔍
                  </div>
                  <input 
                    type="text"
                    value={roomID}
                    onChange={(e) => setRoomID(e.target.value)}
                    placeholder="Enter Room ID (e.g. AX-123)"
                    className="w-full bg-black border border-zinc-700 rounded-xl py-4 pl-11 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-white transition-all font-mono text-sm"
                  />
                </div>
                <button 
                  onClick={handleJoinRoom}
                  className="w-full bg-zinc-100 text-black py-4 rounded-2xl font-bold hover:bg-white transition-all transform active:scale-95"
                >
                  Join Room
                </button>
              </div>
            </div>

          </div>
        </main>

        {/* --- SYSTEM STATUS FOOTER --- */}
        <footer className="p-8 flex justify-center items-center gap-6 text-zinc-600 text-xs font-mono">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            System Online
          </div>
          <div className="w-1 h-1 bg-zinc-700 rounded-full"></div>
          <div>Region: US-EAST-1</div>
          <div className="w-1 h-1 bg-zinc-700 rounded-full"></div>
          <div>Encrypted: AES-256</div>
        </footer>
      </div>
    </div>
  );
};

export default HomeLobbyPage;
