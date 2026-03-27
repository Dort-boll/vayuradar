import React, { useEffect, useState } from 'react';
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
  getOpenPhish
} from '../services/vayuAsmApi';
import { Globe, Shield, Database, Activity, Search, ExternalLink, AlertCircle, Network, Server, Bug, Ghost, Link2 } from 'lucide-react';
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
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [
          radar, asn, bgpView, updates, block, dns,
          threatFox, blocklistDe, torNodes, bambenek, openPhish
        ] = await Promise.all([
          getRadarTopRanking().catch(() => null),
          getAsnOverview(15169).catch(() => null), // Google ASN
          getBgpViewAsn(13335).catch(() => null), // Cloudflare ASN
          getBgpUpdates(3333).catch(() => ({ data: { updates: [] } })), // RIPE ASN
          getFireholBlocklist().catch(() => ""),
          resolveDns("google.com").catch(() => null),
          getThreatFoxFeed().catch(() => null),
          getBlocklistDe().catch(() => ""),
          getTorExitNodes().catch(() => ""),
          getBambenekDga().catch(() => ""),
          getOpenPhish().catch(() => "")
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
      } catch (err) {
        setError("Failed to fetch intelligence data. Check CORS or API status.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 animate-pulse">
        <Database className="text-accent w-12 h-12 animate-bounce" />
        <span className="text-xs font-mono text-accent uppercase tracking-widest">Synchronizing Intelligence Feed...</span>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6 space-y-6">
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
        <div className="glass-panel p-5 space-y-4 border-l-2 border-accent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="text-accent w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300">Cloudflare Radar</h3>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">TOP RANKING</span>
          </div>
          <div className="space-y-2">
            {radarData?.result?.ranking?.slice(0, 5).map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-2 bg-slate-900/50 rounded border border-slate-800/50 hover:border-accent/30 transition-colors group">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-slate-500 w-4">{i + 1}</span>
                  <span className="text-xs text-slate-300 font-medium">{item.domain}</span>
                </div>
                <ExternalLink className="w-3 h-3 text-slate-600 group-hover:text-accent transition-colors cursor-pointer" />
              </div>
            )) || <p className="text-[10px] text-slate-600 italic">No ranking data available</p>}
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
              {blocklist ? blocklist.split('\n').slice(0, 50).join('\n') : 'Blocklist empty or unavailable'}
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
            {threatFoxData?.data ? threatFoxData.data.slice(0, 10).map((ioc: any, i: number) => (
              <div key={i} className="p-2 bg-slate-900/50 rounded border border-slate-800/50 text-[9px] font-mono">
                <div className="flex justify-between mb-1">
                  <span className="text-fuchsia-400 font-bold truncate max-w-[150px]">{ioc.ioc_value}</span>
                  <span className="text-slate-500">{ioc.threat_type}</span>
                </div>
                <div className="text-slate-400 truncate">Tags: {ioc.tags ? ioc.tags.join(', ') : 'none'}</div>
              </div>
            )) : (
              <p className="text-[10px] text-slate-600 italic">No ThreatFox data available</p>
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
              {blocklistDeData ? blocklistDeData.split('\n').slice(0, 50).join('\n') : 'Blocklist.de unavailable'}
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
              {torNodesData ? torNodesData.split('\n').filter(l => !l.startsWith('#')).slice(0, 50).join('\n') : 'Tor nodes unavailable'}
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
              {bambenekDgaData ? bambenekDgaData.split('\n').filter(l => !l.startsWith('#')).slice(0, 50).join('\n') : 'DGA feed unavailable'}
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
              {openPhishData ? openPhishData.split('\n').slice(0, 50).join('\n') : 'OpenPhish feed unavailable'}
            </pre>
          </div>
          <p className="text-[8px] text-slate-500 italic">
            Community-updated phishing URL feed.
          </p>
        </div>
      </div>
    </div>
  );
};
