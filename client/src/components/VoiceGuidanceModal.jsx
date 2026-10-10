import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, X, Sparkles, Navigation, Utensils, AlertTriangle, Search, Clock } from 'lucide-react';

export function VoiceGuidanceModal({ isOpen, onClose, onNavigate, onAskStatus }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [assistantReply, setAssistantReply] = useState(
    "Hi Karthik! I'm your Smart Campus Voice Guide. How can I help you today? You can say 'Show menu', 'How busy is Canteen 1', 'Where is the library', or 'Report an issue'."
  );
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setSupported(false);
    }
  }, []);

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleVoiceCommand = (cmd) => {
    const text = cmd.toLowerCase();
    setTranscript(cmd);

    if (text.includes('menu') || text.includes('food') || text.includes('canteen') || text.includes('order')) {
      const reply = 'Taking you to the Canteen Live Menu. You can check live stock quantities and place prepaid orders!';
      setAssistantReply(reply);
      speak(reply);
      onNavigate('canteen');
    } else if (text.includes('queue') || text.includes('token') || text.includes('status') || text.includes('wait') || text.includes('eta')) {
      const reply = 'Opening Live Token Queue. You can check current serving tokens and live wait-time predictions.';
      setAssistantReply(reply);
      speak(reply);
      onNavigate('queue');
    } else if (text.includes('map') || text.includes('direction') || text.includes('where is') || text.includes('store') || text.includes('library') || text.includes('xerox')) {
      const reply = 'Opening the Interactive Campus Map with all stores, canteens, and academic buildings.';
      setAssistantReply(reply);
      speak(reply);
      onNavigate('map');
    } else if (text.includes('lost') || text.includes('found') || text.includes('belonging') || text.includes('claim')) {
      const reply = 'Navigating to Lost & Found portal. You can browse found belongings or report a missing item.';
      setAssistantReply(reply);
      speak(reply);
      onNavigate('lost-found');
    } else if (text.includes('issue') || text.includes('problem') || text.includes('complain') || text.includes('wifi') || text.includes('water')) {
      const reply = 'Taking you to Campus Issue Reporting. You can raise a problem with 5-stage live status tracking.';
      setAssistantReply(reply);
      speak(reply);
      onNavigate('issues');
    } else if (text.includes('busy') || text.includes('crowd')) {
      const reply = 'Canteen 1 currently has Moderate crowd (~10 min wait). Canteen 2 has Low crowd (~5 min wait).';
      setAssistantReply(reply);
      speak(reply);
      onNavigate('canteen');
    } else {
      const reply = `I heard: "${cmd}". You can ask me about canteen food, live token queue, campus map, lost items, or issue reporting!`;
      setAssistantReply(reply);
      speak(reply);
    }
  };

  const toggleListening = () => {
    if (!supported) {
      alert('Speech Recognition is not supported by your current browser. You can click any of the voice prompt buttons below!');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript('Listening for your campus command...');
      };

      recognition.onresult = (event) => {
        const spoken = event.results[0][0].transcript;
        setIsListening(false);
        handleVoiceCommand(spoken);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  if (!isOpen) return null;

  const quickCommands = [
    { label: 'Check Canteen Menu', cmd: 'Show live menu and stock' },
    { label: 'Track My Token #C1-047', cmd: 'Check my token queue and wait time' },
    { label: 'Find Campus Xerox & Stores', cmd: 'Where is the Xerox store on campus map' },
    { label: 'Report Leaking Water Cooler', cmd: 'Report campus issue with water cooler' },
    { label: 'Browse Lost Belongings', cmd: 'Open lost and found to find my item' },
    { label: 'Canteen Crowd Levels', cmd: 'How busy is Canteen 1 right now' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-100 flex items-center gap-2">
                Voice Guidance Assistant
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-medium border border-blue-500/30">
                  Slide 4 & 9 Extension
                </span>
              </h3>
              <p className="text-xs text-slate-400">Natural voice assistant to navigate food, tokens, maps and issues</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Assistant Response Box */}
        <div className="my-5 p-4 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 shrink-0 mt-0.5">
            <Volume2 className="w-4 h-4" />
          </div>
          <div className="flex-1 text-sm text-slate-200 leading-relaxed">
            <p className="font-medium text-indigo-300 text-xs mb-1">Smart Campus Hub Guide:</p>
            {assistantReply}
          </div>
        </div>

        {/* Mic Activation Button */}
        <div className="flex flex-col items-center justify-center my-6">
          <button
            onClick={toggleListening}
            className={`relative p-5 rounded-full text-white shadow-xl transition-all duration-300 transform active:scale-95 ${
              isListening
                ? 'bg-rose-600 shadow-rose-600/50 ring-8 ring-rose-500/20 animate-pulse'
                : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/40 ring-4 ring-blue-500/20'
            }`}
          >
            {isListening ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
          </button>
          <span className="mt-3 text-sm font-medium text-slate-300">
            {isListening ? 'Listening... Speak now!' : 'Click to Speak a Command'}
          </span>
          {transcript && (
            <p className="mt-1 text-xs text-blue-400 font-mono italic max-w-sm text-center">
              "{transcript}"
            </p>
          )}
        </div>

        {/* Quick Voice Command Prompts */}
        <div className="mt-4 pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Or Try A Voice Prompt (One-Click)
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {quickCommands.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleVoiceCommand(q.cmd)}
                className="text-left text-xs p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 hover:border-blue-500/50 border border-slate-700/40 text-slate-300 hover:text-white transition group flex items-center justify-between"
              >
                <span>{q.label}</span>
                <span className="opacity-0 group-hover:opacity-100 text-blue-400 transition">→</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
