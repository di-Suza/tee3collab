import React, { useState } from "react";
import { Zap, RefreshCw, Lock, Hash, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import RoomService from "../services/room.service.js";
import { setCurrentRoom, setLoading, setError } from "../roomsSlice.js";

// The logic provided in your snippet
const ROOM_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function generateRoomCode() {
  let code = "";
  for (let index = 0; index < 6; index += 1) {
    code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
  }
  return code;
}

const CreateLobby = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [roomCode, setRoomCode] = useState(generateRoomCode());
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = () => {
    setRoomCode(generateRoomCode());
  };

  const handleCreate = async () => {
    setIsLoading(true);
    try {
      dispatch(setLoading(true));
      const result = await RoomService.createRoom({ roomCode, password, members: [] });
      dispatch(setCurrentRoom(result.room));
      navigate(`/app/rooms/${result.room.roomCode}`);
    } catch (error) {
      dispatch(setError(error.response?.data?.message || error.message || "Failed to create room"));
    } finally {
      setIsLoading(false);
      dispatch(setLoading(false));
    }
  };

  return (
    <div 
      className="min-h-screen w-full text-white font-sans selection:bg-zinc-700 flex items-center justify-center px-4"
      style={{
        backgroundImage: "url('https://i.pinimg.com/736x/0c/5a/99/0c5a990ae7e9489192d6f7abf916ae19.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="min-h-screen w-full bg-black/85 backdrop-blur-sm flex flex-col">
        
        {/* --- NAVBAR --- */}
        <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center">
              <span className="text-black font-bold text-xl">&lt;/&gt;</span>
            </div>
            <span className="text-xl font-semibold tracking-tight">Darkweb X</span>
          </div>
          <button 
            onClick={() => navigate("/app")} 
            className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm transition-all"
          >
            <ArrowLeft size={14} /> Back to Lobby
          </button>
        </nav>

        <main className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-md">
            
            {/* Header Section */}
            <div className="text-center mb-10">
              <h1 className="text-4xl font-bold tracking-tighter mb-3">Initialize Session</h1>
              <p className="text-zinc-500 text-sm">
                Configure your secure collaboration space and <br /> invite your teammates to join.
              </p>
            </div>

            {/* --- MAIN CREATE CARD --- */}
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-[32px] p-8 backdrop-blur-md hover:border-zinc-600 transition-all shadow-2xl">
              <div className="space-y-6">
                
                {/* Room Code Input Group */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold flex items-center gap-2">
                      <Hash size={12} /> Room Code
                    </label>
                    <button 
                      onClick={handleGenerate}
                      className="text-zinc-500 hover:text-white transition-colors flex items-center gap-1 text-[10px] font-bold uppercase tracking-tighter"
                    >
                      <RefreshCw size={10} /> Regenerate
                    </button>
                  </div>
                  <div className="relative">
                    <input 
                      type="text"
                      value={roomCode}
                      onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                      maxLength={6}
                      className="w-full bg-black border border-zinc-700 rounded-2xl px-4 py-4 font-mono text-lg text-center tracking-[0.5em] outline-none focus:border-white transition-all shadow-inner"
                    />
                  </div>
                </div>

                {/* Password Input Group */}
                <div className="space-y-3">
                  <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold px-1 flex items-center gap-2">
                    <Lock size={12} /> Access Password
                  </label>
                  <div className="relative">
                    <input 
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Optional secure password"
                      className="w-full bg-black border border-zinc-700 rounded-2xl px-4 py-4 text-sm outline-none focus:border-white transition-all placeholder:text-zinc-700"
                    />
                  </div>
                </div>

                {/* Create Button */}
                <button 
                  onClick={handleCreate}
                  disabled={isLoading}
                  className="w-full bg-white text-black py-4 rounded-2xl font-bold hover:bg-zinc-200 transition-all transform active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-white/5 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Zap size={18} /> Provision Room
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Footer hint */}
            <p className="text-center mt-8 text-zinc-600 text-xs font-mono">
              Session will be encrypted via AES-256
            </p>
          </div>
        </main>

      </div>
    </div>
  );
};

export default CreateLobby;
