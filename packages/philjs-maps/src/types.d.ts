/**
 * PhilJS Maps - Type Definitions
 * Provider-agnostic map types for Google Maps, Mapbox, and Leaflet
 */
/**
 * Geographic coordinates
 */
export interface LatLng {
    lat: number;
    lng: number;
}
/**
 * Geographic bounds (bounding box)
 */
export interface LatLngBounds {
    north: number;
    south: number;
    east: number;
    west: number;
}
/**
 * Point in pixel coordinates
 */
export interface Point {
    x: number;
    y: number;
}
/**
 * Supported map providers
 */
export type MapProvider = 'google' | 'mapbox' | 'leaflet';
/**
 * Provider configuration
 */
export interface ProviderConfig {
    provider: MapProvider;
    apiKey?: string;
    accessToken?: string;
    styleUrl?: string;
}
/**
 * Map instance abstraction
 */
export interface MapInstance {
    provider: MapProvider;
    native: unknown;
    getCenter(): LatLng;
    setCenter(center: LatLng): void;
    getZoom(): number;
    setZoom(zoom: number): void;
    getBounds(): LatLngBounds;
    fitBounds(bounds: LatLngBounds, padding?: number): void;
    panTo(center: LatLng): void;
    on(event: string, handler: (e: MapEvent) => void): void;
    off(event: string, handler: (e: MapEvent) => void): void;
}
/**
 * Base map component props
 */
export interface MapProps {
    /** Initial center coordinates */
    center?: LatLng;
    /** Initial zoom level (0-22) */
    zoom?: number;
    /** Map provider to use */
    provider?: MapProvider;
    /** Provider-specific API key or access token */
    apiKey?: string;
    /** Custom map style URL */
    styleUrl?: string;
    /** Map width (CSS value) */
    width?: string | number;
    /** Map height (CSS value) */
    height?: string | number;
    /** CSS class name */
    className?: string;
    /** Inline styles */
    style?: Record<string, string | number>;
    /** Enable touch gestures */
    touchGestures?: boolean;
    /** Enable keyboard navigation for accessibility */
    keyboardNavigation?: boolean;
    /** Accessible label for the map */
    ariaLabel?: string;
    /** Enable scroll wheel zoom */
    scrollWheelZoom?: boolean;
    /** Enable double-click zoom */
    doubleClickZoom?: boolean;
    /** Enable dragging */
    draggable?: boolean;
    /** Minimum zoom level */
    minZoom?: number;
    /** Maximum zoom level */
    maxZoom?: number;
    /** Map bounds restriction */
    maxBounds?: LatLngBounds;
    /** Child components (markers, layers, etc.) */
    children?: unknown;
    /** Called when map is ready */
    onLoad?: (map: MapInstance) => void;
    /** Called on map click */
    onClick?: (e: MapClickEvent) => void;
    /** Called on zoom change */
    onZoomChange?: (zoom: number) => void;
    /** Called on center change */
    onCenterChange?: (center: LatLng) => void;
    /** Called on bounds change */
    onBoundsChange?: (bounds: LatLngBounds) => void;
    /** Called on drag start */
    onDragStart?: () => void;
    /** Called on drag end */
    onDragEnd?: () => void;
    /** Lazy load the map */
    lazy?: boolean;
    /** Intersection observer options for lazy loading */
    lazyOptions?: IntersectionObserverInit;
}
/**
 * Marker component props
 */
export interface MarkerProps {
    /** Marker position */
    position: LatLng;
    /** Marker title (tooltip) */
    title?: string;
    /** Custom icon URL or configuration */
    icon?: string | MarkerIcon;
    /** Enable dragging */
    draggable?: boolean;
    /** Marker opacity (0-1) */
    opacity?: number;
    /** Z-index for stacking */
    zIndex?: number;
    /** Accessible label */
    ariaLabel?: string;
    /** Click handler */
    onClick?: (e: MarkerEvent) => void;
    /** Drag end handler */
    onDragEnd?: (position: LatLng) => void;
    /** Mouse enter handler */
    onMouseEnter?: () => void;
    /** Mouse leave handler */
    onMouseLeave?: () => void;
    /** Child popup content */
    children?: unknown;
    /** Cluster group ID for clustering */
    clusterId?: string;
}
/**
 * Custom marker icon configuration
 */
