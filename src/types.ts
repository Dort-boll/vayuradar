export type VayuCategory = "traffic" | "attack" | "bgp" | "dns" | "osint" | "deception";

export interface VayuEvent {
  id: string;
  timestamp: number;
  category: VayuCategory;
  severity: number;
  source: {
    ip?: string;
    asn?: number;
    country?: string;
    lat: number;
    lon: number;
  };
  target?: {
    ip?: string;
    asn?: number;
    country?: string;
    lat: number;
    lon: number;
  };
  metrics: {
    volume?: number;
    packets?: number;
    requests?: number;
    latency?: number;
    packetLoss?: number;
  };
  tags: string[];
  description: string;
  type?: string;
  metadata?: {
    prefix?: string;
    origin?: string;
    path?: number[];
    status?: string;
    vector?: string;
    target_port?: number;
    botnet_id?: string;
  };
}

export interface ASNInfo {
  asn: number;
  name: string;
  country: string;
  description: string;
}

export interface ThreatScore {
  score: number;
  factors: {
    label: string;
    value: number;
  }[];
}
