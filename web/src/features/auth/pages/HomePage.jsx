import React from "react";

const HomePage = () => {
  const googleAuthhandler = () => {
    // Redirect to the backend endpoint for Google OAuth
    window.location.href = "http://localhost:5000/api/v1/auth/google";
  };
  const languages = [
    {
      name: "HTML",
      icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg",
    },
    {
      name: "CSS",
      icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg",
    },
    {
      name: "JavaScript",
      icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg",
    },
    {
      name: "Python",
      icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg",
    },
    {
      name: "NodeJS",
      icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg",
    },
    {
      name: "C/C++",
      icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg",
    },
    {
      name: "Ruby",
      icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/ruby/ruby-original.svg",
    },
  ];
  const codeLines = [
    "import { User } from './models/User';",
    "const response = await fetch('https://api.darkweb.x/auth', {",
    "  headers: { Authorization: `Bearer ${token}` },",
    "});",
  ];
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
      <div className="min-h-screen w-full bg-black/70">
        {/* --- NAVBAR --- */}
        <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center">
              <span className="text-black font-bold text-xl">&lt;/&gt;</span>
            </div>
            <span className="text-xl font-semibold tracking-tight">
              Darkweb X
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-zinc-400 text-sm font-medium">
            <a href="#" className="hover:text-white transition-colors">
              Home
            </a>
            <a href="#" className="hover:text-white transition-colors">
              About
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Pages
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Pricing
            </a>
            <div className="cursor-pointer hover:text-white transition-colors">
              🛒 <span className="ml-1">(0)</span>
            </div>
          </div>

          <button
            onClick={googleAuthhandler}
            className="bg-white text-black px-5 py-2 rounded-full text-sm font-semibold hover:bg-zinc-200 transition-all"
          >
            Get started
          </button>
        </nav>

        {/* --- HERO SECTION --- */}
        <section className="flex flex-col items-center text-center px-4 pt-20 pb-10">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter max-w-4xl leading-tight">
            The next-gen code <br /> editor is here
          </h1>
          <p className="text-zinc-400 mt-6 max-w-2xl text-lg leading-relaxed">
            Supercide sit amet non blandit augue cursus risus pharetra neque
            quam pharetra semper malesuada. Faucibus etiam pellentesque at
            futures.
          </p>

          <div className="flex items-center gap-4 mt-10">
            <button
              onClick={googleAuthhandler}
              className="bg-white text-black px-8 py-3 rounded-full font-semibold hover:bg-zinc-200 transition-all"
            >
              Get started
            </button>
            <button className="border border-zinc-700 px-8 py-3 rounded-full font-semibold hover:bg-zinc-900 transition-all">
              View pricing
            </button>
          </div>
        </section>

        {/* --- EDITOR VISUAL SECTION --- */}
        <section className="relative max-w-6xl mx-auto px-4 py-20">
          <div className="relative group">
            {/* This is where your Editor Screenshot goes */}
            <div className="rounded-xl overflow-hidden border border-zinc-800 shadow-2xl shadow-zinc-900">
              <img
                src="https://ik.imagekit.io/7tiz96d91/e55b4386c9e4c6c9b513a809b407348b.jpg?updatedAt=1782777565412"
                // src="https://i.pinimg.com/736x/0c/5a/99/0c5a990ae7e9489192d6f7abf916ae19.jpg"
                alt="Editor Interface"
                className="w-full h-auto"
              />
            </div>

            {/* Floating UI Badges (The "X" factor) */}
            <div className="absolute -top-6 -right-6 bg-zinc-900 border border-zinc-700 p-3 rounded-lg shadow-xl animate-bounce">
              <span className="text-xs font-mono text-green-400">
                Ready to run...
              </span>
            </div>
            <div className="absolute top-1/3 -left-10 bg-zinc-900 border border-zinc-700 p-3 rounded-lg shadow-xl">
              <span className="text-xs font-mono text-blue-400">
                Auto-save enabled
              </span>
            </div>
            <div className="absolute bottom-10 -right-10 bg-zinc-900 border border-zinc-700 p-3 rounded-lg shadow-xl">
              <span className="text-xs font-mono text-purple-400">
                AI Suggestion
              </span>
            </div>
          </div>
        </section>

        {/* --- LANGUAGES SECTION --- */}
        <section className="py-20 text-center">
          <p className="text-zinc-500 text- mb-8 font-semibold">
            Works with most popular languages
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            {languages.map((lang) => (
              <div
                key={lang.name}
                className="flex items-center gap-3 bg-zinc-900 border border-zinc-700 rounded-xl px-5 py-3"
              >
                <img src={lang.icon} alt={lang.name} className="w-8 h-8" />
                <span>{lang.name}</span>
              </div>
            ))}
          </div>

          <p className="text-zinc-600 text-xs mt-8">
            and 100+ other languages too...
          </p>
        </section>

        {/* --- FEATURES SECTION --- */}
        <section className="bg-black text-white py-24 px-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
                Features
              </h2>
              <p className="text-zinc-400 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
                Suspendisse sed sit non blandit augue cursus risus pharetra
                neque quam pharetra semper malesuada. Ridiculus aliquam
                pelentesque.
              </p>
            </div>

            {/* Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[240px]">
              {/* 1. Top Left: Code Preview (Spans 2 rows) */}
              <div className="md:row-span-2 bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 overflow-hidden relative group hover:border-zinc-600 transition-all">
                <div className="absolute top-4 right-4 flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
                  <div className="w-2 h-2 rounded-full bg-yellow-500/50"></div>
                  <div className="w-2 h-2 rounded-full bg-green-500/50"></div>
                </div>
                <div className="font-mono text-[10px] md:text-xs mt-4 space-y-1">
                  {codeLines.map((line, index) => (
                    <p key={index} className="text-zinc-400">
                      {line}
                    </p>
                  ))}

                  <div className="mt-4 p-2 bg-zinc-800/50 rounded border border-zinc-700 text-zinc-300 inline-block">
                    ✨ AI suggestion: optimize this loop...
                  </div>
                </div>
                <div className="absolute bottom-8 left-6 right-6">
                  <h3 className="text-xl font-semibold mb-2">
                    The smartest editor
                  </h3>
                  <p className="text-zinc-400 text-xs leading-relaxed">
                    Lorem ipsum dolor sit amet, consectetur aliquip adipiscing
                    elit, sed do eiusmod tempor.
                  </p>
                  <button className="text-xs text-zinc-300 underline underline-offset-4 mt-2 hover:text-white">
                    Learn more →
                  </button>
                </div>
              </div>

              {/* 2. Top Center: Built-in Tools */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 flex flex-col justify-center hover:border-zinc-600 transition-all">
                <h3 className="text-2xl font-semibold mb-4 leading-tight">
                  Built-in <br /> developers tools
                </h3>
                <button className="text-sm text-zinc-400 hover:text-white transition-colors w-fit">
                  Learn more →
                </button>
              </div>

              {/* 3. Top Right: Run/Debug List */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 overflow-hidden hover:border-zinc-600 transition-all">
                <div className="space-y-3">
                  {[
                    "Run appTesting",
                    "Debug appTesting",
                    "Run appTesting with Coverage",
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-2 bg-black/30 rounded-lg border border-zinc-800 text-xs text-zinc-300"
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${i === 0 ? "bg-green-500" : i === 1 ? "bg-red-500" : "bg-blue-500"}`}
                      ></div>
                      {item}
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex gap-2">
                  <div className="px-3 py-1 bg-zinc-800 rounded text-[10px] text-zinc-400">
                    Run: appTesting x
                  </div>
                  <div className="px-3 py-1 bg-zinc-800 rounded text-[10px] text-zinc-400">
                    Run function x
                  </div>
                </div>
              </div>

              {/* 4. Bottom Center: Fast Navigation */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 flex flex-col justify-between hover:border-zinc-600 transition-all">
                <div className="bg-black border border-zinc-700 rounded-lg p-2 flex items-center gap-2 w-full">
                  <span className="text-zinc-500 text-xs">🔍</span>
                  <span className="text-xs text-zinc-400">demo</span>
                  <span className="ml-auto text-zinc-600 text-[10px]">⌘K</span>
                </div>
                <div>
                  <h3 className="text-2xl font-semibold mb-2">
                    Fast navigation
                  </h3>
                  <button className="text-sm text-zinc-400 hover:text-white transition-colors">
                    Learn more →
                  </button>
                </div>
              </div>

              {/* 5. Bottom Right: Teamwork */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 flex flex-col justify-between hover:border-zinc-600 transition-all">
                <div className="flex -space-x-3 justify-center mb-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`w-10 h-10 rounded-full border-2 border-black bg-zinc-700 flex items-center justify-center text-xs font-bold`}
                    >
                      U{i}
                    </div>
                  ))}
                </div>
                <div>
                  <h3 className="text-2xl font-semibold mb-2 text-center">
                    Efficient teamwork
                  </h3>
                  <button className="text-sm text-zinc-400 hover:text-white transition-colors block mx-auto">
                    Learn more →
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Button */}
            <div className="flex justify-center mt-16">
              <button className="bg-white text-black px-8 py-3 rounded-full font-semibold hover:bg-zinc-200 transition-all">
                Browse all features
              </button>
            </div>
          </div>
        </section>
        {/* --- FOOTER CTA --- */}
        {/* <footer className="flex justify-center pb-32">
          <button className="border border-zinc-700 px-10 py-4 rounded-full font-semibold hover:bg-zinc-900 transition-all">
            Browse all features
          </button>
        </footer> */}
      </div>{" "}
      {/* Close bg-black/70 overlay */}
    </div>
  );
};

export default HomePage;
