import React, { useState, useEffect, useMemo } from 'react';
import { Globe } from './components/Globe';
import { MapView } from './components/MapView';
import { KnowledgeGraph } from './components/KnowledgeGraph';
import { IntelligencePanel } from './components/IntelligencePanel';
import { generateMockEvents, fetchRealTimeBgp, fetchPublicBlocklist } from './services/dataEngine';
import { VayuEvent } from './types';
import { 
  Activity, 
  ShieldAlert, 
  Globe as GlobeIcon, 
  Zap, 
  Search, 
  BarChart3,
  ListFilter,
  AlertTriangle,
  X,
  Network,
  Fingerprint,
  Route,
  Database,
  EyeOff,
  Cpu,
  Shield
} from 'lucide-react';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 w-full px-4 py-3 transition-all duration-300 rounded-lg group",
      active ? "bg-highlight/20 text-accent border-r-2 border-accent" : "text-slate-400 hover:bg-highlight/10 hover:text-slate-200"
    )}
  >
    <Icon size={20} className={cn("transition-transform group-hover:scale-110", active && "text-accent")} />
    <span className="text-sm font-medium tracking-wide uppercase">{label}</span>
  </button>
);

const StatCard = ({ label, value, trend, color }: any) => (
  <div className="glass-panel p-3 md:p-4 flex flex-col gap-1">
    <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</span>
    <div className="flex items-end justify-between">
      <span className={cn("text-lg md:text-2xl font-bold tracking-tighter", color)}>{value}</span>
      <span className={cn("text-[8px] md:text-[10px] font-mono", trend > 0 ? "text-emerald-400" : "text-rose-400")}>
        {trend > 0 ? "+" : ""}{trend}%
      </span>
    </div>
  </div>
);

