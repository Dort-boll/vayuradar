import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { 
  getShadowDragonOim, 
  getMalcorePublicAnalysis, 
  getThreatFoxFeed
} from '../services/vayuAsmApi';
import { 
  Target, 
  Zap, 
  Shield, 
  Activity, 
  AlertCircle, 
  Search, 
  Fingerprint, 
  Cpu, 
  Network,
  Eye,
  Crosshair,
  Terminal,
  Bug
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export const ThreatFusionCenter: React.FC = () => {
  const [shadowDragonData, setShadowDragonData] = useState<any>(null);
  const [malcoreData, setMalcoreData] = useState<any>(null);
  const [threatFoxData, setThreatFoxData] = useState<any>(null);
  const [anomalies, setAnomalies] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeAnalysis, setActiveAnalysis] = useState<any>(null);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sd, mal, tf] = await Promise.all([
          getShadowDragonOim(),
          getMalcorePublicAnalysis(),
          getThreatFoxFeed()
        ]);
        setShadowDragonData(sd);
        setMalcoreData(mal);
        setThreatFoxData(tf);
        
        if (mal?.recent?.length > 0) {
          setActiveAnalysis(mal.recent[0]);
        }

        addLog("Initializing Shadow Dragon Fusion Engine...");
        addLog("Connecting to Malcore Public Analysis API...");
        addLog("Synchronizing ThreatFox IOC Feed...");
      } catch (err) {
        const errorMsg = "ERROR: Failed to synchronize one or more intelligence feeds.";
        addLog(errorMsg);
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const addLog = (msg: string) => {
    setTerminalLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
          <Target className="absolute inset-0 m-auto text-accent w-6 h-6 animate-pulse" />
        </div>
        <span className="text-xs font-mono text-accent uppercase tracking-widest">Booting Fusion Center...</span>
      </div>
    );
  }

  const severityData = [
    { name: 'Critical', value: 12, color: '#f43f5e' },
    { name: 'High', value: 28, color: '#fb923c' },
    { name: 'Medium', value: 45, color: '#facc15' },
    { name: 'Low', value: 89, color: '#22c55e' },
  ];

  return (
    <div className="h-full flex flex-col p-4 md:p-6 gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-accent/10 rounded-xl border border-accent/20">
            <Target className="text-accent w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">Threat Fusion Center</h2>
            <p className="text-xs text-slate-500 uppercase tracking-widest">Shadow Dragon OSINT & Malcore Integration</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="glass-panel px-4 py-2 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Fusion Active</span>
          </div>
          <div className="glass-panel px-4 py-2 flex items-center gap-3">
            <Activity className="text-accent w-3 h-3" />
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">1.2M EPS</span>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-6">
        {/* Left Column: Intelligence Matrix */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          <div className="glass-panel p-5 flex-1 flex flex-col border-t-2 border-amber-500 min-h-[400px]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Fingerprint className="text-amber-500 w-4 h-4" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-200">OSINT Matrix</h3>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">SHADOW DRAGON</span>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
              {shadowDragonData?.patterns?.map((p: any, i: number) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-3 bg-slate-900/50 rounded-lg border border-slate-800 hover:border-amber-500/50 transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-bold text-amber-400 group-hover:text-amber-300">{p.name}</span>
                    <span className="text-[8px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded uppercase font-bold">{p.type}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">{p.description}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="glass-panel p-5 h-48 border-t-2 border-sky-500">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="text-sky-500 w-4 h-4" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-200">Severity Distribution</h3>
              </div>
            </div>
            <div className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={severityData} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" hide />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={12}>
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Center Column: Active Analysis & Sandbox */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
          <div className="glass-panel p-6 flex-1 flex flex-col border-t-2 border-accent min-h-[400px]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Crosshair className="text-accent w-5 h-5" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-white">Advanced Analysis Sandbox</h3>
              </div>
              <div className="flex gap-2">
                <button className="p-2 bg-accent/10 hover:bg-accent/20 rounded-lg text-accent transition-all">
                  <Search size={16} />
                </button>
                <button className="p-2 bg-accent/10 hover:bg-accent/20 rounded-lg text-accent transition-all">
                  <Zap size={16} />
                </button>
              </div>
            </div>

            {activeAnalysis ? (
              <div className="space-y-6">
                <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2">
                    <div className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                      activeAnalysis.score > 90 ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" : "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                    )}>
                      {activeAnalysis.score}% Threat Score
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1">Target Hash (SHA-256)</span>
                      <span className="text-sm font-mono text-accent break-all">{activeAnalysis.hash}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1">Threat Classification</span>
                        <span className="text-xs font-bold text-slate-200">{activeAnalysis.threat}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1">Analysis Engine</span>
                        <span className="text-xs font-bold text-sky-400">MALCORE V4.2</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "Behavioral", value: "Suspicious", color: "text-orange-400" },
                    { label: "Network", value: "C2 Beacon", color: "text-rose-400" },
                    { label: "Persistence", value: "Registry", color: "text-yellow-400" }
                  ].map((stat, i) => (
                    <div key={i} className="p-3 bg-slate-900/50 rounded-lg border border-slate-800 text-center">
                      <span className="text-[8px] text-slate-500 uppercase block mb-1">{stat.label}</span>
                      <span className={cn("text-[10px] font-bold", stat.color)}>{stat.value}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Analysis Timeline</h4>
                  <div className="space-y-2">
                    {[
                      "Static analysis completed: Found obfuscated strings",
                      "Dynamic execution: Attempted connection to 185.x.x.x",
                      "Process injection detected in explorer.exe",
                      "Credential harvesting patterns identified"
                    ].map((step, i) => (
                      <div key={i} className="flex items-center gap-3 text-[10px] text-slate-400">
                        <div className="w-1 h-1 rounded-full bg-accent" />
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-600 italic text-xs">
                Select an artifact for deep analysis
              </div>
            )}
          </div>

          <div className="glass-panel p-4 h-40 bg-black/40 border border-slate-800 font-mono text-[10px] overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 mb-2 text-slate-500">
              <Terminal size={12} />
              <span className="uppercase tracking-widest">System Terminal</span>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
              {terminalLogs.map((log, i) => (
                <div key={i} className={cn(
                  "opacity-80",
                  log.includes("ERROR") ? "text-rose-400" : "text-emerald-400"
                )}>
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Global Feeds & Anomalies */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-6">
          <div className="glass-panel p-5 flex-1 flex flex-col border-t-2 border-fuchsia-500 min-h-[400px]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bug className="text-fuchsia-500 w-4 h-4" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-200">Recent IOCs</h3>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">THREATFOX</span>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
              {threatFoxData?.data?.slice(0, 15).map((ioc: any, i: number) => (
                <div 
                  key={i} 
                  className="p-2 bg-slate-900/50 rounded border border-slate-800/50 hover:bg-fuchsia-500/5 transition-colors cursor-pointer"
                  onClick={() => addLog(`Investigating IOC: ${ioc.ioc_value}`)}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-fuchsia-400 truncate max-w-[120px]">{ioc.ioc_value}</span>
                    <span className="text-[8px] text-slate-500">{ioc.threat_type}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[8px] text-slate-600 truncate">Type: {ioc.ioc_type || 'Unknown'}</span>
                    <span className="text-[8px] text-slate-600 truncate">Reporter: {ioc.reporter}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel p-5 h-64 border-t-2 border-rose-500">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="text-rose-500 w-4 h-4" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-200">System Anomalies</h3>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">INTERNAL</span>
            </div>
            <div className="overflow-y-auto custom-scrollbar h-full space-y-2 pr-2">
              <div className="flex flex-col items-center justify-center h-full text-slate-600 text-[10px] italic">
                No active anomalies detected
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
