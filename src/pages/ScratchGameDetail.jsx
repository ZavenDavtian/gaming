import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiCopy, FiCheck } from 'react-icons/fi';

const ScratchGameDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isCopied, setIsCopied] = useState(false);
  const iframeRef = useRef(null);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };


  return (
    <div className="py-8 md:py-12 max-w-5xl mx-auto">
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors group"
      >
        <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" />
        <span>Back to Games</span>
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white mb-2">Scratch Game</h1>
            <p className="text-slate-400 text-sm">Project ID: {id}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleShare}
              className={`p-3 rounded-xl border transition-colors ${isCopied ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'}`}
              title="Copy Link"
            >
              {isCopied ? <FiCheck /> : <FiCopy />}
            </button>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl blur-2xl opacity-20 transition-opacity duration-500" />
          <div className="glass-panel p-2 md:p-6 rounded-3xl relative bg-slate-900/80 border border-white/10 shadow-2xl flex justify-center items-center">
            {/* The standard Scratch embed size is 485x402, using aspect ratio to keep it responsive */}
            <div className="size-full flex justify-center items-center bg-slate-950 rounded-2xl overflow-hidden aspect-[485/402] max-w-3xl mx-auto">
              <iframe
                ref={iframeRef}
                src={`https://scratch.mit.edu/projects/${id}/embed`}
                allowtransparency="true"
                frameBorder="0"
                scrolling="no"
                allowFullScreen
                title="Scratch Game Player"
                className="w-full h-full bg-white"
              ></iframe>
            </div>
          </div>
        </div>

        <div className="mt-8 glass-panel p-6 rounded-2xl border border-white/10">
          <h3 className="text-xl font-bold text-white mb-4">How to Play</h3>
          <ul className="list-disc list-inside text-slate-400 space-y-2 mb-6">
            <li>Click the Green Flag in the center of the game to start.</li>
            <li>Use your mouse or keyboard as instructed by the game.</li>
            <li>Click the Red Stop sign to stop the game.</li>
          </ul>

          <div className="p-4 bg-indigo-600/10 border border-indigo-500/20 rounded-xl text-indigo-300 text-sm">
            <p><strong>Note:</strong> Since this is a Scratch game embedded directly from MIT, it requires a short moment to load the assets before it can be played.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ScratchGameDetail;