export default function App() {
  const [events, setEvents] = useState<VayuEvent[]>([]);
  const [activeTab, setActiveTab] = useState('intelligence');
  const [searchQuery, setSearchQuery] = useState('');
  const [simulationMode, setSimulationMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [timelineValue, setTimelineValue] = useState(100); // 0-100 for replay
  const [healthIndex, setHealthIndex] = useState(94);
  const [isReplaying, setIsReplaying] = useState(false);
  const [showPanels, setShowPanels] = useState(true);
  const [isZenMode, setIsZenMode] = useState(false);
  const [threatLevel, setThreatLevel] = useState('LOW');
  const [publicBlocklist, setPublicBlocklist] = useState<string[]>([]);

  useEffect(() => {
    const fetchBlocklist = async () => {
      const list = await fetchPublicBlocklist();
      setPublicBlocklist(list.slice(0, 20));
    };
    fetchBlocklist();
  }, []);

  useEffect(() => {
    const initialEvents = generateMockEvents(50);
    setEvents(initialEvents);

    const interval = setInterval(async () => {
      if (!isReplaying) {
        // Fetch real-time BGP updates for a common ASN to enrich the feed
        const realUpdates = await fetchRealTimeBgp(3333);
        const newEvents: VayuEvent[] = [];
        
        if (realUpdates && realUpdates.length > 0) {
          const latest = realUpdates[0];
          if (latest && latest.prefix) {
            newEvents.push({
              id: `bgp-${Date.now()}`,
              timestamp: Date.now(),
              category: 'bgp',
              severity: latest.type === 'W' ? 8 : 4,
              source: {
                ip: latest.prefix.split('/')[0],
                asn: 3333,
                country: 'NL',
                lat: 52.3676,
                lon: 4.9041,
              },
              metrics: { volume: 0, requests: 0, latency: 0, packetLoss: 0 },
              tags: ['bgp', 'real-time', latest.type === 'W' ? 'withdrawal' : 'announcement'],
              description: `BGP ${latest.type === 'W' ? 'Withdrawal' : 'Announcement'} for ${latest.prefix} via AS3333`,
              type: 'BGP',
              metadata: {
                prefix: latest.prefix,
                origin: 'AS3333',
                status: latest.type === 'W' ? 'WITHDRAWN' : 'STABLE'
              }
            });
          }
        }

        const mockEvent = generateMockEvents(1)[0];
        setEvents(prev => {
          return [...newEvents, mockEvent, ...prev.slice(0, 99)];
        });
        
        // Randomly fluctuate health index
        setHealthIndex(prev => Math.max(0, Math.min(100, prev + (Math.random() - 0.5) * 2)));
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isReplaying]);

  useEffect(() => {
    // Update threat level based on events
    const recentAttacks = events.filter(e => e.category === 'attack').length;
    if (recentAttacks > 15) setThreatLevel('CRITICAL');
    else if (recentAttacks > 8) setThreatLevel('ELEVATED');
    else setThreatLevel('LOW');
  }, [events]);

  useEffect(() => {
    // Close sidebar on mobile when tab changes
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, [activeTab]);

  const filteredEvents = useMemo(() => {
    // In a real app, this would filter by timelineValue
    return events;
  }, [events, timelineValue]);

  const chartData = useMemo(() => {
    return Array.from({ length: 24 }).map((_, i) => ({
      time: `${i}:00`,
      traffic: 4000 + Math.random() * 2000,
      attacks: 200 + Math.random() * 800,
    }));
  }, []);

  const correlations = useMemo(() => {
    const recent = events.slice(0, 10);
    const results: string[] = [];
    
    const hasBGPAnomaly = recent.some(e => e.category === 'bgp' && e.severity > 7);
    const hasTrafficDrop = recent.some(e => e.category === 'traffic' && e.metrics.volume! < 200);
    
    if (hasBGPAnomaly && hasTrafficDrop) {
      results.push("CORRELATION: BGP Withdrawal detected alongside significant traffic drop. Probable regional outage.");
    }
    
    const hasAttackSpike = recent.some(e => e.category === 'attack' && e.severity > 8);
    const hasLatencySpike = recent.some(e => e.metrics.latency! > 150);
    
    if (hasAttackSpike && hasLatencySpike) {
      results.push("CORRELATION: Volumetric attack spike correlated with increased global latency. Infrastructure stress detected.");
    }

    return results;
  }, [events]);

  return (
    <div className="flex h-screen w-screen bg-bg text-slate-200 overflow-hidden flex-col md:flex-row relative">
      {/* Mobile Header */}
      <div className={cn(
        "md:hidden h-14 border-b border-glass-border flex items-center justify-between px-4 z-40 bg-bg/80 backdrop-blur-md transition-all duration-500",
        isZenMode && "-translate-y-14 opacity-0"
      )}>
        <div className="flex items-center gap-2">
          <Activity className="text-accent" size={18} />
          <h1 className="text-lg font-bold tracking-tighter neon-text">VAYU</h1>
        </div>
        
        <div className={cn(
          "flex items-center gap-2 px-2 py-0.5 rounded-full border font-mono text-[8px] font-bold",
          threatLevel === 'CRITICAL' ? "bg-rose-500/10 border-rose-500/50 text-rose-500" :
          threatLevel === 'ELEVATED' ? "bg-orange-500/10 border-orange-500/50 text-orange-500" :
          "bg-emerald-500/10 border-emerald-500/50 text-emerald-500"
        )}>
          <div className={cn(
            "w-1 h-1 rounded-full animate-pulse",
            threatLevel === 'CRITICAL' ? "bg-rose-500" :
            threatLevel === 'ELEVATED' ? "bg-orange-500" :
            "bg-emerald-500"
          )} />
          {threatLevel}
        </div>
      </div>

      {/* Left Sidebar */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && !isZenMode && (
          <>
            {/* Mobile Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.aside 
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: "spring", damping: 20, stiffness: 100 }}
              className="fixed md:relative w-64 h-full border-r border-glass-border flex flex-col p-4 gap-6 z-50 bg-bg/95 md:bg-transparent backdrop-blur-xl md:backdrop-blur-none group"
            >
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(0,212,255,0.5)]">
                    <Activity className="text-bg" size={20} />
                  </div>
                  <h1 className="text-xl font-bold tracking-tighter neon-text">VAYU RADAR</h1>
                </div>
                <button 
                  onClick={() => setIsSidebarOpen(false)} 
                  className="text-slate-500 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

        <nav className="flex flex-col gap-1">
          <SidebarItem icon={Shield} label="Fusion Intel" active={activeTab === 'intelligence'} onClick={() => setActiveTab('intelligence')} />
          <SidebarItem icon={ShieldAlert} label="Threat Engine" active={activeTab === 'threat'} onClick={() => setActiveTab('threat')} />
          <SidebarItem icon={Activity} label="Traffic Trends" active={activeTab === 'traffic'} onClick={() => setActiveTab('traffic')} />
          <SidebarItem icon={Route} label="BGP Routing" active={activeTab === 'bgp'} onClick={() => setActiveTab('bgp')} />
          <SidebarItem icon={EyeOff} label="Deception Layer" active={activeTab === 'deception'} onClick={() => setActiveTab('deception')} />
          <SidebarItem icon={Network} label="Knowledge Graph" active={activeTab === 'graph'} onClick={() => setActiveTab('graph')} />
          <SidebarItem icon={Database} label="Data Explorer" active={activeTab === 'explorer'} onClick={() => setActiveTab('explorer')} />
        </nav>

        <div className="mt-auto flex flex-col gap-4">
          <div className="glass-panel p-4 bg-accent/5 border-accent/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Internet Health</span>
              <span className={cn("text-xs font-mono font-bold", healthIndex > 90 ? "text-emerald-400" : "text-orange-400")}>
                {healthIndex.toFixed(1)}%
              </span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={cn("h-full transition-all duration-1000", healthIndex > 90 ? "bg-emerald-500" : "bg-orange-500")} 
                style={{ width: `${healthIndex}%` }} 
              />
            </div>
          </div>

          <div className="glass-panel p-4 bg-highlight/5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-mono text-emerald-500 uppercase">System Online</span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono leading-tight">
              Global Nodes: 1,242<br />
              Ingestion: 4.2 TB/s<br />
              Latency: 12ms
            </p>
          </div>
        </div>
      </motion.aside>
    </>
  )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 relative flex flex-col overflow-hidden">
        {/* Header / Search */}
        <header className={cn(
          "h-16 border-b border-glass-border hidden md:flex items-center justify-between px-4 md:px-8 z-40 backdrop-blur-md transition-all duration-500",
          isZenMode && "-translate-y-16 opacity-0"
        )}>
          <div className="flex items-center gap-4">
            {!isSidebarOpen && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 bg-accent/10 border border-accent/30 rounded-lg text-accent hover:bg-accent/20 transition-all flex items-center gap-2"
              >
                <ListFilter size={18} />
              </button>
            )}
            <div className="relative w-48 md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="text" 
                placeholder="Search IP, Domain, or ASN..." 
                className="w-full bg-highlight/10 border border-glass-border rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-accent/50 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className={cn(
              "hidden lg:flex items-center gap-2 px-3 py-1 rounded-full border font-mono text-[10px] font-bold",
              threatLevel === 'CRITICAL' ? "bg-rose-500/10 border-rose-500/50 text-rose-500" :
              threatLevel === 'ELEVATED' ? "bg-orange-500/10 border-orange-500/50 text-orange-500" :
              "bg-emerald-500/10 border-emerald-500/50 text-emerald-500"
            )}>
              <div className={cn(
                "w-1.5 h-1.5 rounded-full animate-pulse",
                threatLevel === 'CRITICAL' ? "bg-rose-500" :
                threatLevel === 'ELEVATED' ? "bg-orange-500" :
                "bg-emerald-500"
              )} />
              THREAT LEVEL: {threatLevel}
            </div>
            
            <button 
              onClick={() => setIsZenMode(!isZenMode)}
              className={cn(
                "p-2 border rounded-lg transition-all flex items-center gap-2",
                isZenMode ? "bg-accent text-bg border-accent" : "bg-highlight/10 border-glass-border text-slate-400 hover:bg-highlight/20"
              )}
              title={isZenMode ? "Exit Full View" : "Enter Full View"}
            >
              <Zap size={18} className={cn(isZenMode && "animate-pulse")} />
              <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">
                {isZenMode ? "Exit Full View" : "Full View"}
              </span>
            </button>

            <button 
              onClick={() => setShowPanels(!showPanels)}
              className="p-2 bg-highlight/10 border border-glass-border rounded-lg text-slate-400 hover:bg-highlight/20 transition-all flex items-center gap-2"
            >
              <Activity size={18} className={cn(showPanels && "text-accent")} />
            </button>
            <button className="cyber-button hidden md:flex items-center gap-2">
              <ListFilter size={14} />
              Filters
            </button>
            <div className="w-10 h-10 rounded-full border border-glass-border bg-highlight/20 flex items-center justify-center overflow-hidden">
              <img src="https://picsum.photos/seed/user/40/40" alt="User" referrerPolicy="no-referrer" />
            </div>
          </div>
        </header>

        {/* Dynamic Viewport */}
        <div className="flex-1 relative">
          {/* Background View */}
          <div className="absolute inset-0 z-0">
            {activeTab === 'intelligence' ? (
              <div className="w-full h-full bg-bg/50 backdrop-blur-sm">
                <IntelligencePanel />
              </div>
            ) : activeTab === 'threat' || activeTab === 'deception' ? (
              <Globe events={filteredEvents} simulationMode={simulationMode} />
            ) : activeTab === 'graph' ? (
              <div className="w-full h-full p-8">
                <KnowledgeGraph events={filteredEvents} />
              </div>
            ) : (
              <MapView events={filteredEvents} />
            )}
            {simulationMode && (
              <div className="absolute inset-0 bg-rose-500/10 animate-pulse pointer-events-none z-10 border-4 border-rose-500/30" />
            )}
          </div>

          {/* Overlay Panels */}
          <AnimatePresence>
            {showPanels && !isZenMode && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 pointer-events-none flex flex-col md:flex-row p-4 md:p-6 gap-4 md:gap-6 overflow-y-auto md:overflow-hidden pb-32 md:pb-6"
              >
                {/* Left Column - Stats & Feed */}
                <div className="w-full md:w-80 flex flex-col gap-4 md:gap-6 pointer-events-auto shrink-0 max-h-full">
              {activeTab === 'intelligence' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <StatCard label="Global Traffic" value="84.2P" trend={12} color="text-accent" />
                    <StatCard label="Active Attacks" value="1,242" trend={-5} color="text-rose-400" />
                  </div>
                  
                  {searchQuery && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="glass-panel p-4 border-accent/30 bg-accent/5"
                    >
                      <h3 className="text-xs font-bold uppercase tracking-widest text-accent mb-2">Domain Intelligence</h3>
                      <div className="space-y-2 text-[10px] font-mono">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Target:</span>
                          <span className="text-slate-200">{searchQuery}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Reputation:</span>
                          <span className="text-emerald-400">Neutral (74/100)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">ASN:</span>
                          <span className="text-accent">AS13335 (Cloudflare)</span>
                        </div>
                        <div className="h-1 bg-slate-800 rounded-full mt-2">
                          <div className="h-full bg-accent w-3/4" />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div className="glass-panel p-4 bg-highlight/5 flex-1 overflow-hidden flex flex-col">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 flex items-center justify-between">
                      Live Intelligence Feed
                      <div className="flex gap-1">
                        <div className="w-1 h-1 rounded-full bg-accent animate-ping" />
                        <div className="w-1 h-1 rounded-full bg-accent" />
                      </div>
                    </h3>
                    <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                      {events.slice(0, 15).map((event, idx) => (
                        <div key={event.id} className="border-l border-slate-800 pl-3 py-1 hover:border-accent transition-colors group">
                          <div className="flex items-center justify-between mb-1">
                            <span className={cn(
                              "text-[8px] font-mono px-1.5 py-0.5 rounded uppercase",
                              event.category === 'attack' ? "bg-rose-500/20 text-rose-400" :
                              event.category === 'deception' ? "bg-magenta-500/20 text-magenta-400" :
                              "bg-accent/20 text-accent"
                            )}>
                              {event.type}
                            </span>
                            <span className="text-[8px] font-mono text-slate-600">
                              {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-mono leading-tight group-hover:text-slate-200 transition-colors">
                            {event.description}
                          </p>
                          <div className="flex items-center gap-2 mt-1 opacity-50 group-hover:opacity-100 transition-opacity">
                            <span className="text-[8px] font-mono text-slate-500">SRC: {event.source.ip}</span>
                            {event.metadata?.target_port && (
                              <span className="text-[8px] font-mono text-rose-400">PORT: {event.metadata.target_port}</span>
                            )}
                            {event.metadata?.vector && (
                              <span className="text-[8px] font-mono text-accent">{event.metadata.vector}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="glass-panel p-4 bg-highlight/5">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Intelligence Correlations</h3>
                    <div className="space-y-2">
                      {correlations.length > 0 ? correlations.map((c, i) => (
                        <div key={i} className="p-2 bg-accent/10 border-l-2 border-accent rounded-r text-[10px] font-mono text-accent leading-tight">
                          {c}
                        </div>
                      )) : (
                        <div className="text-[10px] text-slate-500 italic">No significant correlations detected in current window.</div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'threat' && (
                <div className="glass-panel p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-rose-400">Threat Intelligence</h3>
                    <button 
                      onClick={() => setSimulationMode(!simulationMode)}
                      className={cn(
                        "text-[10px] px-2 py-1 rounded border transition-colors",
                        simulationMode ? "bg-rose-500 border-rose-400 text-white" : "border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                      )}
                    >
                      {simulationMode ? "STOP SIM" : "START SIM"}
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-rose-500/5 border border-rose-500/20 rounded-lg">
                      <span className="text-[8px] text-slate-500 uppercase">Active Vectors</span>
                      <div className="text-xs font-mono text-rose-400">14 Unique</div>
                    </div>
                    <div className="p-2 bg-rose-500/5 border border-rose-500/20 rounded-lg">
                      <span className="text-[8px] text-slate-500 uppercase">Botnet Load</span>
                      <div className="text-xs font-mono text-rose-400">84% Capacity</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold uppercase text-slate-500">Live Public Blocklist (FireHOL)</h4>
                    <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-1">
                      {publicBlocklist.length > 0 ? publicBlocklist.map((ip, i) => (
                        <div key={i} className="p-1.5 bg-rose-500/5 border border-rose-500/10 rounded text-[9px] font-mono text-rose-400 flex justify-between">
                          <span>{ip}</span>
                          <span className="text-slate-600">MALICIOUS</span>
                        </div>
                      )) : (
                        <div className="text-[10px] text-slate-500 italic">Fetching global blocklist...</div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold uppercase text-slate-500">Live Attack Vectors</h4>
                    {events.filter(e => e.category === 'attack').slice(0, 3).map(e => (
                      <div key={e.id} className="p-2 bg-highlight/5 border-l-2 border-rose-500 rounded-r text-[10px] font-mono">
                        <div className="flex justify-between text-rose-400 mb-1">
                          <span>{e.metadata?.vector || 'Unknown Vector'}</span>
                          <span>{e.severity}/10</span>
                        </div>
                        <div className="text-slate-500 text-[8px]">TARGET: {e.target?.ip || 'N/A'} • PORT: {e.metadata?.target_port || 'N/A'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'deception' && (
                <div className="glass-panel p-4 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-fuchsia-400">Deception Intelligence</h3>
                  <div className="space-y-3">
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span>Active Honeypots</span>
                        <span className="text-fuchsia-400">12</span>
                      </div>
                      <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-fuchsia-500 w-1/2" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span>Attacker Engagement</span>
                        <span className="text-fuchsia-400">High</span>
                      </div>
                      <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-fuchsia-500 w-3/4" />
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-fuchsia-500/5 border border-fuchsia-500/20 rounded-lg">
                    <p className="text-[9px] text-slate-400 leading-tight">
                      Decoy networks are currently absorbing 14% of global volumetric noise. 
                      Attacker signatures are being harvested for behavioral analysis.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'traffic' && (
                <div className="glass-panel p-4 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-accent">Traffic Distribution</h3>
                  <div className="h-40 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#00d4ff" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="time" hide />
                        <YAxis hide />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(0, 212, 255, 0.2)', borderRadius: '8px' }}
                          itemStyle={{ color: '#00d4ff' }}
                        />
                        <Area type="monotone" dataKey="traffic" stroke="#00d4ff" fillOpacity={1} fill="url(#colorTraffic)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-highlight/5 rounded-lg border border-highlight/10">
                      <span className="text-[8px] text-slate-500 uppercase">HTTP/3</span>
                      <div className="text-xs font-mono text-accent">64.2%</div>
                    </div>
                    <div className="p-2 bg-highlight/5 rounded-lg border border-highlight/10">
                      <span className="text-[8px] text-slate-500 uppercase">IPv6</span>
                      <div className="text-xs font-mono text-accent">42.8%</div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'bgp' && (
                <div className="glass-panel p-4 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-orange-400">BGP Route Analysis</h3>
                  <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] text-slate-500 uppercase">Global Route Stability</span>
                      <div className="text-xl font-mono text-orange-400">98.4%</div>
                    </div>
                    <div className="p-3 bg-orange-500/5 border border-orange-500/20 rounded-lg">
                      <div className="flex items-center gap-2 text-orange-400 mb-1">
                        <AlertTriangle size={12} />
                        <span className="text-[10px] font-bold uppercase">Route Hijack Detected</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-tight">
                        AS4837 (China Unicom) reporting unusual path prepending for prefix 1.2.3.0/24.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[8px] font-mono text-slate-500 uppercase">
                        <span>Prefix</span>
                        <span>Origin</span>
                        <span>Status</span>
                      </div>
                      {events.filter(e => e.category === 'bgp').slice(0, 5).map(e => (
                        <div key={e.id} className="text-[10px] font-mono text-slate-300 flex justify-between items-center border-b border-slate-800 pb-1">
                          <span>{e.metadata?.prefix || 'N/A'}</span>
                          <span className="text-accent">{e.metadata?.origin || 'N/A'}</span>
                          <span className={cn(
                            "text-[8px] px-1 rounded",
                            e.metadata?.status === 'HIJACKED' ? "bg-rose-500/20 text-rose-400" : "bg-emerald-500/20 text-emerald-400"
                          )}>
                            {e.metadata?.status || 'STABLE'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'explorer' && (
                <div className="glass-panel p-4 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-accent">OSINT Fusion Feed</h3>
                  <div className="space-y-3 overflow-y-auto max-h-[300px] custom-scrollbar pr-2">
                    {[
                      { title: "Major Outage: AWS US-East-1", time: "12m ago", type: "outage", source: "Twitter" },
                      { title: "BGP Leak detected in AS1234", time: "45m ago", type: "bgp", source: "RIPE" },
                      { title: "New Zero-day exploit in OpenSSH", time: "2h ago", type: "threat", source: "GitHub" },
                      { title: "Botnet C2 activity spike in SEA", time: "4h ago", type: "botnet", source: "Vayu-Net" },
                      { title: "Tier-1 peering congestion: AS174", time: "6h ago", type: "traffic", source: "Kentik" }
                    ].map((news, i) => (
                      <div key={i} className="p-2 bg-highlight/5 border-l-2 border-accent rounded-r flex flex-col gap-1 hover:bg-highlight/10 transition-colors">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-slate-200">{news.title}</span>
                          <span className="text-[8px] bg-accent/20 text-accent px-1 rounded">{news.source}</span>
                        </div>
                        <span className="text-[8px] text-slate-500 uppercase">{news.time} • {news.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="glass-panel flex-1 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-glass-border flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Live Event Stream</h3>
                  <div className="flex gap-1">
                    <div className="w-1 h-1 rounded-full bg-accent" />
                    <div className="w-1 h-1 rounded-full bg-accent/50" />
                    <div className="w-1 h-1 rounded-full bg-accent/20" />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  <AnimatePresence initial={false}>
                    {events.map((event) => (
                      <motion.div 
                        key={event.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-3 bg-highlight/5 border border-glass-border rounded-lg hover:bg-highlight/10 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={cn(
                            "text-[10px] font-mono px-1.5 py-0.5 rounded uppercase",
                            event.category === 'attack' ? "bg-rose-500/20 text-rose-400" : "bg-accent/20 text-accent"
                          )}>
                            {event.category}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                        <div className="text-xs font-mono truncate text-slate-300 group-hover:text-accent transition-colors">
                          {event.source.ip} → {event.target?.ip || event.source.country}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="h-1 flex-1 bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className={cn("h-full", event.severity > 7 ? "bg-rose-500" : "bg-accent")} 
                              style={{ width: `${event.severity * 10}%` }} 
                            />
                          </div>
                          <span className="text-[10px] text-slate-500">S:{event.severity}</span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Right Column - Charts & Analysis */}
            <div className="hidden xl:flex w-full xl:w-96 flex-col gap-6 items-end pointer-events-auto ml-auto">
              <div className="w-full glass-panel p-6">
                <h3 className="text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                  <BarChart3 size={16} className="text-accent" />
                  Network Throughput
                </h3>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#00d4ff" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" hide />
                      <YAxis hide />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '8px' }}
                        itemStyle={{ color: '#00d4ff' }}
                      />
                      <Area type="monotone" dataKey="traffic" stroke="#00d4ff" fillOpacity={1} fill="url(#colorTraffic)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="w-96 glass-panel p-6 pointer-events-auto">
                <h3 className="text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                  <AlertTriangle size={16} className="text-rose-400" />
                  Threat Distribution
                </h3>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <XAxis dataKey="time" hide />
                      <YAxis hide />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '8px' }}
                        itemStyle={{ color: '#fb7185' }}
                      />
                      <Line type="stepAfter" dataKey="attacks" stroke="#fb7185" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
        </div>

        {/* Timeline Replay System */}
        <div className={cn(
          "absolute bottom-[84px] md:bottom-8 left-1/2 -translate-x-1/2 w-[95%] md:w-[90%] max-w-2xl z-20 pointer-events-auto transition-all duration-500",
          isZenMode && "translate-y-32 opacity-0"
        )}>
          <div className="glass-panel p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsReplaying(!isReplaying)}
                  className="w-8 h-8 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-accent hover:bg-accent/40 transition-all"
                >
                  {isReplaying ? <Activity size={16} className="animate-pulse" /> : <Zap size={16} />}
                </button>
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                  {isReplaying ? "REPLAYING HISTORICAL TELEMETRY" : "LIVE PULSE MODE"}
                </span>
              </div>
              <span className="text-[10px] font-mono text-accent">T-MINUS {100 - timelineValue}m</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={timelineValue} 
              onChange={(e) => setTimelineValue(parseInt(e.target.value))}
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-accent"
            />
          </div>
        </div>

        {/* Mobile Nav */}
        <div className={cn(
          "md:hidden h-16 border-t border-glass-border flex items-center justify-around px-2 z-40 bg-bg/95 backdrop-blur-xl transition-all duration-500",
          isZenMode && "translate-y-16 opacity-0"
        )}>
          <button onClick={() => setActiveTab('intelligence')} className={cn("p-2", activeTab === 'intelligence' ? "text-accent" : "text-slate-500")}>
            <Shield size={20} />
          </button>
          <button onClick={() => setActiveTab('threat')} className={cn("p-2", activeTab === 'threat' ? "text-accent" : "text-slate-500")}>
            <ShieldAlert size={20} />
          </button>
          <button onClick={() => setActiveTab('traffic')} className={cn("p-2", activeTab === 'traffic' ? "text-accent" : "text-slate-500")}>
            <Activity size={20} />
          </button>
          <button onClick={() => setActiveTab('bgp')} className={cn("p-2", activeTab === 'bgp' ? "text-accent" : "text-slate-500")}>
            <Zap size={20} />
          </button>
          <button onClick={() => setSimulationMode(!simulationMode)} className={cn("p-2", simulationMode ? "text-rose-400" : "text-slate-500")}>
            <ShieldAlert size={20} />
          </button>
        </div>
        {/* Zen Mode Restore Button */}
        <AnimatePresence>
          {isZenMode && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => setIsZenMode(false)}
              className="fixed top-6 right-6 z-50 w-12 h-12 rounded-full bg-accent text-bg shadow-[0_0_20px_rgba(0,212,255,0.5)] flex items-center justify-center hover:scale-110 transition-transform"
              title="Exit Full View"
            >
              <X size={24} />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Mobile Data Toggle FAB */}
        <AnimatePresence>
          {!isZenMode && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => setShowPanels(!showPanels)}
              className="fixed bottom-20 right-6 z-50 md:hidden w-12 h-12 rounded-full bg-highlight/20 backdrop-blur-xl border border-glass-border text-accent shadow-[0_0_15px_rgba(0,212,255,0.2)] flex items-center justify-center"
              title={showPanels ? "Hide Data" : "Show Data"}
            >
              <BarChart3 size={20} className={cn(showPanels && "text-accent")} />
            </motion.button>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
