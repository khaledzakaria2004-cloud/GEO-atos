import React, { useEffect, useState } from 'react';

const LOCAL_GIF = '/assets/images/video-analysis-demo.gif';
const POSTER = '/assets/images/weekly_tasks.png';

const FeatureShowcase = () => {
  const [gifAvailable, setGifAvailable] = useState(false);
  const [remoteGif, setRemoteGif] = useState('');
  const [inputUrl, setInputUrl] = useState('');

  useEffect(() => {
    let mounted = true;
    // Check if local gif exists using a HEAD request
    fetch(LOCAL_GIF, { method: 'HEAD' })
      .then((res) => {
        if (!mounted) return;
        setGifAvailable(res.ok);
      })
      .catch(() => {
        if (!mounted) return;
        setGifAvailable(false);
      });
    return () => { mounted = false; };
  }, []);

  const useRemote = () => {
    // simple validation
    if (inputUrl && (inputUrl.startsWith('http://') || inputUrl.startsWith('https://'))) {
      setRemoteGif(inputUrl);
    }
  };

  const renderScreen = () => {
    // priority: local gif -> remoteGif -> poster placeholder
    const src = gifAvailable ? LOCAL_GIF : (remoteGif || POSTER);
    const isGif = src.endsWith('.gif') || src.includes('image/gif');
    if (isGif) {
      return (
        <img src={src} alt="ATOS fit Video Analysis Demo" className="w-full h-auto object-cover" />
      );
    }

    // poster with overlay and control to paste remote GIF
    return (
      <div className="relative w-full h-64 md:h-80 lg:h-96 bg-[url('/assets/images/weekly_tasks.png')] bg-center bg-cover">
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <div className="text-center">
            <div className="text-white text-lg mb-3">Preview unavailable locally</div>
            <div className="flex items-center gap-2 justify-center">
              <input
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="Paste GIF URL (https://...)"
                className="px-3 py-2 rounded-l-md w-72 text-black"
              />
              <button onClick={useRemote} className="bg-[#FF8A00] px-4 py-2 rounded-r-md text-black font-semibold">Load</button>
            </div>
            <p className="text-sm text-slate-300 mt-3">Or add <code className="bg-slate-800 px-1 rounded">video-analysis-demo.gif</code> to <code className="bg-slate-800 px-1 rounded">public/assets/images</code></p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto p-4">
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary to-success opacity-10 blur-2xl transform -rotate-3 rounded-3xl pointer-events-none"></div>

      {/* Laptop Frame */}
      <div className="relative bg-slate-800 border-4 border-slate-700 rounded-2xl shadow-2xl p-2">
        {/* Top bar */}
        <div className="flex items-center justify-between px-2 py-1 bg-slate-900 rounded-t-lg">
          <div className="flex space-x-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <div className="w-48 h-4 bg-slate-700 rounded-md"></div>
          <div></div>
        </div>

        {/* Screen Content */}
        <div className="bg-black rounded-b-lg overflow-hidden">
          {renderScreen()}
        </div>
      </div>
    </div>
  );
};

export default FeatureShowcase;