export interface MarkerIcon {
    url: string;
    size?: Point;
    anchor?: Point;
    scaledSize?: Point;
}
/**
 * Marker cluster component props
 */
export interface MarkerClusterProps {
    /** Cluster ID */
    id?: string;
    /** Markers to cluster */
    markers: MarkerProps[];
    /** Minimum cluster size */
    minClusterSize?: number;
    /** Maximum zoom to cluster at */
    maxZoom?: number;
    /** Cluster radius in pixels */
    radius?: number;
    /** Custom cluster renderer */
    clusterRenderer?: (count: number, markers: MarkerProps[]) => unknown;
    /** Cluster click handler */
    onClusterClick?: (cluster: ClusterData) => void;
    /** Enable spiderfying on click */
    spiderfy?: boolean;
    /** Animation on cluster changes */
    animate?: boolean;
}
/**
 * Cluster data
 */
export interface ClusterData {
    id: string;
    center: LatLng;
    count: number;
    markers: MarkerProps[];
    bounds: LatLngBounds;
}
/**
 * Polyline component props
 */
export interface PolylineProps {
    /** Path coordinates */
    path: LatLng[];
    /** Stroke color */
    strokeColor?: string;
    /** Stroke weight in pixels */
    strokeWeight?: number;
    /** Stroke opacity (0-1) */
    strokeOpacity?: number;
    /** Dashed line pattern */
    strokeDasharray?: string;
    /** Click handler */
    onClick?: (e: ShapeEvent) => void;
    /** Mouse enter handler */
    onMouseEnter?: () => void;
    /** Mouse leave handler */
    onMouseLeave?: () => void;
    /** Enable editing */
    editable?: boolean;
    /** Edit complete handler */
    onEdit?: (path: LatLng[]) => void;
    /** Z-index */
    zIndex?: number;
    /** Accessible label */
    ariaLabel?: string;
}
/**
 * Polygon component props
 */
export interface PolygonProps {
    /** Polygon path coordinates */
    path: LatLng[];
    /** Holes in the polygon (array of paths) */
    holes?: LatLng[][];
    /** Stroke color */
    strokeColor?: string;
    /** Stroke weight */
    strokeWeight?: number;
    /** Stroke opacity */
    strokeOpacity?: number;
    /** Fill color */
    fillColor?: string;
    /** Fill opacity */
    fillOpacity?: number;
    /** Click handler */
    onClick?: (e: ShapeEvent) => void;
    /** Mouse enter handler */
    onMouseEnter?: () => void;
    /** Mouse leave handler */
    onMouseLeave?: () => void;
    /** Enable editing */
    editable?: boolean;
    /** Edit complete handler */
    onEdit?: (path: LatLng[], holes?: LatLng[][]) => void;
    /** Z-index */
    zIndex?: number;
    /** Accessible label */
    ariaLabel?: string;
}
/**
 * Popup component props
 */
export interface PopupProps {
    /** Popup position */
    position: LatLng;
    /** Popup content */
    children: unknown;
    /** Whether popup is open */
    open?: boolean;
    /** Offset from position */
    offset?: Point;
    /** Close button */
    closeButton?: boolean;
    /** Close on map click */
    closeOnClick?: boolean;
    /** Close on escape key */
    closeOnEscape?: boolean;
    /** Close handler */
    onClose?: () => void;
    /** Max width in pixels */
    maxWidth?: number;
    /** Min width in pixels */
    minWidth?: number;
    /** CSS class name */
    className?: string;
    /** Accessible role */
    role?: string;
    /** Accessible label */
    ariaLabel?: string;
}
/**
 * Heatmap layer props
 */
export interface HeatmapLayerProps {
    /** Heatmap data points */
    data: HeatmapPoint[];
    /** Point radius */
    radius?: number;
    /** Blur amount */
    blur?: number;
    /** Maximum intensity */
    maxIntensity?: number;
    /** Color gradient */
    gradient?: Record<number, string>;
    /** Opacity */
    opacity?: number;
    /** Z-index */
    zIndex?: number;
    /** Minimum zoom to show */
    minZoom?: number;
    /** Maximum zoom to show */
    maxZoom?: number;
}
/**
 * Heatmap data point
 */
