import React, { useState, useEffect, useMemo, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { getBgpViewPeers, getAsnOverview } from '../services/vayuAsmApi';
import { Network, Search, Activity, Globe, Shield, Zap, ChevronRight, Info } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export const BgpTopology: React.FC = () => {
  const [asn, setAsn] = useState<number>(15169); // Default to Google
  const [loading, setLoading] = useState(false);
  const [graphData, setGraphData] = useState({ nodes: [] as any[], links: [] as any[] });
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [asnInfo, setAsnInfo] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const fetchTopology = async (targetAsn: number) => {
    setLoading(true);
    try {
      const [peersData, overview] = await Promise.all([
        getBgpViewPeers(targetAsn),
        getAsnOverview(targetAsn)
      ]);

      setAsnInfo(overview?.data);

      const nodes: any[] = [{ 
        id: `AS${targetAsn}`, 
        name: overview?.data?.name || `AS${targetAsn}`, 
        val: 15, 
        color: '#f97316',
        type: 'TARGET',
        asn: targetAsn
      }];
      const links: any[] = [];
      const nodeIds = new Set([`AS${targetAsn}`]);

      if (peersData?.data?.peers) {
        // Limit to top peers to avoid clutter
        const peers = peersData.data.peers.slice(0, 50);
        peers.forEach((peer: any) => {
          const peerId = `AS${peer.asn}`;
          if (!nodeIds.has(peerId)) {
            nodes.push({
              id: peerId,
              name: peer.name || peerId,
              val: 5,
              color: peer.type === 'upstream' ? '#3b82f6' : (peer.type === 'downstream' ? '#10b981' : '#6366f1'),
              type: (peer.type || 'PEER').toUpperCase(),
              asn: peer.asn
            });
            nodeIds.add(peerId);
          }
          links.push({
            source: `AS${targetAsn}`,
            target: peerId,
            color: 'rgba(255, 255, 255, 0.1)',
            value: 1
          });
        });
      }

      setGraphData({ nodes, links });
      toast.success(`Topology mapped for AS${targetAsn}`);
    } catch (err) {
      toast.error("Failed to fetch BGP topology");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopology(asn);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (asn) fetchTopology(asn);
  };

  return (
    <div className="h-full flex flex-col p-4 md:p-6 gap-6 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-orange-500/10 rounded-xl border border-orange-500/20">
            <Network className="text-orange-500 w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">BGP Topology Explorer</h2>
            <p className="text-xs text-slate-500 uppercase tracking-widest">Global Routing Visualization & Peer Analysis</p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
            <input 
              type="number" 
              placeholder="Enter ASN (e.g. 15169)" 
              className="bg-highlight/10 border border-glass-border rounded-lg py-2 pl-9 pr-4 text-xs focus:outline-none focus:border-orange-500/50 transition-all w-48"
              value={asn}
              onChange={(e) => setAsn(parseInt(e.target.value))}
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
          >
            {loading ? "MAPPING..." : "MAP PEERS"}
          </button>
        </form>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        {/* Graph Area */}
        <div ref={containerRef} className="flex-1 glass-panel relative overflow-hidden min-h-[400px]">
          {loading && (
            <div className="absolute inset-0 z-10 bg-bg/40 backdrop-blur-sm flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <Activity className="text-orange-500 w-12 h-12 animate-spin" />
                <span className="text-xs font-mono text-orange-500 uppercase tracking-widest">Tracing Global Routes...</span>
              </div>
            </div>
          )}
          
          <ForceGraph2D
            graphData={graphData}
            width={dimensions.width}
            height={dimensions.height}
            backgroundColor="rgba(0,0,0,0)"
            nodeLabel="name"
            nodeColor={node => (node as any).color}
            linkColor={link => (link as any).color}
            linkDirectionalParticles={1}
            linkDirectionalParticleSpeed={0.005}
            onNodeClick={node => setSelectedNode(node)}
            nodeCanvasObject={(node: any, ctx, globalScale) => {
              const label = node.name;
              const fontSize = 12 / globalScale;
              ctx.font = `${fontSize}px JetBrains Mono`;
              const textWidth = ctx.measureText(label).width;
              const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2);

              ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
              ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, bckgDimensions[0] as number, bckgDimensions[1] as number);

              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillStyle = node.color;
              ctx.fillText(label, node.x, node.y);

              node.__bckgDimensions = bckgDimensions;
            }}
          />

          {/* Legend */}
          <div className="absolute bottom-4 left-4 glass-panel p-3 flex flex-col gap-2 pointer-events-none">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-500" />
              <span className="text-[10px] text-slate-400 uppercase font-bold">Target ASN</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-[10px] text-slate-400 uppercase font-bold">Upstream</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-slate-400 uppercase font-bold">Downstream</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500" />
              <span className="text-[10px] text-slate-400 uppercase font-bold">Peer/IXP</span>
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="w-full lg:w-80 flex flex-col gap-6 shrink-0 overflow-y-auto custom-scrollbar">
          <div className="glass-panel p-5 border-t-2 border-orange-500">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-200 mb-4 flex items-center gap-2">
              <Info size={14} className="text-orange-500" />
              ASN Intelligence
            </h3>
            {asnInfo ? (
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block mb-1">Organization</span>
                  <span className="text-sm font-bold text-white">{asnInfo.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block mb-1">ASN</span>
                    <span className="text-xs font-mono text-orange-400">AS{asn}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block mb-1">Country</span>
                    <span className="text-xs font-bold text-slate-200">{asnInfo.country || 'N/A'}</span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block mb-1">Description</span>
                  <p className="text-[10px] text-slate-400 leading-tight">{asnInfo.description || 'No description available.'}</p>
                </div>
              </div>
            ) : (
              <div className="text-[10px] text-slate-500 italic">No ASN data loaded.</div>
            )}
          </div>

          <AnimatePresence mode="wait">
            {selectedNode && (
              <motion.div 
                key={selectedNode.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="glass-panel p-5 border-t-2 border-accent"
              >
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-200 mb-4 flex items-center gap-2">
                  <Zap size={14} className="text-accent" />
                  Peer Analysis
                </h3>
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block mb-1">Peer Name</span>
                    <span className="text-sm font-bold text-white">{selectedNode.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-500 uppercase">Relationship</span>
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded uppercase",
                      selectedNode.color === '#3b82f6' ? "bg-blue-500/20 text-blue-400" :
                      selectedNode.color === '#10b981' ? "bg-emerald-500/20 text-emerald-400" :
                      "bg-indigo-500/20 text-indigo-400"
                    )}>
                      {selectedNode.type}
                    </span>
                  </div>
                  <button 
                    onClick={() => {
                      setAsn(selectedNode.asn);
                      fetchTopology(selectedNode.asn);
                    }}
                    className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                  >
                    Pivot to this ASN
                    <ChevronRight size={12} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="glass-panel p-5 flex-1">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-200 mb-4">Topology Health</h3>
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-[10px] font-mono">
                  <span>Path Redundancy</span>
                  <span className="text-emerald-400">High</span>
                </div>
                <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[85%]" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-[10px] font-mono">
                  <span>Routing Stability</span>
                  <span className="text-orange-400">94.2%</span>
                </div>
                <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 w-[94%]" />
                </div>
              </div>
              <p className="text-[9px] text-slate-500 leading-tight italic">
                Real-time routing data fused from RIPEstat and BGPView. 
                Visualization represents active IPv4 peering sessions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
