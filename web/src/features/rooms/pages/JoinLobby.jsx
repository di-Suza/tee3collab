import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Key, Lock, ArrowRight, ShieldCheck } from "lucide-react";
import { useDispatch } from "react-redux";
import RoomService from "../services/room.service.js";
import { setCurrentRoom, setLoading, setError } from "../roomsSlice.js";

const JoinLobby = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // State for the inputs
  const [roomCode, setRoomCode] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();

  // 1. HANDLE LINK JOINING: 
  // If the URL is /join?joinRoomCode=ABC123, automatically fill the input
  useEffect(() => {
    const inviteCode = searchParams.get("joinRoomCode");
    if (inviteCode) {
      setRoomCode(inviteCode.toUpperCase());
    }
  }, [searchParams]);

  const handleJoin = async () => {
    if (!roomCode) return alert("Please enter a room code");
    
    setIsLoading(true);
    try {
      dispatch(setLoading(true));
      const res = await RoomService.joinRoom({ roomCode, password });
      dispatch(setCurrentRoom(res.room));
      navigate(`/app/rooms/${res.room.roomCode}`);
    } catch (error) {
      dispatch(setError(error.response?.data?.message || error.message || "Failed to join room"));
      alert(error.response?.data?.message || error.message || "Failed to join room");
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
      {/* Dark Overlay for consistency */}
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm"></div>

      {/* MAIN CARD (Similar to image layout) */}
      <div className="relative z-10 w-full max-w-md">
        
        {/* Decorative Top Element (Matching the "bubbles" in your image) */}
        <div className="flex justify-center items-end gap-4 mb-8">
          <div className="bg-zinc-800/80 backdrop-blur-md px-4 py-2 rounded-2xl text-xs text-zinc-400 border border-zinc-700 animate-bounce">
            Waiting for you...
          </div>
          <div className="w-16 h-16 rounded-full border-4 border-black bg-zinc-700 overflow-hidden shadow-2xl">
             <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
          </div>
          <div className="bg-zinc-800/80 backdrop-blur-md px-4 py-2 rounded-2xl text-xs text-zinc-400 border border-zinc-700">
            Invite Received!
          </div>
        </div>

        <div className="bg-zinc-900/40 border border-zinc-800 p-8 md:p-12 rounded-[40px] backdrop-blur-xl shadow-2xl text-center">
          
          {/* Header Section */}
          <h1 className="text-3xl md:text-4xl font-bold tracking-tighter mb-4">
            Enter Invite Code
          </h1>
          <p className="text-zinc-500 text-sm leading-relaxed mb-10">
            Only invited users can access the product. <br /> 
            Enter your code to continue.
          </p>

          {/* Form Section */}
          <div className="space-y-6 text-left">
            
            {/* Room Code Input */}
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-zinc-500 ml-1 font-semibold">
                Room Code
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                  <Key size={18} />
                </div>
                <input 
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="Ex: PW66*34"
                  className="w-full bg-black border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-700 focus:outline-none focus:border-white transition-all font-mono"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-zinc-500 ml-1 font-semibold">
                Password <span className="text-zinc-700">(Optional)</span>
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                  <Lock size={18} />
                </div>
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full bg-black border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-700 focus:outline-none focus:border-white transition-all"
                />
              </div>
            </div>

            {/* Verify Button */}
            <button 
              onClick={handleJoin}
              disabled={isLoading}
              className="w-full bg-white text-black py-4 rounded-2xl font-bold hover:bg-zinc-200 transition-all transform active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-white/5"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  Verify Now <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>

          {/* Trust Badge */}
          <div className="mt-8 flex items-center justify-center gap-2 text-zinc-600 text-[10px] uppercase tracking-widest">
            <ShieldCheck size={14} />
            Secure End-to-End Encryption
          </div>
        </div>

        {/* Bottom Link */}
        <div className="text-center mt-8">
          <button 
            onClick={() => navigate("/")} 
            className="text-zinc-500 hover:text-white text-sm transition-all underline underline-offset-4"
          >
            Not invited? Go back home
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoinLobby;