export interface HeatmapPoint {
    position: LatLng;
    weight?: number;
}
/**
 * GeoJSON layer props
 */
export interface GeoJSONProps {
    /** GeoJSON data */
    data: GeoJSONData;
    /** Default style for features */
    style?: GeoJSONStyle | ((feature: GeoJSONFeature) => GeoJSONStyle);
    /** Feature click handler */
    onFeatureClick?: (feature: GeoJSONFeature, e: ShapeEvent) => void;
    /** Feature hover handler */
    onFeatureHover?: (feature: GeoJSONFeature | null) => void;
    /** Point to layer mapper */
    pointToLayer?: (feature: GeoJSONFeature, latlng: LatLng) => unknown;
    /** Feature filter */
    filter?: (feature: GeoJSONFeature) => boolean;
    /** Z-index */
    zIndex?: number;
}
/**
 * GeoJSON style
 */
export interface GeoJSONStyle {
    strokeColor?: string;
    strokeWeight?: number;
    strokeOpacity?: number;
    fillColor?: string;
    fillOpacity?: number;
}
/**
 * GeoJSON data types
 */
export interface GeoJSONData {
    type: 'FeatureCollection' | 'Feature' | 'GeometryCollection';
    features?: GeoJSONFeature[];
    geometry?: GeoJSONGeometry;
    properties?: Record<string, unknown>;
}
export interface GeoJSONFeature {
    type: 'Feature';
    geometry: GeoJSONGeometry;
    properties: Record<string, unknown>;
    id?: string | number;
}
export interface GeoJSONGeometry {
    type: 'Point' | 'MultiPoint' | 'LineString' | 'MultiLineString' | 'Polygon' | 'MultiPolygon' | 'GeometryCollection';
    coordinates: unknown;
    geometries?: GeoJSONGeometry[];
}
/**
 * Search box props
 */
export interface SearchBoxProps {
    /** Placeholder text */
    placeholder?: string;
    /** Initial value */
    value?: string;
    /** Value change handler */
    onChange?: (value: string) => void;
    /** Place selected handler */
    onPlaceSelect?: (place: PlaceResult) => void;
    /** Search bounds restriction */
    bounds?: LatLngBounds;
    /** Country restriction (ISO 3166-1 alpha-2) */
    countryRestriction?: string | string[];
    /** Types to search for */
    types?: PlaceType[];
    /** CSS class name */
    className?: string;
    /** Input styles */
    style?: Record<string, string | number>;
    /** Debounce delay in ms */
    debounce?: number;
    /** Clear button */
    clearButton?: boolean;
    /** Accessible label */
    ariaLabel?: string;
}
/**
 * Place search result
 */
export interface PlaceResult {
    placeId: string;
    name: string;
    formattedAddress: string;
    location: LatLng;
    viewport?: LatLngBounds;
    types: PlaceType[];
    addressComponents?: AddressComponent[];
}
export interface AddressComponent {
    longName: string;
    shortName: string;
    types: string[];
}
export type PlaceType = 'address' | 'establishment' | 'geocode' | 'locality' | 'political' | 'postal_code' | 'country' | 'administrative_area_level_1' | 'administrative_area_level_2';
/**
 * Directions renderer props
 */
export interface DirectionsRendererProps {
    /** Route directions */
    directions: DirectionsResult;
    /** Route index to display (if multiple routes) */
    routeIndex?: number;
    /** Polyline options for route line */
    polylineOptions?: Partial<PolylineProps>;
    /** Show markers at waypoints */
    showMarkers?: boolean;
    /** Custom origin marker */
    originMarker?: Partial<MarkerProps>;
    /** Custom destination marker */
    destinationMarker?: Partial<MarkerProps>;
    /** Custom waypoint markers */
    waypointMarker?: Partial<MarkerProps>;
    /** Suppress polylines (render custom) */
    suppressPolylines?: boolean;
    /** Suppress markers (render custom) */
    suppressMarkers?: boolean;
    /** Route leg click handler */
    onLegClick?: (leg: RouteLeg, index: number) => void;
}
/**
 * Directions request
 */
