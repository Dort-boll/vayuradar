import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { VayuEvent } from '../types';

interface MapViewProps {
  events: VayuEvent[];
}

export const MapView: React.FC<MapViewProps> = ({ events }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [isReady, setIsReady] = React.useState(false);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: [0, 20],
      zoom: 1.5,
    });

    const resizeObserver = new ResizeObserver(() => {
      if (map.current && map.current.getContainer()) {
        try {
          // Only resize if the style is loaded to prevent projection errors in maplibre-gl
          if (map.current.isStyleLoaded()) {
            map.current.resize();
          }
        } catch (e) {
          // Ignore resize errors during unmount
        }
      }
    });
    resizeObserver.observe(mapContainer.current);

    map.current.on('load', () => {
      if (!map.current || !map.current.getContainer()) return;

      try {
        map.current.resize();
        map.current.addSource('events', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: []
          }
        });

        map.current.addSource('outages', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: []
          }
        });

        map.current.addLayer({
          id: 'outage-circles',
          type: 'circle',
          source: 'outages',
          paint: {
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 0, 5, 9, 20],
            'circle-color': '#fb7185',
            'circle-opacity': 0.4,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#f43f5e',
            'circle-blur': 1
          }
        });

        map.current.addSource('deception', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: []
          }
        });

        map.current.addLayer({
          id: 'deception-nodes',
          type: 'circle',
          source: 'deception',
          paint: {
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 0, 3, 9, 12],
            'circle-color': '#d946ef',
            'circle-opacity': 0.8,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#f0abfc',
            'circle-blur': 0.5
          }
        });

        map.current.addSource('bgp', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: []
          }
        });

        map.current.addLayer({
          id: 'bgp-pulses',
          type: 'circle',
          source: 'bgp',
          paint: {
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 0, 4, 9, 15],
            'circle-color': '#fb923c',
            'circle-opacity': 0.6,
            'circle-stroke-width': 1,
            'circle-stroke-color': '#f97316',
            'circle-blur': 0.2
          }
        });

        map.current.addLayer({
          id: 'event-heat',
          type: 'heatmap',
          source: 'events',
          maxzoom: 9,
          paint: {
            'heatmap-weight': ['interpolate', ['linear'], ['get', 'severity'], 0, 0, 10, 1],
            'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 9, 3],
            'heatmap-color': [
              'interpolate',
              ['linear'],
              ['heatmap-density'],
              0, 'rgba(0, 212, 255, 0)',
              0.2, 'rgba(0, 212, 255, 0.2)',
              0.4, 'rgba(0, 212, 255, 0.4)',
              0.6, 'rgba(0, 212, 255, 0.6)',
              0.8, 'rgba(0, 212, 255, 0.8)',
              1, 'rgba(0, 212, 255, 1)'
            ],
            'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 9, 20],
            'heatmap-opacity': 0.6,
          }
        });

        setIsReady(true);
      } catch (e) {
        console.error("Error initializing map layers", e);
      }
    });

    return () => {
      setIsReady(false);
      resizeObserver.disconnect();
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!map.current || !isReady || !map.current.getContainer()) return;

    try {
      const source = map.current.getSource('events') as maplibregl.GeoJSONSource;
      const outageSource = map.current.getSource('outages') as maplibregl.GeoJSONSource;
      const deceptionSource = map.current.getSource('deception') as maplibregl.GeoJSONSource;
      const bgpSource = map.current.getSource('bgp') as maplibregl.GeoJSONSource;

      if (source) {
        source.setData({
          type: 'FeatureCollection',
          features: events.filter(e => e.category !== 'osint' && e.category !== 'deception' && e.category !== 'bgp').map(e => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [e.source.lon, e.source.lat]
            },
            properties: {
              severity: e.severity,
              category: e.category
            }
          }))
        });
      }

      if (bgpSource) {
        bgpSource.setData({
          type: 'FeatureCollection',
          features: events.filter(e => e.category === 'bgp').map(e => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [e.source.lon, e.source.lat]
            },
            properties: {
              severity: e.severity
            }
          }))
        });
      }

      if (deceptionSource) {
        deceptionSource.setData({
          type: 'FeatureCollection',
          features: events.filter(e => e.category === 'deception').map(e => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [e.target?.lon || 0, e.target?.lat || 0]
            },
            properties: {
              severity: e.severity
            }
          }))
        });
      }

      if (outageSource) {
        outageSource.setData({
          type: 'FeatureCollection',
          features: events.filter(e => e.category === 'osint').map(e => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [e.source.lon, e.source.lat]
            },
            properties: {
              severity: e.severity
            }
          }))
        });
      }
    } catch (e) {
      console.error("Error updating map data", e);
    }
  }, [events, isReady]);

  return <div ref={mapContainer} className="w-full h-full" />;
};
