import React, { useMemo, useRef, useEffect, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { VayuEvent } from '../types';

interface KnowledgeGraphProps {
  events: VayuEvent[];
}

export const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({ events }) => {
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

  const graphData = useMemo(() => {
    const nodes: any[] = [];
    const links: any[] = [];
    const nodeIds = new Set();

    events.forEach(event => {
      // Source Node
      const sourceId = event.category === 'osint' ? (event.metadata?.source || 'OSINT') : (event.source.asn ? `AS${event.source.asn}` : event.source.country || 'Unknown');
      if (!nodeIds.has(sourceId)) {
        nodes.push({ 
          id: sourceId, 
          name: sourceId, 
          val: event.category === 'osint' ? 8 : 5, 
          color: event.category === 'attack' ? '#fb7185' : (event.category === 'deception' ? '#d946ef' : (event.category === 'osint' ? '#f59e0b' : '#00d4ff')),
          type: event.category === 'osint' ? 'INTEL' : 'ASN'
        });
        nodeIds.add(sourceId);
      }

      // Target Node
      if (event.target || event.category === 'osint') {
        const targetId = event.category === 'osint' ? (event.metadata?.intel_type || 'Indicator') : (event.target?.asn ? `AS${event.target.asn}` : event.target?.country || 'Unknown');
        if (!nodeIds.has(targetId)) {
          nodes.push({ 
            id: targetId, 
            name: targetId, 
            val: 3, 
            color: event.category === 'osint' ? '#fcd34d' : '#3b82f6',
            type: event.category === 'osint' ? 'IOC' : 'ASN'
          });
          nodeIds.add(targetId);
        }

        links.push({
          source: sourceId,
          target: targetId,
          color: event.category === 'attack' ? 'rgba(251, 113, 133, 0.4)' : (event.category === 'deception' ? 'rgba(217, 70, 239, 0.4)' : (event.category === 'osint' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(0, 212, 255, 0.2)')),
          label: event.category
        });
      }
    });

    return { nodes, links };
  }, [events]);

  return (
    <div ref={containerRef} className="w-full h-full glass-panel overflow-hidden relative">
      <ForceGraph2D
        graphData={graphData}
        backgroundColor="rgba(0,0,0,0)"
        nodeLabel="name"
        nodeColor={node => (node as any).color}
        nodeRelSize={6}
        linkColor={link => (link as any).color}
        linkDirectionalParticles={2}
        linkDirectionalParticleSpeed={0.01}
        width={dimensions.width}
        height={dimensions.height}
        nodeCanvasObject={(node: any, ctx, globalScale) => {
          const label = node.name;
          const fontSize = 12 / globalScale;
          ctx.font = `${fontSize}px Inter`;
          const textWidth = ctx.measureText(label).width;
          const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2);

          ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
          ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, bckgDimensions[0] as number, bckgDimensions[1] as number);

          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = node.color;
          ctx.fillText(label, node.x, node.y);

          node.__bckgDimensions = bckgDimensions;
        }}
        nodePointerAreaPaint={(node: any, color, ctx) => {
          ctx.fillStyle = color;
          const bckgDimensions = node.__bckgDimensions;
          bckgDimensions && ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, bckgDimensions[0], bckgDimensions[1]);
        }}
      />
    </div>
  );
};