export interface DirectionsRequest {
    origin: LatLng | string;
    destination: LatLng | string;
    waypoints?: DirectionsWaypoint[];
    travelMode?: TravelMode;
    avoidHighways?: boolean;
    avoidTolls?: boolean;
    avoidFerries?: boolean;
    optimizeWaypoints?: boolean;
    departureTime?: Date;
    arrivalTime?: Date;
    alternatives?: boolean;
    region?: string;
    language?: string;
    units?: 'metric' | 'imperial';
}
export interface DirectionsWaypoint {
    location: LatLng | string;
    stopover?: boolean;
}
export type TravelMode = 'driving' | 'walking' | 'bicycling' | 'transit';
/**
 * Directions result
 */
export interface DirectionsResult {
    routes: Route[];
    status: DirectionsStatus;
    geocodedWaypoints?: GeocodedWaypoint[];
}
export interface Route {
    summary: string;
    legs: RouteLeg[];
    waypointOrder: number[];
    overviewPath: LatLng[];
    bounds: LatLngBounds;
    copyrights?: string;
    warnings?: string[];
}
export interface RouteLeg {
    startLocation: LatLng;
    endLocation: LatLng;
    startAddress: string;
    endAddress: string;
    distance: Distance;
    duration: Duration;
    steps: RouteStep[];
}
export interface RouteStep {
    startLocation: LatLng;
    endLocation: LatLng;
    path: LatLng[];
    distance: Distance;
    duration: Duration;
    instructions: string;
    travelMode: TravelMode;
    maneuver?: string;
}
export interface Distance {
    text: string;
    value: number;
}
export interface Duration {
    text: string;
    value: number;
}
export interface GeocodedWaypoint {
    geocoderStatus: string;
    placeId: string;
    types: string[];
}
export type DirectionsStatus = 'OK' | 'ZERO_RESULTS' | 'NOT_FOUND' | 'MAX_WAYPOINTS_EXCEEDED' | 'INVALID_REQUEST' | 'OVER_QUERY_LIMIT' | 'REQUEST_DENIED' | 'UNKNOWN_ERROR';
/**
 * Base map event
 */
export interface MapEvent {
    type: string;
    target: MapInstance;
    originalEvent?: Event;
}
/**
 * Map click event
 */
export interface MapClickEvent extends MapEvent {
    latlng: LatLng;
    pixel: Point;
}
/**
 * Marker event
 */
export interface MarkerEvent extends MapEvent {
    marker: unknown;
    position: LatLng;
}
/**
 * Shape event
 */
export interface ShapeEvent extends MapEvent {
    latlng: LatLng;
    feature?: GeoJSONFeature;
}
/**
 * Geocode request
 */
export interface GeocodeRequest {
    address?: string;
    location?: LatLng;
    placeId?: string;
    bounds?: LatLngBounds;
    componentRestrictions?: {
        country?: string | string[];
        administrativeArea?: string;
        locality?: string;
        postalCode?: string;
    };
    region?: string;
    language?: string;
}
/**
 * Geocode result
 */
export interface GeocodeResult {
    placeId: string;
    formattedAddress: string;
    location: LatLng;
    viewport: LatLngBounds;
    types: string[];
    addressComponents: AddressComponent[];
    partialMatch?: boolean;
}
/**
 * Geolocation state
 */
export interface GeolocationState {
    loading: boolean;
    position: GeolocationPosition | null;
    error: GeolocationPositionError | null;
    timestamp: number | null;
}
/**
 * Geolocation position
 */
export interface GeolocationPosition {
    coords: {
        latitude: number;
        longitude: number;
        altitude: number | null;
        accuracy: number;
        altitudeAccuracy: number | null;
        heading: number | null;
        speed: number | null;
    };
    timestamp: number;
}
/**
 * Geolocation options
 */
export interface GeolocationOptions {
    enableHighAccuracy?: boolean;
    timeout?: number;
    maximumAge?: number;
    watch?: boolean;
}
/**
 * Map context value
 */
export interface MapContextValue {
    map: MapInstance | null;
    provider: MapProvider;
    apiKey?: string;
    isLoaded: boolean;
    error: Error | null;
}
//# sourceMappingURL=types.d.ts.map