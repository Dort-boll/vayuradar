import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { 
  getRadarTopRanking, 
  getAsnOverview, 
  getFireholBlocklist, 
  resolveDns,
  getBgpViewAsn,
  getBgpUpdates,
  getThreatFoxFeed,
  getBlocklistDe,
  getTorExitNodes,
  getBambenekDga,
  getOpenPhish,
  getShadowDragonOim,
  getMalcorePublicAnalysis
} from '../services/vayuAsmApi';
import { Globe, Shield, Database, Activity, Search, ExternalLink, AlertCircle, Network, Server, Bug, Ghost, Link2, Zap, Target, Eye } from 'lucide-react';
import { cn } from '../lib/utils';

export const IntelligencePanel: React.FC = () => {
  const [radarData, setRadarData] = useState<any>(null);
  const [asnData, setAsnData] = useState<any>(null);
  const [bgpViewData, setBgpViewData] = useState<any>(null);
  const [bgpUpdates, setBgpUpdates] = useState<any[]>([]);
  const [blocklist, setBlocklist] = useState<string>("");
  const [dnsResult, setDnsResult] = useState<any>(null);
  
  // New OSINT feeds
  const [threatFoxData, setThreatFoxData] = useState<any>(null);
  const [blocklistDeData, setBlocklistDeData] = useState<string>("");
  const [torNodesData, setTorNodesData] = useState<string>("");
  const [bambenekDgaData, setBambenekDgaData] = useState<string>("");
  const [openPhishData, setOpenPhishData] = useState<string>("");
  
  // Shadow Dragon & Malcore
  const [shadowDragonOim, setShadowDragonOim] = useState<any>(null);
  const [malcoreData, setMalcoreData] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [
          radar, asn, bgpView, updates, block, dns,
          threatFox, blocklistDe, torNodes, bambenek, openPhish,
          shadowDragon, malcore
        ] = await Promise.all([
          getRadarTopRanking().catch(() => null),
          getAsnOverview(15169).catch(() => null), // Google ASN
          getBgpViewAsn(15169).catch(() => null), // Google ASN
          getBgpUpdates(3333).catch(() => ({ data: { updates: [] } })), // RIPE ASN
          getFireholBlocklist().catch(() => ""),
          resolveDns("google.com").catch(() => null),
          getThreatFoxFeed().catch(() => null),
          getBlocklistDe().catch(() => ""),
          getTorExitNodes().catch(() => ""),
          getBambenekDga().catch(() => ""),
          getOpenPhish().catch(() => ""),
          getShadowDragonOim().catch(() => null),
          getMalcorePublicAnalysis().catch(() => null)
        ]);

        setRadarData(radar);
        setAsnData(asn);
        setBgpViewData(bgpView);
        setBgpUpdates(updates?.data?.updates?.slice(0, 10) || []);
        setBlocklist(block);
        setDnsResult(dns);
        
        setThreatFoxData(threatFox);
        setBlocklistDeData(blocklistDe);
        setTorNodesData(torNodes);
        setBambenekDgaData(bambenek);
        setOpenPhishData(openPhish);
        
        setShadowDragonOim(shadowDragon);
        setMalcoreData(malcore);
      } catch (err) {
        const errorMsg = "Failed to fetch intelligence data. Check CORS or API status.";
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex flex-col items-center justify-center h-full space-y-4"
      >
        <Database className="text-accent w-12 h-12 animate-bounce" />
        <span className="text-xs font-mono text-accent uppercase tracking-widest animate-pulse">Synchronizing Intelligence Feed...</span>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="h-full p-4 md:p-6 space-y-6"
    >
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent/10 rounded-lg">
            <Shield className="text-accent w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-100">Global Intelligence Fusion</h2>
            <p className="text-xs text-slate-500 uppercase tracking-wider">Public Data Aggregation Engine</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold text-emerald-500 uppercase">Live Public Feed</span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center gap-3">
          <AlertCircle className="text-rose-500 w-5 h-5" />
          <p className="text-xs text-rose-400 font-medium">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Cloudflare Radar Section */}
        <div className="glass-panel p-5 space-y-4 border-l-2 border-blue-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="text-blue-500 w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300">Global Traffic Ranking</h3>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">RADAR</span>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
            {radarData?.result?.top ? radarData.result.top.map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-2 bg-slate-900/50 rounded border border-slate-800/50 hover:bg-blue-500/5 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-500 w-4">{item.rank}</span>
                  <span className="text-[10px] font-bold text-blue-400">{item.domain}</span>
                </div>
                {item.category && (
                  <span className="text-[8px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 uppercase">
                    {item.category}
                  </span>
                )}
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Globe className="w-6 h-6 text-slate-700 mb-2" />
                <p className="text-[10px] text-slate-500 italic">Radar ranking unavailable</p>
              </div>
            )}
          </div>
        </div>

        {/* BGPView Backbone Section */}
        <div className="glass-panel p-5 space-y-4 border-l-2 border-indigo-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="text-indigo-500 w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300">Backbone Telemetry</h3>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">BGPVIEW</span>
          </div>
          {bgpViewData?.data ? (
            <div className="space-y-3">
              <div className="p-3 bg-slate-900/50 rounded border border-slate-800/50">
                <span className="text-[8px] text-slate-500 uppercase block mb-1">Entity</span>
                <span className="text-[10px] font-bold text-indigo-400">{bgpViewData.data.name}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-slate-900/50 rounded border border-slate-800/50">
                  <span className="text-[8px] text-slate-500 uppercase block mb-1">Country</span>
                  <span className="text-[10px] font-bold text-slate-300">{bgpViewData.data.country_code}</span>
                </div>
                <div className="p-2 bg-slate-900/50 rounded border border-slate-800/50">
                  <span className="text-[8px] text-slate-500 uppercase block mb-1">Website</span>
                  <span className="text-[10px] font-bold text-slate-300 truncate">{bgpViewData.data.website}</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-[10px] text-slate-600 italic">Backbone data unavailable</p>
          )}
        </div>

        {/* RIPEstat ASN Section */}
        <div className="glass-panel p-5 space-y-4 border-l-2 border-orange-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="text-orange-500 w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300">ASN Intelligence</h3>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">AS15169</span>
          </div>
          {asnData?.data ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-900/50 rounded border border-slate-800/50">
                  <span className="text-[8px] text-slate-500 uppercase block mb-1">Holder</span>
                  <span className="text-[10px] font-bold text-orange-400">{asnData.data.holder}</span>
                </div>
                <div className="p-3 bg-slate-900/50 rounded border border-slate-800/50">
                  <span className="text-[8px] text-slate-500 uppercase block mb-1">Announced</span>
                  <span className="text-[10px] font-bold text-emerald-400">{asnData.data.is_announced ? 'YES' : 'NO'}</span>
                </div>
              </div>
              <div className="p-3 bg-slate-900/50 rounded border border-slate-800/50">
                <span className="text-[8px] text-slate-500 uppercase block mb-1">Routing Status</span>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Global infrastructure routing data for Google LLC. Multiple peering points detected across 140+ countries.
                </p>
              </div>
            </div>
          ) : (
            <p className="text-[10px] text-slate-600 italic">ASN data unavailable</p>
          )}
        </div>

        {/* RIPE BGP Updates Section */}
        <div className="glass-panel p-5 space-y-4 border-l-2 border-yellow-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Network className="text-yellow-500 w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300">Live BGP Updates</h3>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">RIPEstat</span>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
            {bgpUpdates.length > 0 ? bgpUpdates.map((upd: any, i: number) => (
              <div key={i} className="p-2 bg-slate-900/50 rounded border border-slate-800/50 text-[9px] font-mono">
                <div className="flex justify-between mb-1">
                  <span className={cn("uppercase font-bold", upd.type === 'A' ? "text-emerald-400" : "text-rose-400")}>
                    {upd.type === 'A' ? 'Announce' : 'Withdraw'}
                  </span>
                  <span className="text-slate-600">{upd.timestamp.split('T')[1]}</span>
                </div>
                <div className="text-slate-400 truncate">{upd.prefix}</div>
              </div>
            )) : (
              <p className="text-[10px] text-slate-600 italic">No recent BGP updates detected</p>
            )}
          </div>
        </div>

        {/* DNS Resolution Section */}
        <div className="glass-panel p-5 space-y-4 border-l-2 border-emerald-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="text-emerald-500 w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300">Passive DNS Fusion</h3>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">google.com</span>
          </div>
          <div className="space-y-2">
            {dnsResult?.Answer?.map((ans: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-2 bg-slate-900/50 rounded border border-slate-800/50">
                <span className="text-[10px] font-mono text-emerald-400">{ans.data}</span>
                <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded uppercase font-bold">TYPE {ans.type === 1 ? 'A' : ans.type}</span>
              </div>
            )) || <p className="text-[10px] text-slate-600 italic">No DNS records resolved</p>}
          </div>
        </div>

        {/* Blocklist Section */}
        <div className="glass-panel p-5 space-y-4 border-l-2 border-rose-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="text-rose-500 w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300">Public Threat Datasets</h3>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">FIREHOL L1</span>
          </div>
          <div className="p-3 bg-slate-900/50 rounded border border-slate-800/50 h-32 overflow-y-auto custom-scrollbar">
            <pre className="text-[9px] font-mono text-rose-400 leading-tight">
              {blocklist ? blocklist.split('\n').filter(l => l.trim() && !l.startsWith('#')).slice(0, 50).join('\n') : 'Blocklist empty or unavailable'}
            </pre>
          </div>
          <p className="text-[8px] text-slate-500 italic">
            Aggregated from FireHOL Level 1 public IP sets.
          </p>
        </div>
        {/* ThreatFox Section */}
        <div className="glass-panel p-5 space-y-4 border-l-2 border-fuchsia-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bug className="text-fuchsia-500 w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300">ThreatFox IOCs</h3>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">ABUSE.CH</span>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
            {threatFoxData?.data && threatFoxData.data.length > 0 ? threatFoxData.data.slice(0, 10).map((ioc: any, i: number) => (
              <div key={i} className="p-3 bg-slate-900/50 rounded border border-slate-800/50 text-[9px] font-mono hover:bg-fuchsia-500/5 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-fuchsia-400 font-bold break-all mr-2">{ioc.ioc_value}</span>
                  <span className="px-1.5 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-300 text-[8px] uppercase whitespace-nowrap">
                    {ioc.confidence_level}% CONF
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-1">
                  <div>
                    <span className="text-slate-500 uppercase text-[8px] block">Type</span>
                    <span className="text-slate-300">{ioc.ioc_type || 'Unknown'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase text-[8px] block">Threat</span>
                    <span className="text-rose-400">{ioc.threat_type || 'Unknown'}</span>
                  </div>
                </div>
                <div className="text-slate-500 truncate text-[8px] mt-2 pt-2 border-t border-slate-800/50">
                  Tags: <span className="text-slate-400">{ioc.tags ? (Array.isArray(ioc.tags) ? ioc.tags.join(', ') : ioc.tags) : 'none'}</span>
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Bug className="w-6 h-6 text-slate-700 mb-2" />
                <p className="text-[10px] text-slate-500 italic">No ThreatFox data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Blocklist.de Section */}
        <div className="glass-panel p-5 space-y-4 border-l-2 border-red-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="text-red-500 w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300">Blocklist.de</h3>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">ATTACKERS</span>
          </div>
          <div className="p-3 bg-slate-900/50 rounded border border-slate-800/50 h-32 overflow-y-auto custom-scrollbar">
            <pre className="text-[9px] font-mono text-red-400 leading-tight">
              {blocklistDeData ? blocklistDeData.split('\n').filter(l => l.trim() && !l.startsWith('#')).slice(0, 50).join('\n') : 'Blocklist.de unavailable'}
            </pre>
          </div>
          <p className="text-[8px] text-slate-500 italic">
            Real recorded attacks against services.
          </p>
        </div>

        {/* Tor Exit Nodes Section */}
        <div className="glass-panel p-5 space-y-4 border-l-2 border-purple-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ghost className="text-purple-500 w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300">Tor Exit Nodes</h3>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">TOR PROJECT</span>
          </div>
          <div className="p-3 bg-slate-900/50 rounded border border-slate-800/50 h-32 overflow-y-auto custom-scrollbar">
            <pre className="text-[9px] font-mono text-purple-400 leading-tight">
              {torNodesData ? torNodesData.split('\n').filter(l => l.trim() && !l.startsWith('#')).slice(0, 50).join('\n') : 'Tor nodes unavailable'}
            </pre>
          </div>
          <p className="text-[8px] text-slate-500 italic">
            Current list of Tor exit node IPs.
          </p>
        </div>

        {/* Bambenek DGA Section */}
        <div className="glass-panel p-5 space-y-4 border-l-2 border-cyan-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link2 className="text-cyan-500 w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300">Bambenek DGA</h3>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">BOTNETS</span>
          </div>
          <div className="p-3 bg-slate-900/50 rounded border border-slate-800/50 h-32 overflow-y-auto custom-scrollbar">
            <pre className="text-[9px] font-mono text-cyan-400 leading-tight">
              {bambenekDgaData ? bambenekDgaData.split('\n').filter(l => l.trim() && !l.startsWith('#')).slice(0, 50).join('\n') : 'DGA feed unavailable'}
            </pre>
          </div>
          <p className="text-[8px] text-slate-500 italic">
            Common DGA domains seen in malware campaigns.
          </p>
        </div>

        {/* OpenPhish Section */}
        <div className="glass-panel p-5 space-y-4 border-l-2 border-pink-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="text-pink-500 w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300">OpenPhish</h3>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">PHISHING</span>
          </div>
          <div className="p-3 bg-slate-900/50 rounded border border-slate-800/50 h-32 overflow-y-auto custom-scrollbar">
            <pre className="text-[9px] font-mono text-pink-400 leading-tight truncate">
              {openPhishData ? openPhishData.split('\n').filter(l => l.trim() && !l.startsWith('#')).slice(0, 50).join('\n') : 'OpenPhish feed unavailable'}
            </pre>
          </div>
          <p className="text-[8px] text-slate-500 italic">
            Community-updated phishing URL feed.
          </p>
        </div>

        {/* Shadow Dragon OIM Section */}
        <div className="glass-panel p-5 space-y-4 border-l-2 border-amber-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="text-amber-500 w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300">Shadow Dragon OIM</h3>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">OSINT FUSION</span>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
            {shadowDragonOim?.patterns ? shadowDragonOim.patterns.map((p: any, i: number) => (
              <div key={i} className="p-2 bg-slate-900/50 rounded border border-slate-800/50 text-[9px] font-mono">
                <div className="flex justify-between mb-1">
                  <span className="text-amber-400 font-bold">{p.name}</span>
                  <span className="text-slate-500">{p.type}</span>
                </div>
                <div className="text-slate-400 leading-tight">{p.description}</div>
              </div>
            )) : (
              <p className="text-[10px] text-slate-600 italic">Shadow Dragon OIM data unavailable</p>
            )}
          </div>
        </div>

        {/* Malcore Analysis Section */}
        <div className="glass-panel p-5 space-y-4 border-l-2 border-sky-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="text-sky-500 w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300">Malcore Analysis</h3>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">MALWARE</span>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
            {malcoreData?.recent ? malcoreData.recent.map((m: any, i: number) => (
              <div key={i} className="p-2 bg-slate-900/50 rounded border border-slate-800/50 text-[9px] font-mono">
                <div className="flex justify-between mb-1">
                  <span className="text-sky-400 font-bold truncate max-w-[120px]">{m.hash}</span>
                  <span className={cn("px-1 rounded", m.score > 90 ? "bg-rose-500/20 text-rose-400" : "bg-sky-500/20 text-sky-400")}>
                    {m.score}%
                  </span>
                </div>
                <div className="text-slate-400">{m.threat}</div>
              </div>
            )) : (
              <p className="text-[10px] text-slate-600 italic">Malcore analysis data unavailable</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
