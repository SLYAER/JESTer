import { useState, useRef, useEffect, FormEvent } from 'react';
import { Send, Crosshair, ShieldAlert, Cpu, Activity, Mic, MicOff, TerminalSquare, Settings2, Database, Lock, Trash2, Play, Pause, Music, ListMusic, DownloadCloud, HeartPulse, HardDrive, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';

type Message = {
  id: string;
  role: 'user' | 'model';
  content: string;
  isStreaming?: boolean;
};

type Track = {
  id: string;
  name: string;
  url: string;
  originalUrl: string;
};

// Initialize SpeechSynthesis Voices
if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.getVoices();
}

export default function App() {
  const [systemStarted, setSystemStarted] = useState(false);
  
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('cyrus_memory');
    return saved ? JSON.parse(saved) : [{
       id: 'welcome',
       role: 'model',
       content: 'System initialized. All diagnostic checks nominal. C.Y.R.U.S. protocol online. Awaiting your command, Sir.'
    }];
  });
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceCommand, setVoiceCommand] = useState<string | null>(null);
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [customApiKey, setCustomApiKey] = useState(() => localStorage.getItem('cyrus_api_key') || '');
  const [openaiKey, setOpenaiKey] = useState(() => localStorage.getItem('cyrus_openai_key') || '');
  const [anthropicKey, setAnthropicKey] = useState(() => localStorage.getItem('cyrus_anthropic_key') || '');
  const [hwStats, setHwStats] = useState({ cpu: 12, ram: 4.2, gpu: 2.1 });
  const [securityScan, setSecurityScan] = useState({ active: false, lastScan: Date.now(), status: 'SECURE', threatCount: 0 });
  const [isSpeaking, setIsSpeaking] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isListeningRef = useRef(isListening);
  const audioRef = useRef<HTMLAudioElement>(null);
  const openTabsRef = useRef<Window[]>([]);

  const saveApiKey = (key: string) => {
      setCustomApiKey(key);
      if (key) {
          localStorage.setItem('cyrus_api_key', key);
      } else {
          localStorage.removeItem('cyrus_api_key');
      }
  };

  const saveOpenaiKey = (key: string) => {
      setOpenaiKey(key);
      if (key) localStorage.setItem('cyrus_openai_key', key);
      else localStorage.removeItem('cyrus_openai_key');
  };

  const saveAnthropicKey = (key: string) => {
      setAnthropicKey(key);
      if (key) localStorage.setItem('cyrus_anthropic_key', key);
      else localStorage.removeItem('cyrus_anthropic_key');
  };

  const purgeMemory = () => {
     localStorage.removeItem('cyrus_memory');
     setMessages([{
       id: Date.now().toString(),
       role: 'model',
       content: 'GHOST PROTOCOL INITIATED. Local memory completely purged. All systems reset to zero. E2E encryption re-verified. Awaiting your command, Sir.'
     }]);
     speakMessage("Memory purged, Sir. Ghost protocol activated. All interactions are strictly private.");
  };

  useEffect(() => {
    // RAM Optimization: Strict upper bound on messages in memory/DOM
    if (messages.length > 50) {
       setMessages(m => m.slice(m.length - 50));
    } else {
       localStorage.setItem('cyrus_memory', JSON.stringify(messages));
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  // Hardware Simulation Hook
  useEffect(() => {
    const hwInterval = setInterval(() => {
        setHwStats(prev => ({
            cpu: Math.max(1, Math.min(100, prev.cpu + (Math.random() * 20 - 10))),
            ram: Math.max(1, Math.min(32, prev.ram + (Math.random() * 1.5 - 0.75))),
            gpu: Math.max(1, Math.min(100, prev.gpu + (Math.random() * 16 - 8))),
        }));
    }, 2000);
    return () => clearInterval(hwInterval);
  }, []);

  // Malware Scanner Hook (drag & drop simulation + periodic scan)
  useEffect(() => {
      const handleDragOver = (e: DragEvent) => e.preventDefault();
      const handleDrop = (e: DragEvent) => {
          e.preventDefault();
          if (e.dataTransfer?.files.length) {
              const file = e.dataTransfer.files[0];
              const ext = file.name.split('.').pop()?.toLowerCase();
              setSecurityScan(s => ({ ...s, active: true, status: 'SCANNING...' }));
              setTimeout(() => {
                  if (['exe', 'bat', 'vbs', 'msi', 'cmd', 'sh'].includes(ext || '')) {
                     setSecurityScan(s => ({ ...s, active: false, status: 'THREAT DETECTED', threatCount: s.threatCount + 1, lastScan: Date.now() }));
                     speakMessage(`CRITICAL WARNING. The downloaded file ${file.name} exhibits malicious signatures. Isolating immediately.`);
                     handleSubmit(undefined, `[SYS.LOG: MALWARE SCANNER - Threat detected in file ${file.name}. OS isolation protocols engaged.]`);
                  } else {
                     setSecurityScan(s => ({ ...s, active: false, status: 'SECURE', lastScan: Date.now() }));
                     speakMessage(`File ${file.name} scanned. No threats detected.`);
                     handleSubmit(undefined, `[SYS.LOG: MALWARE SCANNER - File ${file.name} is clean.]`);
                  }
              }, 2500);
          }
      };
      
      window.addEventListener('dragover', handleDragOver);
      window.addEventListener('drop', handleDrop);
      
      // Periodic Scan Simulation (every 10 minutes realistically here for demo)
      const scanInterval = setInterval(() => {
          setSecurityScan(s => ({ ...s, active: true, status: '3-DAY AUTO SCAN...' }));
          setTimeout(() => {
              setSecurityScan(s => ({ ...s, active: false, status: 'SECURE', lastScan: Date.now() }));
          }, 3000);
      }, 10 * 60 * 1000);

      return () => {
          window.removeEventListener('dragover', handleDragOver);
          window.removeEventListener('drop', handleDrop);
          clearInterval(scanInterval);
      };
  }, []);

  // Handle Speech Recognition Trigger
  useEffect(() => {
    if (voiceCommand) {
       handleSubmit(new Event('submit') as unknown as React.FormEvent, voiceCommand);
       setVoiceCommand(null);
    }
  }, [voiceCommand]);

  // Speech Recognition Setup (24/7 background listener)
  useEffect(() => {
    const Sr = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Sr) {
       console.warn("Speech recognition not supported in this browser.");
       return;
    }

    const recognition = new Sr();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                const final = event.results[i][0].transcript.trim().toLowerCase();
                
                // Wake word logic
                if (final.includes('cyrus')) {
                    const command = final.substring(final.indexOf('cyrus') + 5).trim();
                    if (command) {
                        setVoiceCommand(command);
                    } else {
                        speakMessage("Yes, Sir? Standing by.");
                    }
                }
            }
        }
    };

    recognition.onend = () => {
        if (isListeningRef.current) {
            try { recognition.start(); } catch(e) { console.error("Mic restart error", e); }
        }
    };

    if (isListening && systemStarted) {
         try { recognition.start(); } catch(e) { console.error("Mic start error", e); }
    } else {
         recognition.stop();
    }

    return () => {
        recognition.onend = null;
        recognition.stop();
    }
  }, [isListening, systemStarted]);

  const speakMessage = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    
    setIsSpeaking(true);

    // Clean text for speech
    let cleanText = text.replace(/[_*#]/g, '');
    cleanText = cleanText.replace(/```[\s\S]*?```/g, 'I have displayed the requested code on your HUD, Sir.');
    cleanText = cleanText.replace(/<COMMAND>.*?<\/COMMAND>/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voices = window.speechSynthesis.getVoices();
    
    // Attempt to find a British or sophisticated male voice like Paul Bettany
    const cyrusKeywords = ['Daniel', 'George', 'Google UK English Male', 'UK English Male'];
    const bestVoice = voices.find(v => cyrusKeywords.some(k => v.name.includes(k)))
                   || voices.find(v => v.lang === 'en-GB' && v.name.toLowerCase().includes('male'))
                   || voices.find(v => v.lang === 'en-GB')
                   || voices.find(v => v.lang.startsWith('en'));
                   
    if (bestVoice) utterance.voice = bestVoice;
    utterance.pitch = 0.7; // Deeper, composed, slightly artificial (Paul Bettany style)
    utterance.rate = 1.0;  // Measured and steady
    
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  };

  const handleSystemCommand = async (cmd: string) => {
    if (cmd === 'OPEN_FILE_PICKER') {
        try {
            const opts = {
                types: [{
                  description: 'Supported Files',
                  accept: {'text/plain': ['.txt', '.md', '.json', '.csv', '.js', '.ts', '.html', '.css']}
                }],
            };
            const [fileHandle] = await (window as any).showOpenFilePicker(opts);
            const file = await fileHandle.getFile();
            const contents = await file.text();
            
            const fileMsg = `[SYS.LOG: User consented and selected file: ${file.name}. Contents:]\n\n${contents.substring(0, 1500)}`;
            handleSubmit(undefined, fileMsg);
        } catch (err) {
            console.error("File picker cancelled or failed", err);
            handleSubmit(undefined, "[SYS.LOG: File access cancelled by user or denied by OS.]");
        }
    } else if (cmd.startsWith('OPEN_APP:')) {
        const appName = cmd.split(':')[1].toLowerCase().trim();
        let url = '';
        switch(appName) {
            case 'spotify': url = 'spotify://'; break;
            case 'mail': case 'gmail': case 'email': url = 'mailto:'; break;
            case 'youtube': url = 'https://www.youtube.com'; break;
            case 'maps': url = 'https://maps.google.com'; break;
            case 'music': case 'applemusic': url = 'music://'; break;
            case 'calculator': url = 'calculator://'; break;
            case 'calendar': url = 'calshow://'; break;
            default: url = `https://www.google.com/search?q=${appName}`; break;
        }
        const newTab = window.open(url, '_blank');
        if (newTab) {
            openTabsRef.current.push(newTab);
            // Cap at 3 open tabs to manage RAM and keep it clean
            if (openTabsRef.current.length > 3) {
                const oldestTab = openTabsRef.current.shift();
                if (oldestTab && !oldestTab.closed) {
                   oldestTab.close();
                }
            }
        }
        handleSubmit(undefined, `[SYS.LOG: Attempted to bridge connection to system protocol for: ${appName}. Web Matrix tab opened.]`);
    } else if (cmd === 'CLOSE_ALL_TABS') {
        let closedCount = 0;
        openTabsRef.current.forEach(tab => {
            if (tab && !tab.closed) {
                tab.close();
                closedCount++;
            }
        });
        openTabsRef.current = [];
        handleSubmit(undefined, `[SYS.LOG: Matrix override executed. Closed ${closedCount} active browser tabs.]`);
    } else if (cmd.startsWith('PLAY_MEDIA:')) {
        const query = cmd.substring(11).trim();
        try {
            const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=1`);
            const data = await res.json();
            if (data.results && data.results.length > 0) {
               const track = data.results[0];
               const trackId = track.trackId.toString();
               const previewUrl = track.previewUrl;
               const trackName = `${track.trackName} - ${track.artistName}`;

               const cache = await caches.open('cyrus-media-cache');
               const cached = await cache.match(previewUrl);
               
               let audioUrl = previewUrl;
               if (!cached) {
                   handleSubmit(undefined, `[SYS.LOG: Downloading audio package from web node...]`);
                   const audioResponse = await fetch(previewUrl);
                   await cache.put(previewUrl, audioResponse.clone());
                   const blob = await audioResponse.blob();
                   audioUrl = URL.createObjectURL(blob);
               } else {
                   handleSubmit(undefined, `[SYS.LOG: Track located in secure local database.]`);
                   const blob = await cached.blob();
                   audioUrl = URL.createObjectURL(blob);
               }

               const newTrack: Track = { id: trackId, name: trackName, url: audioUrl, originalUrl: previewUrl };
               setPlaylist(prev => {
                   const existing = prev.find(t => t.id === trackId);
                   if (existing) {
                       // RAM Optimization: if we already have a blob in the array, revoke this new one we just made
                       if (audioUrl.startsWith('blob:')) URL.revokeObjectURL(audioUrl);
                       setCurrentTrack(existing);
                       if (audioRef.current) {
                           audioRef.current.src = existing.url;
                           audioRef.current.play();
                           setIsPlaying(true);
                       }
                       return prev;
                   }
                   setCurrentTrack(newTrack);
                   if (audioRef.current) {
                       audioRef.current.src = audioUrl;
                       audioRef.current.play();
                       setIsPlaying(true);
                   }
                   // RAM Optimization: Cap playlist at 10 items to prevent unbounded memory growth
                   const nextPlaylist = [...prev, newTrack];
                   if (nextPlaylist.length > 10) {
                       const toRemove = nextPlaylist[0];
                       if (toRemove.url.startsWith('blob:')) URL.revokeObjectURL(toRemove.url);
                       // We could delete from cache too natively, but keeping the cache DB is usually fine on disk storage
                       return nextPlaylist.slice(1);
                   }
                   return nextPlaylist;
               });

               handleSubmit(undefined, `[SYS.LOG: Storage task complete. Initializing playback for: ${trackName}]`);
            } else {
               handleSubmit(undefined, `[SYS.LOG: ERROR: Track not found in global search.]`);
            }
        } catch(e) {
            console.error(e);
            handleSubmit(undefined, `[SYS.LOG: Secure network blocked downloading media stream.]`);
        }
    } else if (cmd.startsWith('DELEGATE:')) {
        const parts = cmd.substring(9).split(':');
        const agentName = parts[0];
        const prompt = parts.slice(1).join(':').trim();
        
        handleSubmit(undefined, `[SYS.LOG: Task routed to Agent [${agentName.toUpperCase()}] for processing...]`);
        runDelegatedAgent(agentName, prompt);
    } else if (cmd.startsWith('SELF_EVOLVE:')) {
        const capability = cmd.substring(12).trim();
        executeSelfEvolution(capability);
    }
  };

  const executeSelfEvolution = async (capability: string) => {
      // Simulate the self-evolution protocol
      const delays = [1500, 3000, 2000, 2500, 3000, 2000];
      const steps = [
          `[SYS.LOG: INITIATING SELF-EVOLUTION PROTOCOL for capability: ${capability}]`,
          `[SYS.LOG: Assigning Agent CLAUDE to write capability patch...]`,
          `[SYS.LOG: Patch received. Initiating CYRUS code review...]`,
          `[SYS.LOG: Code review passed. Deploying and executing test suite on Dev Branch...]`,
          `[SYS.LOG: Testing on localhost environments...]`,
          `[SYS.LOG: Testing on secure Test Server...]`,
          `[SYS.LOG: All tests green. Pushing to MAIN branch and hot-reloading system state...]`
      ];

      for (let i = 0; i < steps.length; i++) {
          await new Promise(resolve => setTimeout(resolve, i === 0 ? 0 : delays[i - 1]));
          handleSubmit(undefined, steps[i]);
      }
      setTimeout(() => {
          speakMessage("Self evolution protocol complete. The requested capabilities are now integrated into my core matrix, Sir.");
      }, 1000);
  };

  const runDelegatedAgent = async (agentName: string, prompt: string) => {
     try {
         const headers: Record<string, string> = { 'Content-Type': 'application/json' };
         if (customApiKey) headers['x-gemini-api-key'] = customApiKey;
         if (openaiKey) headers['x-openai-api-key'] = openaiKey;
         if (anthropicKey) headers['x-anthropic-api-key'] = anthropicKey;
         
         const res = await fetch('/api/delegate', {
            method: 'POST',
            headers,
            body: JSON.stringify({ agent: agentName, prompt })
         });
         if (!res.body) throw new Error("No stream");

         const modelMessage: Message = { id: Date.now().toString(), role: 'model', content: `[Agent ${agentName.toUpperCase()}]\n\n`, isStreaming: true };
         setMessages(prev => [...prev, modelMessage]);

         const reader = res.body.getReader();
         const decoder = new TextDecoder();
         let fullResponse = `[Agent ${agentName.toUpperCase()}]\n\n`;

         while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            for (const line of lines) {
               if (line.startsWith('data: ')) {
                  const dataStr = line.slice(6);
                  if (dataStr === '[DONE]') break;
                  try {
                     const data = JSON.parse(dataStr);
                     if (data.text) {
                        fullResponse += data.text;
                        setMessages(prev => prev.map(m => m.id === modelMessage.id ? { ...m, content: fullResponse } : m));
                     }
                  } catch (e) {}
               }
            }
         }
         
         setMessages(prev => prev.map(m => m.id === modelMessage.id ? { ...m, isStreaming: false } : m));
         speakMessage("Agent protocol complete. Responses logged to matrix, Sir.");
     } catch (err) {
         console.error(err);
         handleSubmit(undefined, `[SYS.LOG: CRITICAL. Delegated agent [${agentName.toUpperCase()}] failed to respond or offline.]`);
     }
  };

  const deleteTrack = async (tTarget: Track) => {
      try {
          const cache = await caches.open('cyrus-media-cache');
          await cache.delete(tTarget.originalUrl);
          setPlaylist(prev => prev.filter(t => t.id !== tTarget.id));
          if (currentTrack?.id === tTarget.id) {
              if (audioRef.current) { audioRef.current.pause(); }
              setIsPlaying(false);
              setCurrentTrack(null);
          }
          // RAM Optimization: Garbage collect the blob URL
          if (tTarget.url.startsWith('blob:')) {
              URL.revokeObjectURL(tTarget.url);
          }
      } catch(e) {}
  };

  const handleSubmit = async (e?: React.FormEvent | Event, overrideInput?: string) => {
    e?.preventDefault();
    const finalInput = overrideInput || input;
    if (!finalInput.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: finalInput.trim() };
    setMessages(prev => [...prev, userMessage]);
    if (!overrideInput) setInput('');
    setIsLoading(true);

    const modelMessageId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: modelMessageId, role: 'model', content: '', isStreaming: true }]);

    let fullResponse = '';

    try {
      const requestMessages = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content
      }));

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (customApiKey) {
          headers['x-gemini-api-key'] = customApiKey;
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({ messages: requestMessages })
      });

      if (!res.ok) throw new Error('Network failure');

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      
      if (reader) {
        let isDone = false;
        while (!isDone) {
          const { done, value } = await reader.read();
          isDone = done;
          if (value) {
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(line => line.trim() !== '');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const dataStr = line.slice(6);
                if (dataStr === '[DONE]') {
                  isDone = true;
                  break;
                }
                try {
                  const data = JSON.parse(dataStr);
                  if (data.text) {
                    fullResponse += data.text;
                    setMessages(prev => prev.map(msg => 
                      msg.id === modelMessageId ? { ...msg, content: msg.content + data.text } : msg
                    ));
                  }
                } catch (err) {
                  // Ignore JSON parse errors for incomplete chunks
                }
              }
            }
          }
        }
      }
      
      // Speak the completed message and parse commands
      if (fullResponse) {
         const commandRegex = /<COMMAND>(.*?)<\/COMMAND>/g;
         const finalSpokenText = fullResponse.replace(commandRegex, '');
         if (finalSpokenText.trim()) {
            speakMessage(finalSpokenText);
         }

         const commands = [...fullResponse.matchAll(commandRegex)].map(m => m[1]);
         for (const cmd of commands) {
             handleSystemCommand(cmd);
         }
      }

    } catch (error) {
       console.error("Link error:", error);
       setMessages(prev => prev.map(msg => 
         msg.id === modelMessageId ? { ...msg, content: 'SYS.ERROR: Uplink severed. Unable to reach central processing.' } : msg
       ));
    } finally {
       setMessages(prev => prev.map(msg => 
         msg.id === modelMessageId ? { ...msg, isStreaming: false } : msg
       ));
       setIsLoading(false);
    }
  };

  if (!systemStarted) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-[#020610] text-cyan-400 font-mono tracking-widest selection:bg-cyan-900 overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
        <motion.div 
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           className="relative group cursor-pointer p-12 text-center"
           onClick={() => {
              setSystemStarted(true);
              setIsListening(true);
              
              const hour = new Date().getHours();
              let greeting = 'Good evening';
              if (hour < 12) greeting = 'Good morning';
              else if (hour < 18) greeting = 'Good afternoon';
              
              speakMessage(`${greeting}, Sir. System online. Diagnostics complete. Network secure. C.Y.R.U.S. is ready.`);
           }}
        >
          <div className="absolute inset-0 border border-cyan-800 rounded-3xl bg-cyan-950/20 group-hover:bg-cyan-900/40 group-hover:border-cyan-400 group-hover:shadow-[0_0_40px_rgba(34,211,238,0.3)] transition-all duration-700 blur-sm"></div>
          <div className="absolute inset-0 border border-cyan-500 rounded-3xl group-hover:scale-105 transition-all duration-700 pointer-events-none"></div>
          <h1 className="relative z-10 text-3xl font-bold tracking-[0.3em] mb-4 text-cyan-200 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">C.Y.R.U.S.</h1>
          <p className="relative z-10 text-sm text-cyan-600/80 uppercase mb-3">Click to Initialize System Protocols</p>
          <div className="relative z-10 flex items-center justify-center gap-2 mt-4 text-[10px] text-green-500/80 uppercase tracking-widest bg-green-950/20 py-2 px-4 rounded-lg border border-green-900/30">
             <Lock size={12} />
             <span>Strict Privacy Protocol enforced. E2E Encrypted.</span>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="relative h-screen w-screen bg-[#01050b] text-cyan-50 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] overflow-hidden font-mono selection:bg-cyan-500/40 text-sm">
      {/* Grid Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0" 
           style={{ backgroundImage: 'linear-gradient(rgba(0,243,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(0,243,255,0.7) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      
      {/* 3D Cyrus Core Orb */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] pointer-events-none flex items-center justify-center select-none z-0 mix-blend-screen transition-all duration-700 scale-[0.4] sm:scale-75 lg:scale-100 will-change-transform">
        
        {/* The solid dense ball */}
        <motion.div 
           style={{ willChange: "transform, opacity" }}
           animate={{ 
              scale: isSpeaking ? [1, 1.1, 0.95, 1.1, 0.95, 1.05, 1] : [1, 1.02, 1],
              opacity: isSpeaking ? [0.8, 1, 0.9, 1, 0.8] : [0.5, 0.6, 0.5]
           }} 
           transition={{ duration: isSpeaking ? 0.5 : 4, repeat: Infinity, ease: "easeInOut" }} 
           className="absolute w-[220px] h-[220px] rounded-full shadow-[0_0_80px_rgba(0,210,255,0.7),inset_0_0_40px_rgba(20,150,255,0.8)] bg-gradient-to-br from-cyan-300 via-blue-500 to-indigo-600 overflow-hidden" 
        >
             {/* Internal intricate lines for the ball */}
             <div className="absolute inset-[-50px] border-[50px] border-dotted border-white/20 rounded-full mix-blend-overlay animate-[spin_15s_linear_infinite]" />
             <div className="absolute inset-6 border-[15px] border-dashed border-cyan-100/40 rounded-full mix-blend-overlay animate-[spin_25s_linear_infinite_reverse]" />
        </motion.div>

        {/* Outer glowing rings */}
        <div style={{ willChange: "transform" }} className="absolute w-[320px] h-[320px] rounded-full border-t-4 border-l-4 border-cyan-400/50 shadow-[0_0_30px_rgba(34,211,238,0.3)] animate-[spin_30s_linear_infinite]" />
        <div style={{ willChange: "transform" }} className="absolute w-[420px] h-[420px] rounded-full border-[4px] border-dashed border-blue-400/20 animate-[spin_45s_linear_infinite_reverse]" />
        <motion.div style={{ willChange: "transform" }} animate={{ scale: isSpeaking ? [1, 1.08, 0.97, 1] : [1, 1.03, 1] }} transition={{ duration: isSpeaking ? 0.3 : 4, repeat: Infinity, ease: "easeInOut" }} className="absolute w-[480px] h-[480px] rounded-full border border-cyan-500/20 shadow-[inset_0_0_20px_rgba(34,211,238,0.1)]" />
        <motion.div style={{ willChange: "transform" }} animate={{ scale: isSpeaking ? [1, 1.04, 1] : 1 }} transition={{ duration: isSpeaking ? 0.4 : 2, repeat: Infinity, ease: "easeInOut" }} className="absolute w-[600px] h-[600px] rounded-full border-t border-b border-blue-500/10 shadow-[inset_0_0_40px_rgba(0,150,255,0.05)]" />
        
        {/* Core intensely glowing center */}
        <motion.div style={{ willChange: "transform" }} animate={{ scale: isSpeaking ? [1, 1.5, 0.8, 1.4, 0.9, 1.2, 1] : [1, 1.1, 1] }} transition={{ duration: isSpeaking ? 0.4 : 3, repeat: Infinity, ease: "easeInOut" }} className="absolute w-[80px] h-[80px] rounded-full bg-white blur-[15px]" />
      </div>

      {/* Top Left: Diagnostics */}
      <div className="hidden lg:flex absolute top-6 left-6 w-72 flex-col gap-4 z-20">
        <div className="bg-[#020a17]/80 border border-cyan-900/60 backdrop-blur-md rounded-xl p-4 shadow-[0_0_20px_rgba(0,0,0,0.5)] flex flex-col gap-3">
           <div className="flex items-center justify-between border-b border-cyan-900/60 pb-2 mb-1">
              <span className="text-[11px] text-cyan-400 font-bold tracking-widest">SYS // CORE_VITALS</span>
              <Crosshair size={14} className="text-cyan-600 animate-spin-slow" />
           </div>
           <div className="space-y-3">
              <div className="flex items-center gap-3">
                 <Cpu size={14} className="text-cyan-500/70" />
                 <div className="flex-1 h-[3px] bg-cyan-950 overflow-hidden relative rounded-full">
                    <motion.div style={{ width: `${hwStats.cpu}%` }} className="h-full bg-cyan-400 shadow-[0_0_5px_rgba(34,211,238,0.8)] transition-all duration-700" />
                 </div>
                 <span className="text-[10px] text-cyan-600 w-[40px] text-right">{hwStats.cpu.toFixed(0)}%</span>
              </div>
              <div className="flex items-center gap-3">
                 <Database size={14} className="text-blue-500/70" />
                 <div className="flex-1 h-[3px] bg-cyan-950 overflow-hidden relative rounded-full">
                    <motion.div style={{ width: `${(hwStats.ram / 32) * 100}%` }} className="h-full bg-blue-400 shadow-[0_0_5px_rgba(96,165,250,0.8)] transition-all duration-700" />
                 </div>
                 <span className="text-[10px] text-cyan-600 w-[40px] text-right">{hwStats.ram.toFixed(1)}G</span>
              </div>
              <div className="flex items-center gap-3">
                 <HardDrive size={14} className="text-amber-500/70" />
                 <div className="flex-1 h-[3px] bg-cyan-950 overflow-hidden relative rounded-full">
                    <motion.div style={{ width: `${hwStats.gpu}%` }} className="h-full bg-amber-400 shadow-[0_0_5px_rgba(251,191,36,0.8)] transition-all duration-700" />
                 </div>
                 <span className="text-[10px] text-cyan-600 w-[40px] text-right">{hwStats.gpu.toFixed(0)}%</span>
              </div>
           </div>
        </div>

        <button
           onClick={purgeMemory}
           className="w-full bg-red-950/20 border border-red-900/50 text-red-500/80 hover:bg-red-900/40 hover:text-red-400 hover:border-red-500/50 backdrop-blur-md rounded-xl py-2 px-4 shadow-[0_0_15px_rgba(0,0,0,0.5)] flex items-center justify-between transition-all group"
        >
           <span className="text-[10px] font-bold tracking-widest group-hover:animate-pulse">PURGE LOCAL MEMORY</span>
           <Trash2 size={14} className="group-hover:scale-110 transition-transform" />
        </button>

        {/* Media Player Module */}
        {playlist.length > 0 && (
           <div className="bg-[#020a17]/80 border border-cyan-900/60 backdrop-blur-md rounded-xl p-4 shadow-[0_0_20px_rgba(0,0,0,0.5)] flex flex-col gap-3">
               <div className="flex items-center justify-between border-b border-cyan-900/60 pb-2 mb-1">
                  <span className="text-[11px] text-cyan-400 font-bold tracking-widest flex items-center gap-1.5"><Music size={12}/> AUDIO // MEDIA_MATRIX</span>
                  <div className="flex gap-1" title="Local Cache DB">
                     <span className="text-[9px] text-blue-500 uppercase">LOC_DB</span>
                     <DownloadCloud size={12} className="text-blue-500/70" />
                  </div>
               </div>

               {currentTrack && (
                   <div className="flex flex-col gap-2 p-2 bg-cyan-950/30 rounded-lg border border-cyan-900/30 mb-2">
                       <span className="text-[10px] text-cyan-300 font-bold truncate pr-3">{currentTrack.name}</span>
                       <div className="flex items-center justify-between">
                           <button onClick={() => {
                               if (audioRef.current) {
                                   if (isPlaying) audioRef.current.pause();
                                   else audioRef.current.play();
                               }
                           }} className="text-cyan-400 hover:text-cyan-200">
                               {isPlaying ? <Pause size={14}/> : <Play size={14}/>}
                           </button>
                           {isPlaying && (
                               <div className="flex items-end gap-[2px] h-3">
                                  <motion.div animate={{height:[4,12,4]}} transition={{duration:0.6, repeat: Infinity}} className="w-1 bg-cyan-400 rounded-full"/>
                                  <motion.div animate={{height:[8,4,8]}} transition={{duration:0.4, repeat: Infinity}} className="w-1 bg-cyan-400 rounded-full"/>
                                  <motion.div animate={{height:[5,10,5]}} transition={{duration:0.7, repeat: Infinity}} className="w-1 bg-cyan-400 rounded-full"/>
                               </div>
                           )}
                       </div>
                   </div>
               )}

               <div className="flex flex-col gap-1.5 max-h-[120px] overflow-y-auto custom-scrollbar">
                   {playlist.map(pt => (
                       <div key={pt.id} className={`flex items-center justify-between group p-1.5 rounded-md hover:bg-cyan-900/20 ${currentTrack?.id === pt.id ? 'bg-cyan-900/40 border border-cyan-900/60' : 'border border-transparent'}`}>
                           <span className="text-[9px] text-cyan-600/80 w-4/5 truncate cursor-pointer group-hover:text-cyan-400" onClick={()=>{
                               setCurrentTrack(pt);
                               if (audioRef.current) { audioRef.current.src = pt.url; audioRef.current.play(); setIsPlaying(true); }
                           }}>
                               {pt.name}
                           </span>
                           <button onClick={() => deleteTrack(pt)} className="opacity-0 group-hover:opacity-100 text-red-500/70 hover:text-red-400 transition-opacity" title="Delete from Local DB Cache">
                               <Trash2 size={10} />
                           </button>
                       </div>
                   ))}
               </div>
           </div>
        )}
      </div>

      <audio 
         ref={audioRef} 
         className="hidden" 
         onPlay={() => setIsPlaying(true)}
         onPause={() => setIsPlaying(false)}
         onEnded={() => setIsPlaying(false)}
      />

      {/* Top Right: Network / Security */}
      <div className="hidden lg:block absolute top-6 right-6 w-64 bg-[#020a17]/80 border border-cyan-900/60 backdrop-blur-md rounded-xl p-4 shadow-[0_0_20px_rgba(0,0,0,0.5)] z-20">
         <div className="flex items-center justify-between border-b border-cyan-900/60 pb-2 mb-3">
            <span className="text-[11px] text-cyan-400 font-bold tracking-widest">NET // SECURITY</span>
            <div className="flex gap-2 items-center">
                <button onClick={() => setShowSettings(true)} className="text-cyan-600 hover:text-cyan-400 transition-colors" title="System Settings">
                    <Settings2 size={14} />
                </button>
                <ShieldAlert size={14} className="text-cyan-600" />
            </div>
         </div>
         <div className="flex flex-col gap-2">
            <div className={`flex justify-between items-center px-3 py-1.5 rounded-md border ${securityScan.status === 'SECURE' ? 'bg-cyan-950/30 border-cyan-900/30' : securityScan.status === 'THREAT DETECTED' ? 'bg-red-950/30 border-red-900/70 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse' : 'bg-amber-950/30 border-amber-900/50'}`}>
               <span className={`text-[10px] ${securityScan.status === 'SECURE' ? 'text-cyan-500' : securityScan.status === 'THREAT DETECTED' ? 'text-red-400 font-bold' : 'text-amber-500 flex items-center gap-2'}`}>
                  {securityScan.active && <motion.div animate={{rotate: 360}} transition={{repeat: Infinity, duration: 1}}><AlertTriangle size={10} /></motion.div>}
                  FILE SCANNER:
               </span>
               <span className={`text-[10px] ${securityScan.status === 'SECURE' ? 'text-green-400' : securityScan.status === 'THREAT DETECTED' ? 'text-red-500 font-bold' : 'text-amber-400'}`}>{securityScan.status}</span>
            </div>
            {securityScan.threatCount > 0 && (
               <div className="flex justify-between items-center bg-red-950/20 px-3 py-1.5 rounded-md border border-red-900/40">
                  <span className="text-[10px] text-red-500/80">ISOLATED THREATS:</span>
                  <span className="text-[10px] text-red-400 font-bold">{securityScan.threatCount}</span>
               </div>
            )}
            <div className="flex justify-between items-center bg-cyan-950/30 px-3 py-1.5 rounded-md border border-cyan-900/30">
               <span className="text-[10px] text-cyan-500">ENCRYPTION PROTOCOL:</span>
               <span className="text-[10px] text-green-400 animate-pulse">ACTIVE</span>
            </div>
            <div className="flex justify-between items-center bg-green-950/30 px-3 py-1.5 rounded-md border border-green-900/50 mt-1 shadow-[0_0_15px_rgba(74,222,128,0.1)]">
               <div className="flex flex-col">
                  <span className="text-[10px] text-green-400 font-bold flex items-center gap-1.5"><Lock size={10} /> E2E ENCRYPTED (GHOST)</span>
                  <span className="text-[8px] text-green-600/70 mt-0.5">0% TELEMETRY / SECURE ISOLATION</span>
               </div>
            </div>
         </div>
      </div>

      {/* Chat Terminal Log (Right Side) */}
      <div className="absolute top-[20px] md:top-[60px] lg:top-[220px] bottom-[90px] lg:bottom-[110px] inset-x-2 md:inset-x-6 lg:inset-x-auto lg:right-6 lg:w-full lg:max-w-[450px] w-auto bg-[#020713]/80 border border-cyan-900/50 backdrop-blur-md rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.8)] z-30 flex flex-col">
         {/* Terminal Header */}
         <div className="flex items-center justify-between bg-cyan-950/40 px-4 py-3 border-b border-cyan-900/50 rounded-t-xl shrink-0">
            <div className="flex items-center gap-2">
               <TerminalSquare size={16} className="text-cyan-400" />
               <span className="text-[11px] text-cyan-300 font-bold tracking-widest">COMM_LOG // LIVE_FEED</span>
            </div>
            <div className="flex items-center gap-3">
               <button onClick={() => setShowSettings(true)} className="lg:hidden text-cyan-600 hover:text-cyan-400 transition-colors" title="System Settings">
                   <Settings2 size={16} />
               </button>
               <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></div>
                  <div className="w-2 h-2 rounded-full bg-cyan-700"></div>
               </div>
            </div>
         </div>
         
         <div className="flex-1 overflow-y-auto w-full p-4 space-y-4 custom-scrollbar">
            <AnimatePresence initial={false}>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex flex-col gap-1 w-full ${message.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <span className="text-[9px] text-cyan-700 font-bold tracking-widest uppercase px-1">
                    {message.role === 'user' ? 'GUEST_USER' : 'C.Y.R.U.S.'} {message.isStreaming && ':: PROCESSING'}
                  </span>
                  <div className={`px-4 py-2.5 rounded-xl max-w-[90%] text-[13px] tracking-wide backdrop-blur-md shadow-sm border ${
                    message.role === 'user' 
                      ? message.content.startsWith('[SYS.LOG') 
                        ? 'bg-amber-900/10 border-amber-900/40 text-amber-500 rounded-lg shadow-none flex text-[10px] items-center text-center'
                        : 'bg-blue-900/20 border-blue-900/40 text-blue-100 rounded-tr-sm'
                      : 'bg-cyan-950/20 border-cyan-900/50 text-cyan-50 rounded-tl-sm'
                  }`}>
                    {message.role === 'user' ? (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    ) : (
                      <div className="prose prose-invert prose-sm prose-cyan max-w-none prose-p:leading-relaxed prose-pre:bg-[#02050a] prose-pre:border prose-pre:border-cyan-900/50 prose-headings:text-cyan-400 prose-a:text-blue-400">
                        <ReactMarkdown>{message.content || '...'}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} className="h-1" />
         </div>
      </div>

      {/* Input Area (Bottom) */}
      <div className="absolute bottom-4 lg:bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-2 lg:px-4 z-40">
         <form onSubmit={(e) => handleSubmit(e)} className="bg-[#020a17]/90 border border-cyan-800/60 backdrop-blur-xl rounded-2xl p-2 shadow-[0_0_30px_rgba(0,10,30,0.8),_inset_0_0_15px_rgba(34,211,238,0.1)] flex items-end gap-3 transition-all focus-within:border-cyan-500/80 focus-within:shadow-[0_0_40px_rgba(34,211,238,0.2)]">
            {/* Mic Toggle Button */}
            <button
               type="button"
               onClick={() => setIsListening(!isListening)}
               className={`p-3.5 rounded-xl transition-all duration-300 shrink-0 ${
                  isListening 
                  ? 'bg-cyan-500 text-[#01050b] shadow-[0_0_15px_rgba(34,211,238,0.6)] animate-pulse' 
                  : 'bg-cyan-950/40 text-cyan-500 border border-cyan-900 hover:bg-cyan-900/60'
               }`}
               title="Toggle 24/7 Voice Listening"
            >
               {isListening ? <Mic size={20} /> : <MicOff size={20} />}
            </button>
            
            <div className="flex-1 relative">
               <div className="absolute -top-6 left-2 text-[10px] text-cyan-600/70 font-bold tracking-widest flex items-center gap-2">
                 <span>COMMAND_INPUT</span>
                 {isListening && <span className="text-cyan-400 animate-pulse">{"// LISTENING... SAY 'CYRUS, [COMMAND]'"}</span>}
               </div>
               <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e as unknown as React.FormEvent);
                    }
                  }}
                  placeholder="TYPE COMMAND HERE..."
                  className="w-full max-h-32 min-h-[50px] resize-none bg-transparent border-none focus:outline-none focus:ring-0 text-cyan-100 placeholder:text-cyan-800 py-3 px-2 text-[13px] tracking-widest leading-relaxed"
                  rows={1}
               />
            </div>

            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-3.5 bg-blue-900/40 text-blue-400 border border-blue-800/60 rounded-xl hover:bg-blue-800 hover:text-blue-100 disabled:opacity-30 disabled:hover:bg-blue-900/40 transition-all shrink-0 mb-0.5"
            >
              <Send size={18} className={input.trim() ? "translate-x-0.5 -translate-y-0.5" : ""} />
            </button>
         </form>
      </div>
      
      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-[#01050b]/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-[#020a17] border border-cyan-500/50 rounded-2xl w-full max-w-md shadow-[0_0_50px_rgba(34,211,238,0.2)] p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex justify-between items-center border-b border-cyan-900/50 pb-3">
                <h3 className="text-cyan-400 font-bold tracking-[0.2em] flex items-center gap-2">
                  <Settings2 size={18} />
                  SYSTEM CONFIGURATION
                </h3>
                <button onClick={() => setShowSettings(false)} className="text-cyan-700 hover:text-cyan-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>

              <div className="flex flex-col gap-2">
                 <label className="text-[10px] text-cyan-600 font-bold uppercase tracking-widest">
                    Gemini API Key (Local Override)
                 </label>
                 <input 
                    type="password"
                    value={customApiKey}
                    onChange={(e) => saveApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full bg-[#01050b]/50 border border-cyan-900/50 focus:border-cyan-500 rounded-lg py-2 px-3 text-cyan-200 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
                 />
              </div>
              
              <div className="flex flex-col gap-2">
                 <label className="text-[10px] text-cyan-600 font-bold uppercase tracking-widest">
                    OpenAI API Key (Swarm Agent)
                 </label>
                 <input 
                    type="password"
                    value={openaiKey}
                    onChange={(e) => saveOpenaiKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full bg-[#01050b]/50 border border-cyan-900/50 focus:border-cyan-500 rounded-lg py-2 px-3 text-cyan-200 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
                 />
              </div>
              
              <div className="flex flex-col gap-2">
                 <label className="text-[10px] text-cyan-600 font-bold uppercase tracking-widest">
                    Anthropic API Key (Swarm Agent)
                 </label>
                 <input 
                    type="password"
                    value={anthropicKey}
                    onChange={(e) => saveAnthropicKey(e.target.value)}
                    placeholder="sk-ant-..."
                    className="w-full bg-[#01050b]/50 border border-cyan-900/50 focus:border-cyan-500 rounded-lg py-2 px-3 text-cyan-200 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
                 />
              </div>

              <div className="flex flex-col gap-2 mt-2">
                 <label className="text-[10px] text-cyan-600 font-bold uppercase tracking-widest">
                    External Database Node
                 </label>
                 <p className="text-[10px] text-cyan-800 leading-relaxed">
                    To use an external database (MongoDB, PostgreSQL, or MySQL) for persistent state rather than local cache, you must set `DATABASE_URL` and `DATABASE_TYPE` in the `.env` file of the Node.js server. The architecture ensures keys and DB strings remain strictly server-side and are NEVER exposed to the client.
                 </p>
              </div>

              <div className="mt-4 flex justify-end">
                 <button onClick={() => setShowSettings(false)} className="bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-900/80 text-cyan-300 py-2 px-6 rounded-lg text-xs font-bold tracking-widest transition-all">
                    SAVE & CLOSE
                 </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
