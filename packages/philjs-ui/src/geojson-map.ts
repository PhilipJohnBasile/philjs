
export interface GeoJSONSource {
    type: 'geojson';
    data: any; // geojson.FeatureCollection
}

export interface MapLayer {
    id: string;
    type: 'fill' | 'line' | 'symbol' | 'circle';
    paint?: Record<string, any>;
    layout?: Record<string, any>;
}

export interface MapProps {
    style: string;
    center?: [number, number];
    zoom?: number;
    sources?: Record<string, GeoJSONSource>;
    layers?: MapLayer[];
    onLoad?: () => void;
}

export function GeoJSONMap(props: MapProps) {
    const mapId = `map-${Math.random().toString(36).substr(2, 9)}`;

    const initMap = () => {
        // Mock Mapbox GL JS initialization
        console.log(`Mapbox: Initializing map ${mapId}`, {
            style: props.style,
            center: props.center || [0, 0],
            zoom: props.zoom || 1
        });

        if (props.sources) {
            Object.entries(props.sources).forEach(([id, source]) => {
                console.log(`Mapbox: Adding source "${id}"`, source);
            });
        }

        if (props.layers) {
            props.layers.forEach(layer => {
                console.log(`Mapbox: Adding layer "${layer.id}"`, layer);
            });
        }

        if (props.onLoad) props.onLoad();
    };

    setTimeout(initMap, 0);

    return \`<div id="\${mapId}" class="phil-map" style="width: 100%; height: 100%;">
    Interactive Map (Style: \${props.style})
  </div>\`;
}
