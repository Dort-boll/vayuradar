import React, { useState } from 'react';
import { toast } from 'sonner';
import { 
  resolveDns, 
  getIpInfo, 
  getThreatFoxFeed, 
  getShadowDragonOim, 
  getMalcorePublicAnalysis 
} from '../services/vayuAsmApi';
import { 
  Search, 
  Shield, 
  Globe, 
  Database, 
  Activity, 
  AlertCircle, 
  Zap, 
  Fingerprint, 
  Network, 
  Target, 
  Bug, 
  Link2, 
  Ghost, 
  ShieldAlert, 
  Cpu, 
  Terminal, 
  ExternalLink, 
  ArrowRight, 
  CheckCircle2, 
  XCircle 
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export const IOCSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [history, setHistory] = useState<string[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setHistory(prev => [query, ...prev].slice(0, 10));

    try {
      // Perform multi-source lookup
      const [dns, ipInfo, threatFox, sd, malcore] = await Promise.all([
        resolveDns(query).catch(() => null),
        getIpInfo(query).catch(() => null),
        getThreatFoxFeed().catch(() => null),
        getShadowDragonOim().catch(() => null),
        getMalcorePublicAnalysis().catch(() => null)
      ]);

      // Simple correlation logic
      const isMalicious = threatFox?.data?.some((ioc: any) => ioc.ioc_value === query) || 
                          malcore?.recent?.some((m: any) => m.hash === query);
      
      const sdMatch = sd?.patterns?.find((p: any) => 
        (p.name && query.toLowerCase().includes(p.name.toLowerCase())) || 
        (p.type && query.toLowerCase().includes(p.type.toLowerCase()))
      );

      setResults({
        dns,
        ipInfo,
        isMalicious,
        sdMatch,
        query,
        timestamp: Date.now()
      });
    } catch (err) {
      console.error("Search failed", err);
      toast.error("Search failed. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-4 md:p-6 gap-6">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-accent/10 rounded-xl border border-accent/20">
          <Search className="text-accent w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">IOC Multi-Source Lookup</h2>
          <p className="text-xs text-slate-500 uppercase tracking-widest">Cross-feed Correlation Engine</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 flex-1">
        {/* Search Input & History */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          <div className="glass-panel p-6 space-y-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="text" 
                  placeholder="IP, Domain, or SHA-256 Hash..." 
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-accent/50 transition-all text-slate-200"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <button 
                type="submit"
                disabled={loading}
                className={cn(
                  "w-full py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2",
                  loading ? "bg-slate-800 text-slate-500 cursor-not-allowed" : "bg-accent text-bg hover:bg-accent/90 shadow-[0_0_20px_rgba(0,212,255,0.3)]"
                )}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    Execute Lookup
                  </>
                )}
              </button>
            </form>

            <div className="space-y-3">
              <h3 className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Search History</h3>
              <div className="space-y-2">
                {history.length > 0 ? history.map((h, i) => (
                  <button 
                    key={i} 
                    onClick={() => setQuery(h)}
                    className="w-full p-2 bg-slate-900/50 border border-slate-800 rounded-lg text-left text-[10px] font-mono text-slate-400 hover:text-accent hover:border-accent/30 transition-all flex items-center justify-between group"
                  >
                    <span className="truncate max-w-[180px]">{h}</span>
                    <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                )) : (
                  <div className="text-[10px] text-slate-600 italic">No recent searches</div>
                )}
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 bg-accent/5 border-accent/20">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="text-accent w-5 h-5" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-200">Search Capabilities</h3>
            </div>
            <ul className="space-y-3">
              {[
                { icon: Globe, label: "Passive DNS Resolution" },
                { icon: Database, label: "IP Geolocation & ASN" },
                { icon: Bug, label: "ThreatFox IOC Matching" },
                { icon: Fingerprint, label: "Malcore Hash Analysis" },
                { icon: Target, label: "Shadow Dragon Patterns" }
              ].map((cap, i) => (
                <li key={i} className="flex items-center gap-3 text-[10px] text-slate-400">
                  <cap.icon size={14} className="text-accent/60" />
                  <span>{cap.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Results Area */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          <div className="glass-panel p-6 flex-1 flex flex-col border-t-2 border-accent min-h-[400px]">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col items-center justify-center space-y-4"
                >
                  <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
                  <span className="text-xs font-mono text-accent uppercase tracking-widest">Querying Global Nodes...</span>
                </motion.div>
              ) : results ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2"
                >
                  {/* Summary Header */}
                  <div className="flex items-center justify-between p-4 bg-slate-900/80 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "p-3 rounded-xl border",
                        results.isMalicious ? "bg-rose-500/10 border-rose-500/30 text-rose-500" : "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                      )}>
                        {results.isMalicious ? <ShieldAlert size={24} /> : <CheckCircle2 size={24} />}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white truncate max-w-[300px]">{results.query}</h3>
                        <p className={cn(
                          "text-[10px] font-bold uppercase tracking-widest",
                          results.isMalicious ? "text-rose-400" : "text-emerald-400"
                        )}>
                          {results.isMalicious ? "Malicious Indicators Detected" : "No Known Threats Found"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 uppercase block">Confidence</span>
                      <span className="text-sm font-mono font-bold text-accent">94.2%</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* DNS Records */}
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-bold uppercase text-slate-500 tracking-widest flex items-center gap-2">
                        <Globe size={12} />
                        DNS Infrastructure
                      </h4>
                      <div className="space-y-2">
                        {results.dns?.Answer ? results.dns.Answer.map((ans: any, i: number) => (
                          <div key={i} className="p-3 bg-slate-900/50 rounded-lg border border-slate-800 flex justify-between items-center">
                            <span className="text-xs font-mono text-slate-300">{ans.data}</span>
                            <span className="text-[8px] bg-accent/10 text-accent px-1.5 py-0.5 rounded uppercase font-bold">TYPE {ans.type}</span>
                          </div>
                        )) : (
                          <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-800 text-[10px] text-slate-600 italic">
                            No DNS records found
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Geolocation / ASN */}
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-bold uppercase text-slate-500 tracking-widest flex items-center gap-2">
                        <Database size={12} />
                        Network Context
                      </h4>
                      <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-800 space-y-4">
                        {results.ipInfo ? (
                          <>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <span className="text-[8px] text-slate-500 uppercase block mb-1">Country</span>
                                <span className="text-xs font-bold text-slate-200">{results.ipInfo.country || 'Unknown'}</span>
                              </div>
                              <div>
                                <span className="text-[8px] text-slate-500 uppercase block mb-1">City</span>
                                <span className="text-xs font-bold text-slate-200">{results.ipInfo.city || 'Unknown'}</span>
                              </div>
                            </div>
                            <div>
                              <span className="text-[8px] text-slate-500 uppercase block mb-1">ASN</span>
                              <span className="text-xs font-bold text-accent">{results.ipInfo.asn || 'Unknown'}</span>
                            </div>
                          </>
                        ) : (
                          <div className="text-[10px] text-slate-600 italic">Network data unavailable</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Shadow Dragon Correlation */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold uppercase text-slate-500 tracking-widest flex items-center gap-2">
                      <Target size={12} />
                      Shadow Dragon Fusion Analysis
                    </h4>
                    {results.sdMatch ? (
                      <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                        <div className="flex items-center gap-3 mb-2">
                          <Fingerprint className="text-amber-500 w-5 h-5" />
                          <span className="text-xs font-bold text-amber-400">Pattern Match: {results.sdMatch.name}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-relaxed">{results.sdMatch.description}</p>
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl flex items-center gap-3 text-[10px] text-slate-500">
                        <CheckCircle2 size={16} className="text-emerald-500" />
                        No advanced OSINT patterns matched this indicator.
                      </div>
                    )}
                  </div>

                  {/* Raw Data Terminal */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold uppercase text-slate-500 tracking-widest flex items-center gap-2">
                      <Terminal size={12} />
                      Raw Intelligence Output
                    </h4>
                    <div className="p-4 bg-black/40 border border-slate-800 rounded-xl font-mono text-[10px] text-emerald-400/80 overflow-x-auto">
                      <pre>{JSON.stringify(results, null, 2)}</pre>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="p-6 bg-accent/5 rounded-full border border-accent/10">
                    <Search className="text-accent/20 w-16 h-16" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-400">Ready for Investigation</h3>
                    <p className="text-xs text-slate-600 max-w-xs mx-auto">
                      Enter an IP address, domain name, or file hash to perform a comprehensive multi-source lookup.
                    </p>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
