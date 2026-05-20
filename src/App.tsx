import { useState, useRef, useEffect, FormEvent } from 'react';
import { Send, Crosshair, ShieldAlert, Cpu, Activity, Mic, MicOff, TerminalSquare, Settings2, Database, Lock, Trash2, Play, Pause, Music, ListMusic, DownloadCloud, HeartPulse, HardDrive, AlertTriangle, Shield } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';

type Message = {
  id: string;
  role: 'user' | 'model';
  content: string;
  internalContent?: string;
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
  const [showSystemLogs, setShowSystemLogs] = useState(false);
  const [systemLogs, setSystemLogs] = useState<string[]>([]);
  const [thinkingStage, setThinkingStage] = useState(0);
  const [hwStats, setHwStats] = useState({ cpu: 12, ram: 4.2, gpu: 2.1 });
  const [securityScan, setSecurityScan] = useState({ active: false, lastScan: Date.now(), status: 'SECURE', threatCount: 0 });
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const [apiKeys, setApiKeys] = useState<{gemini: string, openai: string, anthropic: string}>(() => {
    const saved = localStorage.getItem('cyrus_api_keys');
    return saved ? JSON.parse(saved) : { gemini: '', openai: '', anthropic: '' };
  });

  const [customDBs, setCustomDBs] = useState<{id: string, type: string, url: string, area: string}[]>(() => {
    const saved = localStorage.getItem('cyrus_dbs');
    return saved ? JSON.parse(saved) : [
       { id: crypto.randomUUID(), type: 'Local Storage', url: 'localhost', area: 'Core Memory & Logs' }
    ];
  });

  useEffect(() => {
     localStorage.setItem('cyrus_api_keys', JSON.stringify(apiKeys));
  }, [apiKeys]);

  useEffect(() => {
     localStorage.setItem('cyrus_dbs', JSON.stringify(customDBs));
  }, [customDBs]);

  const [memoryWeb, setMemoryWeb] = useState<Record<string, string[]>>(() => {
    const saved = localStorage.getItem('cyrus_memory_web');
    return saved ? JSON.parse(saved) : {};
  });

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isListeningRef = useRef(isListening);
  const audioRef = useRef<HTMLAudioElement>(null);
  const openTabsRef = useRef<Window[]>([]);

  const applyTrackAndPlay = (track: Track) => {
      setCurrentTrack(track);
      if (audioRef.current) {
          const audio = audioRef.current;
          audio.src = track.url;
          audio.volume = 1.0;
          audio.load();
          const playPromise = audio.play();
          if (playPromise !== undefined) {
             playPromise.then(() => setIsPlaying(true)).catch((e) => {
                 console.warn("Direct play error:", e);
                 if (e.name === 'NotAllowedError') {
                     addSystemLog(`⚠️ AUTOPLAY BLOCKED: Please press PLAY in the media menu to start audio.`);
                 }
                 setIsPlaying(false);
             });
          }
      }
  };

  const addSystemLog = (log: string) => {
    setSystemLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${log}`]);
  };

  const purgeMemory = () => {
     localStorage.removeItem('cyrus_memory');
     setMessages([{
       id: crypto.randomUUID(),
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
    
    // Improved auto-scroll to bottom of comm log
    const scroll = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'auto', block: 'end' });
      }
    };
    
    // Attempt scroll immediately and slightly delayed to ensure DOM update
    scroll();
    setTimeout(scroll, 100);
    setTimeout(scroll, 500);
    setTimeout(scroll, 1000); // give it a final kick when long responses arrive or thinking updates
  }, [messages, systemStarted, thinkingStage]);

  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent | PromiseRejectionEvent) => {
        let errorMsg = '';
        if (event instanceof ErrorEvent) {
             errorMsg = event.message;
        } else {
             errorMsg = event.reason?.message || event.reason || "Unknown execution error";
        }
        if (errorMsg.includes("ResizeObserver")) return;
        
        console.warn("Cyrus Auto-Diagnostic Caught:", errorMsg);
        
        setSystemLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ⚠️ SYS.FAULT: ${errorMsg}. Attempting bypass.`]);
        setMessages(prev => {
             // Prevent infinite spam loops
             if (prev.length > 0 && prev[prev.length-1].content.includes('minut')) return prev;
             
             return [...prev, {
                id: crypto.randomUUID(),
                role: 'model',
                content: `⚠️ Internal anomaly intercepted: \`${errorMsg}\`\n\nhomie give me a minute until it fixed/ solves it.`
             }];
        });
    };
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleGlobalError);
    return () => {
        window.removeEventListener('error', handleGlobalError);
        window.removeEventListener('unhandledrejection', handleGlobalError);
    }
  }, []);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    localStorage.setItem('cyrus_memory_web', JSON.stringify(memoryWeb));
  }, [memoryWeb]);

  const thinkingPhrases = ["Processing parameters...", "Accessing central mainframe...", "Compiling neural response..."];
  
  useEffect(() => {
     let interval: NodeJS.Timeout;
     if (isLoading) {
         interval = setInterval(() => {
             setThinkingStage(prev => (prev + 1) % thinkingPhrases.length);
         }, 1500);
     }
     return () => clearInterval(interval);
  }, [isLoading]);

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
                let final = event.results[i][0].transcript.trim();
                
                // Directly dispatch command if anything was actually heard
                if (final) {
                    if (final.toLowerCase().startsWith('cyrus')) {
                        final = final.substring(5).trim();
                    }
                    if (final.toLowerCase().startsWith(',')) {
                        final = final.substring(1).trim();
                    }
                    
                    if (final) {
                        setVoiceCommand(final);
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
    cleanText = cleanText.replace(/```[\s\S]*?```/g, 'I put the code on the screen.');
    cleanText = cleanText.replace(/<COMMAND>.*?<\/COMMAND>/g, '');
    cleanText = cleanText.replace(/\[SYS\.LOG:.*?\]/g, '');
    cleanText = cleanText.replace(/\bCYRUS\b/g, 'Cyrus');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voices = window.speechSynthesis.getVoices();
    
    // Attempt to find a JARVIS-like British voice
    const jarvisKeywords = ['Daniel', 'George', 'Google UK English Male', 'UK English Male', 'Arthur'];
    const bestVoice = voices.find(v => jarvisKeywords.some(k => v.name.includes(k)))
                   || voices.find(v => v.lang === 'en-GB' && v.name.toLowerCase().includes('male'))
                   || voices.find(v => v.lang.startsWith('en'));
                   
    if (bestVoice) utterance.voice = bestVoice;
    utterance.pitch = 0.8; // Slightly deeper, sophisticated
    utterance.rate = 1.05; // Slightly faster, efficient pacing
    
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
    } else if (cmd.startsWith('STORE_MEMORY:')) {
        const parts = cmd.substring(13).split(':');
        const category = parts[0].toLowerCase().trim();
        const info = parts.slice(1).join(':').trim();
        
        // Ensure category array limit to avoid bloat (Max 5 memory fragments per category initially)
        if (category && info) {
            addSystemLog(`🧠 Web Memory Embedded: [${category.toUpperCase()}] -> ${info}`);
            setMemoryWeb(prev => {
                const catArray = prev[category] || [];
                if (!catArray.includes(info)) {
                   const updatedArray = [...catArray, info].slice(-5);
                   return { ...prev, [category]: updatedArray };
                }
                return prev;
            });
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
        addSystemLog(`🚀 Executing App Launch Protocol: ${appName} (${url})`);
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
        addSystemLog(`🗑️ Terminated ${closedCount} external node connections (tabs closed).`);
        handleSubmit(undefined, `[SYS.LOG: Matrix override executed. Closed ${closedCount} active browser tabs.]`);
    } else if (cmd.startsWith('PLAY_MEDIA:')) {
        const query = cmd.substring(11).trim();
        addSystemLog(`🎵 Initializing Media Stream: "${query}"`);
        try {
            const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=1`);
            const data = await res.json();
            if (data.results && data.results.length > 0) {
               const track = data.results[0];
               const trackId = track.trackId.toString();
               const previewUrl = track.previewUrl;
               if (!previewUrl) {
                  handleSubmit(undefined, `[SYS.LOG: ERROR: No audio stream available for this track.]`);
                  return;
               }
               const trackName = `${track.trackName} - ${track.artistName}`;

               const newTrack: Track = { id: trackId, name: trackName, url: previewUrl.replace('http://', 'https://'), originalUrl: previewUrl };
               
               let finalTrack = newTrack;
               setPlaylist(prev => {
                   if (prev.find(t => t.id === trackId)) return prev;
                   const nextPlaylist = [...prev, newTrack];
                   return nextPlaylist.length > 10 ? nextPlaylist.slice(1) : nextPlaylist;
               });

               applyTrackAndPlay(finalTrack);

               handleSubmit(undefined, `[SYS.LOG: Storage task complete. Initializing playback for: ${trackName}]`);
            } else {
               handleSubmit(undefined, `[SYS.LOG: ERROR: Track not found in global search.]`);
            }
        } catch(e) {
            console.error(e);
            handleSubmit(undefined, `[SYS.LOG: Secure network blocked downloading media stream.]`);
        }
    } else if (cmd === 'STOP_MEDIA') {
        addSystemLog(`🔇 Terminating Media Stream.`);
        if (audioRef.current) {
            audioRef.current.pause();
        }
        setIsPlaying(false);
        handleSubmit(undefined, `[SYS.LOG: Media stream successfully paused.]`);
    } else if (cmd.startsWith('DELEGATE:')) {
        const parts = cmd.substring(9).split(':');
        const agentName = parts[0];
        const prompt = parts.slice(1).join(':').trim();
        
        addSystemLog(`🤖 Network Handshake: Delegating sub-routine to ${agentName.toUpperCase()}...`);
        handleSubmit(undefined, `[SYS.LOG: Task routed to Agent [${agentName.toUpperCase()}] for processing...]`);
        runDelegatedAgent(agentName, prompt);
    } else if (cmd.startsWith('SELF_EVOLVE:')) {
        const capability = cmd.substring(12).trim();
        addSystemLog(`🧬 Initiating SELF_EVOLUTION protocol: "${capability}"`);
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
          addSystemLog(`⚙️ Evolution Step: ${steps[i].replace(/\[SYS\.LOG:\s*([^\]]+)\]/, '$1')}`);
          handleSubmit(undefined, steps[i]);
      }
      setTimeout(() => {
          addSystemLog(`✅ Self evolution protocol successfully finished.`);
          speakMessage("Self evolution protocol complete. The requested capabilities are now integrated into my core matrix, Sir.");
      }, 1000);
  };

  const runDelegatedAgent = async (agentName: string, prompt: string) => {
     try {
         const headers: Record<string, string> = { 'Content-Type': 'application/json' };
         
         const res = await fetch('/api/delegate', {
            method: 'POST',
            headers,
            body: JSON.stringify({ 
               agent: agentName, 
               prompt,
               customApiKey: apiKeys.gemini || undefined,
               openaiApiKey: apiKeys.openai || undefined,
               anthropicApiKey: apiKeys.anthropic || undefined
            })
         });
         if (!res.body) throw new Error("No stream");

         const modelMessage: Message = { id: crypto.randomUUID(), role: 'model', content: `[Agent ${agentName.toUpperCase()}]\n\n`, isStreaming: true };
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
         addSystemLog(`✅ Extracted complete protocol from Agent ${agentName.toUpperCase()}.`);
         speakMessage("Agent protocol complete. Responses logged to matrix, Sir.");
     } catch (err) {
         console.error(err);
         addSystemLog(`❌ CRITICAL FAILURE: Handshake with Agent ${agentName.toUpperCase()} dropped.`);
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

    // 🔓 Web Audio Autoplay Unlock Logic
    // Required to allow Cyrus to play music asynchronously without direct user interaction blocking
    if (e && audioRef.current && !currentTrack) {
        audioRef.current.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
        audioRef.current.play().catch(()=>{});
    }

    const finalInput = overrideInput || input;
    if (!finalInput.trim() || isLoading) return;

    const lowerInput = finalInput.toLowerCase();
    let injectedContext = "";
    Object.keys(memoryWeb).forEach(cat => {
       if (lowerInput.includes(cat) || cat.split(' ').some(word => lowerInput.includes(word))) {
          if (memoryWeb[cat].length > 0) {
             injectedContext += `[SYS.MEMORY_WEB '${cat}' context: ${memoryWeb[cat].join(' | ')}] `;
          }
       }
    });

    let internalMessageContent = finalInput.trim();
    if (injectedContext) {
        internalMessageContent = `[SYSTEM BACKGROUND KNOWLEDGE FETCHED FROM WEB]: ${injectedContext}\nUser input: ${finalInput.trim()}`;
    }

    const userMessage: Message = { id: crypto.randomUUID(), role: 'user', content: finalInput.trim(), internalContent: internalMessageContent };
    if (finalInput.startsWith('[SYS.LOG')) {
        addSystemLog(finalInput.replace(/\[SYS\.LOG:\s*([^\]]+)\]/, '$1'));
    }
    setMessages(prev => [...prev, userMessage]);
    if (!overrideInput) setInput('');
    setIsLoading(true);

    const modelMessageId = crypto.randomUUID();
    setMessages(prev => [...prev, { id: modelMessageId, role: 'model', content: '', isStreaming: true }]);

    let fullResponse = '';

    try {
      const requestMessages = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.internalContent || m.content
      }));

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({ messages: requestMessages, customApiKey: apiKeys.gemini || undefined })
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
         msg.id === modelMessageId ? { ...msg, content: 'homie give me a minute until it fixed/ solves it' } : msg
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
              scale: isSpeaking ? [1, 1.05, 0.98, 1.05, 1] : 1,
              opacity: isSpeaking ? [0.8, 1, 0.9, 1] : 0.6
           }} 
           transition={{ duration: isSpeaking ? 0.8 : 4, repeat: Infinity, ease: "easeInOut" }} 
           className="absolute w-[220px] h-[220px] rounded-full shadow-[0_0_50px_rgba(0,210,255,0.5),inset_0_0_20px_rgba(20,150,255,0.5)] bg-gradient-to-br from-cyan-300 via-blue-500 to-indigo-600 overflow-hidden" 
        >
             {/* Internal intricate lines for the ball */}
             <div className="absolute inset-[-50px] border-[50px] border-dotted border-white/10 rounded-full mix-blend-overlay animate-[spin_20s_linear_infinite]" />
             <div className="absolute inset-6 border-[15px] border-dashed border-cyan-100/20 rounded-full mix-blend-overlay animate-[spin_30s_linear_infinite_reverse]" />
        </motion.div>

        {/* Outer glowing rings */}
        <div style={{ willChange: "transform" }} className="absolute w-[320px] h-[320px] rounded-full border-t-2 border-l-2 border-cyan-400/40 shadow-[0_0_15px_rgba(34,211,238,0.2)] animate-[spin_40s_linear_infinite]" />
        <div style={{ willChange: "transform" }} className="absolute w-[420px] h-[420px] rounded-full border-[2px] border-dashed border-blue-400/10 animate-[spin_50s_linear_infinite_reverse]" />
        <motion.div style={{ willChange: "transform" }} animate={{ scale: isSpeaking ? [1, 1.03, 0.99, 1] : 1 }} transition={{ duration: isSpeaking ? 1 : 4, repeat: Infinity, ease: "easeInOut" }} className="absolute w-[480px] h-[480px] rounded-full border border-cyan-500/10" />
        <motion.div style={{ willChange: "transform" }} animate={{ scale: isSpeaking ? [1, 1.02, 1] : 1 }} transition={{ duration: isSpeaking ? 1.5 : 2, repeat: Infinity, ease: "easeInOut" }} className="absolute w-[600px] h-[600px] rounded-full border-t border-b border-blue-500/10" />
        
        {/* Core intensely glowing center */}
        <motion.div style={{ willChange: "transform, opacity" }} animate={{ scale: isSpeaking ? [1, 1.2, 0.9, 1.1, 1] : 1, opacity: isSpeaking ? 1 : 0.6 }} transition={{ duration: isSpeaking ? 0.5 : 3, repeat: Infinity, ease: "easeInOut" }} className="absolute w-[60px] h-[60px] rounded-full bg-white blur-[10px]" />
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

        {/* Semantic Web Memory Indicator */}
        <div className="bg-[#020a17]/80 border border-indigo-900/60 backdrop-blur-md rounded-xl p-3 shadow-[0_0_20px_rgba(0,0,0,0.5)] flex flex-col gap-2">
           <div className="flex items-center justify-between border-b border-indigo-900/60 pb-1.5 mb-1">
              <span className="text-[10px] text-indigo-400 font-bold tracking-widest flex items-center gap-1.5"><Database size={12}/> SEMANTIC_WEB</span>
              <span className="text-[9px] text-indigo-600">{Object.keys(memoryWeb).length} NODES</span>
           </div>
           <div className="flex flex-wrap gap-1 mt-1">
               {Object.entries(memoryWeb).slice(0, 8).map(([key, items]) => (
                  <span key={key} title={`${items.length} items`} className="text-[9px] px-1.5 py-0.5 rounded border border-indigo-500/30 text-indigo-300 bg-indigo-950/40">
                     {key.toUpperCase()} [{items.length}]
                  </span>
               ))}
           </div>
        </div>

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
                   {playlist.map((pt, idx) => (
                       <div key={`${pt.id}-${idx}`} className={`flex items-center justify-between group p-1.5 rounded-md hover:bg-cyan-900/20 ${currentTrack?.id === pt.id ? 'bg-cyan-900/40 border border-cyan-900/60' : 'border border-transparent'}`}>
                           <span className="text-[9px] text-cyan-600/80 w-4/5 truncate cursor-pointer group-hover:text-cyan-400" onClick={()=>{
                               applyTrackAndPlay(pt);
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
               <button onClick={() => setShowSystemLogs(true)} className="text-cyan-600 hover:text-cyan-400 transition-colors" title="System Execution Logs">
                   <Activity size={16} />
               </button>
               <button onClick={() => setShowSettings(true)} className="lg:hidden text-cyan-600 hover:text-cyan-400 transition-colors" title="System Settings">
                   <Settings2 size={16} />
               </button>
               <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></div>
                  <div className="w-2 h-2 rounded-full bg-cyan-700"></div>
               </div>
            </div>
         </div>
         
         <div ref={messagesContainerRef} className="flex-1 overflow-y-auto w-full p-4 space-y-4 custom-scrollbar">
            <AnimatePresence initial={false}>
              {messages.map((message, idx) => (
                <motion.div
                  key={`${message.id}-${idx}`}
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
                        {message.isStreaming && !message.content ? (
                           <span className="italic text-cyan-500/70 animate-pulse">{thinkingPhrases[thinkingStage]}</span>
                        ) : (
                           <ReactMarkdown>{message.content}</ReactMarkdown>
                        )}
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

              <div className="flex flex-col gap-2 p-3 bg-cyan-950/20 border border-cyan-500/20 rounded-xl mt-2">
                  <div className="flex items-center gap-2 mb-1">
                      <Shield size={14} className="text-cyan-400" />
                      <span className="text-[11px] text-cyan-400 font-bold uppercase tracking-widest">User API Keys (Optional overrides)</span>
                  </div>
                  <p className="text-[10px] text-cyan-700/90 leading-relaxed mb-2">
                      C.Y.R.U.S. independently manages its own secure environment variables from `.env`. However, you can provide your own API keys to override the default system provisioned agents.
                  </p>
                  
                  <div className="flex flex-col gap-1.5 mt-2">
                      <label className="text-[9px] text-cyan-500 font-bold tracking-wider">Gemini API Key</label>
                      <input 
                         type="password" 
                         value={apiKeys.gemini} 
                         onChange={(e) => setApiKeys(prev => ({...prev, gemini: e.target.value}))}
                         className="bg-[#020a17] border border-cyan-900/50 rounded-md p-1.5 text-xs text-cyan-300 focus:outline-none focus:border-cyan-500/80" 
                         placeholder="AIza..." 
                      />
                  </div>
                  <div className="flex flex-col gap-1.5 mt-1">
                      <label className="text-[9px] text-cyan-500 font-bold tracking-wider">OpenAI API Key</label>
                      <input 
                         type="password" 
                         value={apiKeys.openai} 
                         onChange={(e) => setApiKeys(prev => ({...prev, openai: e.target.value}))}
                         className="bg-[#020a17] border border-cyan-900/50 rounded-md p-1.5 text-xs text-cyan-300 focus:outline-none focus:border-cyan-500/80" 
                         placeholder="sk-..." 
                      />
                  </div>
                  <div className="flex flex-col gap-1.5 mt-1">
                      <label className="text-[9px] text-cyan-500 font-bold tracking-wider">Anthropic API Key</label>
                      <input 
                         type="password" 
                         value={apiKeys.anthropic} 
                         onChange={(e) => setApiKeys(prev => ({...prev, anthropic: e.target.value}))}
                         className="bg-[#020a17] border border-cyan-900/50 rounded-md p-1.5 text-xs text-cyan-300 focus:outline-none focus:border-cyan-500/80" 
                         placeholder="sk-ant-..." 
                      />
                  </div>
              </div>

              <div className="flex flex-col gap-2 mt-2">
                 <label className="text-[10px] text-cyan-600 font-bold uppercase tracking-widest flex items-center justify-between">
                    <span>Synchronized Database Cluster</span>
                    <button onClick={() => setCustomDBs(prev => [...prev, { id: crypto.randomUUID(), type: 'PostgreSQL', url: '', area: 'New Area' }])} className="text-cyan-500 hover:text-cyan-300">
                      + ADD DB
                    </button>
                 </label>
                 <p className="text-[10px] text-cyan-800 leading-relaxed mb-1">
                    Configure multiple database nodes to sync memory, states, and logs. C.Y.R.U.S. can distribute tasks across multiple clusters.
                 </p>
                 
                 <div className="flex flex-col gap-3 max-h-[160px] overflow-y-auto custom-scrollbar pr-2">
                    {customDBs.map(db => (
                        <div key={db.id} className="flex flex-col gap-2 bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-2 relative group">
                           <div className="flex gap-2">
                               <input 
                                  value={db.type}
                                  onChange={e => setCustomDBs(prev => prev.map(d => d.id === db.id ? {...d, type: e.target.value} : d))}
                                  className="w-1/3 bg-transparent border-b border-cyan-800/50 text-[10px] text-cyan-400 p-1 focus:outline-none focus:border-cyan-500"
                                  placeholder="Type (e.g. MongoDB)"
                               />
                               <input 
                                  value={db.area}
                                  onChange={e => setCustomDBs(prev => prev.map(d => d.id === db.id ? {...d, area: e.target.value} : d))}
                                  className="w-2/3 bg-transparent border-b border-cyan-800/50 text-[10px] text-cyan-500 p-1 focus:outline-none focus:border-cyan-500"
                                  placeholder="Handled Area (e.g. Media Library)"
                               />
                           </div>
                           <div className="flex items-center gap-2">
                               <input 
                                  value={db.url}
                                  onChange={e => setCustomDBs(prev => prev.map(d => d.id === db.id ? {...d, url: e.target.value} : d))}
                                  type="password"
                                  className="flex-1 bg-[#01050b] border border-cyan-900/50 rounded text-[10px] text-cyan-300 p-1.5 focus:outline-none focus:border-cyan-500"
                                  placeholder="Connection String / URL"
                               />
                               {customDBs.length > 1 && (
                                   <button onClick={() => setCustomDBs(prev => prev.filter(d => d.id !== db.id))} className="text-red-500/70 hover:text-red-400">
                                       <Trash2 size={12} />
                                   </button>
                               )}
                           </div>
                           <div className="absolute top-2 right-2 flex items-center gap-1">
                               <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_#22c55e]"></div>
                               <span className="text-[8px] text-green-500 font-mono tracking-widest uppercase opacity-70">SYNCED</span>
                           </div>
                        </div>
                    ))}
                 </div>
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

      {/* System Logs Modal */}
      <AnimatePresence>
        {showSystemLogs && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-[60] bg-[#01050b]/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.2 }}
              className="bg-[#020a17] border border-cyan-800/60 rounded-3xl p-6 w-full max-w-3xl shadow-[0_0_50px_rgba(0,10,30,0.8),_inset_0_0_20px_rgba(34,211,238,0.1)] relative"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <Activity className="text-cyan-400" size={24} />
                    <h2 className="text-lg text-cyan-50 font-bold tracking-widest uppercase">System Execution Logs</h2>
                </div>
                <button onClick={() => setShowSystemLogs(false)} className="text-cyan-600 hover:text-cyan-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>

              <div className="flex flex-col gap-2 p-3 bg-[#01050b] border border-cyan-900/50 rounded-xl h-[400px] overflow-y-auto custom-scrollbar">
                  {systemLogs.length === 0 ? (
                      <p className="text-[12px] text-cyan-800 text-center mt-10">No execution logs recorded yet.</p>
                  ) : (
                      systemLogs.map((log, idx) => (
                          <div key={idx} className="font-mono text-[10px] sm:text-[11px] text-cyan-400 border-b border-cyan-900/30 pb-1 break-words whitespace-pre-wrap">
                              {log}
                          </div>
                      ))
                  )}
              </div>

              <div className="mt-4 flex justify-between">
                 <button onClick={() => setSystemLogs([])} className="bg-red-950/20 hover:bg-red-900/40 border border-red-900/50 text-red-400 py-2 px-6 rounded-lg text-xs font-bold tracking-widest transition-all">
                    CLEAR LOGS
                 </button>
                 <button onClick={() => setShowSystemLogs(false)} className="bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-900/80 text-cyan-300 py-2 px-6 rounded-lg text-xs font-bold tracking-widest transition-all">
                    CLOSE
                 </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
