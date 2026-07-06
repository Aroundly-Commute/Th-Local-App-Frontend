import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  ActivityIndicator,
  useColorScheme,
  Dimensions,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowUpDown,
  Search,
  Navigation,
  Map,
  Train,
  X,
  ChevronRight,
  Bus,
  MapPin,
  RotateCw,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  Maximize2,
  Zap
} from 'lucide-react-native';
import Svg, { Circle, Line, Polyline, G, Text as SvgText } from 'react-native-svg';
import { lightTheme, darkTheme, spacing, radius, Theme } from '../../../core/theme/theme';
import { ScreenHeader } from '../../../core/components/ScreenHeader';
import { tap } from '../../../core/utils/haptics';

// Load static metro network dataset
import metroDataRaw from '../data/metro-network.json';

interface MetroData {
  stations: Record<string, {
    id: string;
    name: string;
    line: string;
    lat: number;
    lng: number;
    layout: string;
    neighbors: Array<{
      id: string;
      distance: number;
      time: number;
      line: string;
      isTransfer: boolean;
      walkMessage?: string;
    }>;
  }>;
  lineStations: Record<string, Array<{
    id: string;
    name: string;
    fullName: string;
    line: string;
    lat: number;
    lng: number;
    distance: number;
    layout: string;
  }>>;
  stationsByName: Record<string, Array<{
    id: string;
    line: string;
    lat: number;
    lng: number;
  }>>;
  stationNames: string[];
}

const metroData = metroDataRaw as unknown as MetroData;

// Metro Official Line Colors
const lineColors: Record<string, string> = {
  'Red Line': '#E31837',
  'Yellow Line': '#FFDD00',
  'Blue Line': '#0055B7',
  'Blue Line Branch': '#0055B7',
  'Blue Line Branch Line': '#0055B7',
  'Green Line': '#00A651',
  'Green Line Branch': '#00A651',
  'Green Line Branch Line': '#00A651',
  'Violet Line': '#8A2BE2',
  'Orange Line': '#FF8200',
  'Magenta Line': '#D0104C',
  'Pink Line': '#FF69B4',
  'Gray Line': '#808080',
  'Aqua Line': '#00FFFF', // True bright Aqua Line color
  'Rapid Metro': '#C0C0C0'  // Silver/Light Gray Rapid Metro color
};

// Metro official line contrasts (for text color inside pills)
const lineContrasts: Record<string, string> = {
  'Red Line': '#FFFFFF',
  'Yellow Line': '#000000',
  'Blue Line': '#FFFFFF',
  'Blue Line Branch': '#FFFFFF',
  'Blue Line Branch Line': '#FFFFFF',
  'Green Line': '#FFFFFF',
  'Green Line Branch': '#FFFFFF',
  'Green Line Branch Line': '#FFFFFF',
  'Violet Line': '#FFFFFF',
  'Orange Line': '#FFFFFF',
  'Magenta Line': '#FFFFFF',
  'Pink Line': '#FFFFFF',
  'Gray Line': '#FFFFFF',
  'Aqua Line': '#000000', // Black text on Aqua background
  'Rapid Metro': '#000000' // Black text on Rapid Metro background
};

// Dijkstra Shortest Path routing engine
interface RoutingResult {
  path: string[];
  edges: any[];
  totalTime: number;
  totalDistance: number;
  interchanges: number;
  fare: number;
}

function findShortestPath(sourceName: string, destName: string): RoutingResult | null {
  if (sourceName === destName) return null;

  const startNodes = metroData.stationsByName[sourceName] || [];
  const endNodes = metroData.stationsByName[destName] || [];
  if (startNodes.length === 0 || endNodes.length === 0) return null;

  const dist: Record<string, number> = {};
  const prev: Record<string, string | null> = {};
  const prevEdge: Record<string, any | null> = {};
  const pq: { id: string; cost: number }[] = [];

  Object.keys(metroData.stations).forEach((nodeId) => {
    dist[nodeId] = Infinity;
    prev[nodeId] = null;
    prevEdge[nodeId] = null;
  });

  // Initialize starting nodes
  startNodes.forEach((node) => {
    dist[node.id] = 0;
    pq.push({ id: node.id, cost: 0 });
  });

  while (pq.length > 0) {
    // Sort queue by priority cost
    pq.sort((a, b) => a.cost - b.cost);
    const curr = pq.shift();
    if (!curr) break;
    const { id: uId, cost: uCost } = curr;

    if (uCost > dist[uId]) continue;

    // Check if we reached one of the destination line nodes
    const isTarget = endNodes.some((n) => n.id === uId);
    if (isTarget) {
      // Reconstruct path
      return reconstructPath(uId, prev, prevEdge);
    }

    const uNode = metroData.stations[uId];
    if (!uNode) continue;

    for (const edge of uNode.neighbors) {
      const vId = edge.id;
      // Routing preference: time + transfer penalty (e.g. 15 minutes penalty to minimize interchanges)
      const weight = edge.time + (edge.isTransfer ? 15.0 : 0.0);
      const newDist = uCost + weight;

      if (newDist < dist[vId]) {
        dist[vId] = newDist;
        prev[vId] = uId;
        prevEdge[vId] = edge;
        pq.push({ id: vId, cost: newDist });
      }
    }
  }

  return null;
}

function reconstructPath(
  targetId: string,
  prev: Record<string, string | null>,
  prevEdge: Record<string, any | null>
): RoutingResult {
  const pathNodeIds: string[] = [];
  const edges: any[] = [];
  let curr: string | null = targetId;

  while (curr !== null) {
    pathNodeIds.unshift(curr);
    const edge = prevEdge[curr];
    if (edge) {
      edges.unshift(edge);
    }
    curr = prev[curr];
  }

  let totalTime = 0;
  let totalDistance = 0;
  let interchanges = 0;

  edges.forEach((edge) => {
    totalTime += edge.time;
    totalDistance += edge.distance;
    if (edge.isTransfer) {
      interchanges++;
    }
  });

  // Delhi Metro DMRC Slab-Based Fare Calculation
  let fare = 10;
  if (totalDistance <= 2) fare = 10;
  else if (totalDistance <= 5) fare = 20;
  else if (totalDistance <= 12) fare = 30;
  else if (totalDistance <= 21) fare = 40;
  else if (totalDistance <= 32) fare = 50;
  else fare = 60;

  return {
    path: pathNodeIds,
    edges,
    totalTime: Math.round(totalTime),
    totalDistance: parseFloat(totalDistance.toFixed(2)),
    interchanges,
    fare,
  };
}

// Identify boarding direction towards terminal stations
function getDirection(lineName: string, fromNodeId: string, toNodeId: string): string {
  const lineStationsList = metroData.lineStations[lineName] || [];
  if (lineStationsList.length < 2) return 'Terminal';

  const fromNode = metroData.stations[fromNodeId];
  const toNode = metroData.stations[toNodeId];
  if (!fromNode || !toNode) return 'Terminal';

  const fromIdx = lineStationsList.findIndex((s) => s.name === fromNode.name);
  const toIdx = lineStationsList.findIndex((s) => s.name === toNode.name);

  if (fromIdx !== -1 && toIdx !== -1) {
    if (toIdx > fromIdx) {
      return lineStationsList[lineStationsList.length - 1].fullName.replace(/\[Conn:[^\]]+\]/g, '').trim();
    } else if (toIdx < fromIdx) {
      return lineStationsList[0].fullName.replace(/\[Conn:[^\]]+\]/g, '').trim();
    }
  }
  return lineStationsList[lineStationsList.length - 1].fullName.replace(/\[Conn:[^\]]+\]/g, '').trim();
}

// Group nodes into readable itinerary segments
interface RouteSegment {
  type: 'ride';
  line: string;
  stations: string[];
  fromNodeId: string;
  toNodeId: string;
  direction: string;
}

interface TransferSegment {
  type: 'transfer';
  stationName: string;
  fromLine: string;
  toLine: string;
  walkMessage?: string;
  time: number;
}

type ItinerarySegment = RouteSegment | TransferSegment;

function buildItinerary(pathNodeIds: string[], edges: any[]): ItinerarySegment[] {
  const itinerary: ItinerarySegment[] = [];
  if (pathNodeIds.length === 0) return itinerary;

  let currentRideStations: string[] = [];
  let currentRideLine = '';
  let startNodeId = '';

  for (let i = 0; i < pathNodeIds.length; i++) {
    const nodeId = pathNodeIds[i];
    const node = metroData.stations[nodeId];
    const nextNodeId = pathNodeIds[i + 1];
    const edgeToNext = edges[i];

    if (!currentRideLine) {
      currentRideLine = node.line;
      currentRideStations = [node.name];
      startNodeId = nodeId;
    } else {
      currentRideStations.push(node.name);
    }

    if (edgeToNext) {
      if (edgeToNext.isTransfer) {
        // Complete current segment
        const fromNodeId = startNodeId;
        const toNodeId = nodeId;
        const line = currentRideLine;
        const direction = getDirection(line, fromNodeId, toNodeId);

        itinerary.push({
          type: 'ride',
          line,
          stations: [...currentRideStations],
          fromNodeId,
          toNodeId,
          direction,
        });

        // Add transfer segment
        const nextNode = metroData.stations[nextNodeId];
        itinerary.push({
          type: 'transfer',
          stationName: node.name,
          fromLine: node.line,
          toLine: nextNode.line,
          walkMessage: edgeToNext.walkMessage,
          time: edgeToNext.time,
        });

        // Reset tracking
        currentRideLine = '';
        currentRideStations = [];
        startNodeId = '';
      }
    } else {
      // Last station, complete current segment
      const fromNodeId = startNodeId;
      const toNodeId = nodeId;
      const line = currentRideLine;
      const direction = getDirection(line, fromNodeId, toNodeId);

      itinerary.push({
        type: 'ride',
        line,
        stations: [...currentRideStations],
        fromNodeId,
        toNodeId,
        direction,
      });
    }
  }

  return itinerary;
}

export default function PublicTransportScreen() {
  const t = lightTheme;
  const isDark = false;
  const router = useRouter();

  const [moduleMode, setModuleMode] = useState<'selection' | 'metro'>('selection');
  const [metroTab, setMetroTab] = useState<'route' | 'map'>('route');

  // Route Planner State
  const [source, setSource] = useState<string>('');
  const [destination, setDestination] = useState<string>('');
  const [stationSelectorOpen, setStationSelectorOpen] = useState<boolean>(false);
  const [selectorTarget, setSelectorTarget] = useState<'source' | 'destination'>('source');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedSegments, setExpandedSegments] = useState<Record<number, boolean>>({});

  // Route Result State
  const [routeResult, setRouteResult] = useState<RoutingResult | null>(null);
  const [itinerary, setItinerary] = useState<ItinerarySegment[]>([]);

  // Map Panning and Zooming State
  const [mapScale, setMapScale] = useState<number>(1);
  const [mapPan, setMapPan] = useState({ x: 0, y: 0 });
  const mapTouchStart = useRef({ x: 0, y: 0 });
  const mapInitialScale = useRef(1);
  const mapInitialDist = useRef(0);

  // Calculate route dynamically when source or destination changes
  useEffect(() => {
    if (source && destination) {
      const result = findShortestPath(source, destination);
      if (result) {
        setRouteResult(result);
        const itin = buildItinerary(result.path, result.edges);
        setItinerary(itin);
        // Collapsed intermediate stations by default
        setExpandedSegments({});
      } else {
        setRouteResult(null);
        setItinerary([]);
      }
    } else {
      setRouteResult(null);
      setItinerary([]);
    }
  }, [source, destination]);

  // Swap Stations Action
  const handleSwapStations = () => {
    tap();
    const temp = source;
    setSource(destination);
    setDestination(temp);
  };

  // Station Selection Trigger
  const handleOpenSelector = (target: 'source' | 'destination') => {
    tap();
    setSelectorTarget(target);
    setSearchQuery('');
    setStationSelectorOpen(true);
  };

  const handleSelectStation = (stationName: string) => {
    tap();
    if (selectorTarget === 'source') {
      setSource(stationName);
    } else {
      setDestination(stationName);
    }
    setStationSelectorOpen(false);
  };

  // Toggle Intermediate Station List
  const toggleSegmentExpanded = (idx: number) => {
    tap();
    setExpandedSegments((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  // Map Controls
  const handleZoomIn = () => {
    tap();
    setMapScale((prev) => Math.min(prev + 0.5, 6));
  };

  const handleZoomOut = () => {
    tap();
    setMapScale((prev) => Math.max(prev - 0.5, 0.8));
  };

  const handleResetMap = () => {
    tap();
    setMapScale(1);
    setMapPan({ x: 0, y: 0 });
  };


  // Touch handlers for manual panning and pinch-to-zoom on the static map image
  const onMapTouchStart = (e: any) => {
    const touches = e.nativeEvent.touches;
    if (touches.length === 1) {
      const touch = touches[0];
      mapTouchStart.current = { x: touch.pageX, y: touch.pageY };
      mapInitialDist.current = 0;
    } else if (touches.length === 2) {
      const t1 = touches[0];
      const t2 = touches[1];
      const dist = Math.sqrt(
        Math.pow(t2.pageX - t1.pageX, 2) + Math.pow(t2.pageY - t1.pageY, 2)
      );
      mapInitialDist.current = dist;
      mapInitialScale.current = mapScale;
    }
  };

  const onMapTouchMove = (e: any) => {
    const touches = e.nativeEvent.touches;
    if (touches.length === 1 && mapInitialDist.current === 0) {
      // Panning
      const touch = touches[0];
      const dx = touch.pageX - mapTouchStart.current.x;
      const dy = touch.pageY - mapTouchStart.current.y;
      setMapPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      mapTouchStart.current = { x: touch.pageX, y: touch.pageY };
    } else if (touches.length === 2 && mapInitialDist.current > 0) {
      // Pinch to Zoom
      const t1 = touches[0];
      const t2 = touches[1];
      const dist = Math.sqrt(
        Math.pow(t2.pageX - t1.pageX, 2) + Math.pow(t2.pageY - t1.pageY, 2)
      );
      const ratio = dist / mapInitialDist.current;
      const newScale = Math.min(Math.max(mapInitialScale.current * ratio, 0.8), 6);
      setMapScale(newScale);
    }
  };

  // Filter station list on search queries
  const filteredStationNames = useMemo(() => {
    if (!searchQuery) return metroData.stationNames;
    return metroData.stationNames.filter((name) =>
      name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: t.background }]} edges={['top', 'left', 'right']}>
      <ScreenHeader
        title={moduleMode === 'selection' ? 'Public Transport' : 'Metro Sub-Module'}
        onBack={() => {
          tap();
          if (moduleMode === 'metro') {
            setModuleMode('selection');
          } else {
            router.back();
          }
        }}
      />

      {moduleMode === 'selection' && (
        <ScrollView contentContainerStyle={styles.selectionScroll} showsVerticalScrollIndicator={false}>
          <Text style={[styles.sectionTitle, { color: t.textPrimary, marginHorizontal: spacing.lg, marginTop: spacing.md }]}>
            Select Transport Mode
          </Text>
          <Text style={[styles.sectionSubtitle, { color: t.textSecondary, marginHorizontal: spacing.lg, marginBottom: spacing.lg }]}>
            Plan your multi-modal transit offline
          </Text>

          {/* Metro Card (Primary) */}
          <TouchableOpacity
            style={[styles.modeCard, { backgroundColor: isDark ? t.surface : '#FFFFFF', borderColor: t.border }]}
            activeOpacity={0.8}
            onPress={() => {
              tap();
              setModuleMode('metro');
            }}
          >
            <View style={[styles.modeIconContainer, { backgroundColor: '#E3F2FD' }]}>
              <Train color="#0D47A1" size={32} />
            </View>
            <View style={styles.modeTextContainer}>
              <View style={styles.cardHeaderRow}>
                <Text style={[styles.modeCardTitle, { color: t.textPrimary }]}>Metro Network</Text>
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>OFFLINE</Text>
                </View>
              </View>
              <Text style={[styles.modeCardDesc, { color: t.textSecondary }]}>
                Find the quickest routes between metro stations and view the official metro network map offline.
              </Text>
            </View>
            <ChevronRight color={t.textSecondary} size={20} />
          </TouchableOpacity>

          {/* Bus Card (Placeholder) */}
          <View
            style={[styles.modeCard, styles.disabledCard, { backgroundColor: isDark ? t.surface : '#FAFAFA', borderColor: t.border }]}
          >
            <View style={[styles.modeIconContainer, { backgroundColor: '#ECEFF1' }]}>
              <Bus color="#546E7A" size={32} />
            </View>
            <View style={styles.modeTextContainer}>
              <View style={styles.cardHeaderRow}>
                <Text style={[styles.modeCardTitle, { color: t.textSecondary }]}>Bus Routes</Text>
                <View style={styles.comingSoonBadge}>
                  <Text style={styles.comingSoonBadgeText}>COMING SOON</Text>
                </View>
              </View>
              <Text style={[styles.modeCardDesc, { color: t.textTertiary }]}>
                Bus schedules, route directories, and live timings are under construction.
              </Text>
            </View>
            <ChevronRight color={t.textTertiary} size={20} />
          </View>

          {/* E-Rickshaw Card (Placeholder) */}
          <View
            style={[styles.modeCard, styles.disabledCard, { backgroundColor: isDark ? t.surface : '#FAFAFA', borderColor: t.border }]}
          >
            <View style={[styles.modeIconContainer, { backgroundColor: '#ECEFF1' }]}>
              <Zap color="#546E7A" size={32} />
            </View>
            <View style={styles.modeTextContainer}>
              <View style={styles.cardHeaderRow}>
                <Text style={[styles.modeCardTitle, { color: t.textSecondary }]}>E-Rickshaw</Text>
                <View style={styles.comingSoonBadge}>
                  <Text style={styles.comingSoonBadgeText}>COMING SOON</Text>
                </View>
              </View>
              <Text style={[styles.modeCardDesc, { color: t.textTertiary }]}>
                E-rickshaw zones, fixed route fares, and driver booking matches are under construction.
              </Text>
            </View>
            <ChevronRight color={t.textTertiary} size={20} />
          </View>
        </ScrollView>
      )}

      {moduleMode === 'metro' && (
        <View style={{ flex: 1 }}>
          {/* Tab Navigation */}
          <View style={[styles.tabBar, { borderBottomColor: t.border }]}>
            <TouchableOpacity
              style={[styles.tabItem, metroTab === 'route' && [styles.activeTab, { borderBottomColor: t.primary }]]}
              onPress={() => {
                tap();
                setMetroTab('route');
              }}
            >
              <Navigation color={metroTab === 'route' ? t.primary : t.textSecondary} size={16} />
              <Text style={[styles.tabText, { color: metroTab === 'route' ? t.primary : t.textSecondary }]}>Route Planner</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, metroTab === 'map' && [styles.activeTab, { borderBottomColor: t.primary }]]}
              onPress={() => {
                tap();
                setMetroTab('map');
              }}
            >
              <Map color={metroTab === 'map' ? t.primary : t.textSecondary} size={16} />
              <Text style={[styles.tabText, { color: metroTab === 'map' ? t.primary : t.textSecondary }]}>Network Map</Text>
            </TouchableOpacity>


          </View>

          {/* Sub-Screen Layouts */}
          {metroTab === 'route' && (
            <ScrollView contentContainerStyle={styles.subScroll} keyboardShouldPersistTaps="handled">
              {/* Input Card */}
              <View style={[styles.inputCard, { backgroundColor: isDark ? t.surface : '#FFFFFF', borderColor: t.border }]}>
                <View style={styles.dropdownsContainer}>
                  <TouchableOpacity
                    style={[styles.dropdownTrigger, { borderBottomWidth: 1, borderBottomColor: t.border }]}
                    onPress={() => handleOpenSelector('source')}
                  >
                    <MapPin color={t.primary} size={16} />
                    <Text
                      style={[
                        styles.dropdownLabel,
                        { color: source ? t.textPrimary : t.textSecondary },
                      ]}
                      numberOfLines={1}
                    >
                      {source || 'Select Start Station'}
                    </Text>
                    <ChevronDown color={t.textSecondary} size={16} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.dropdownTrigger}
                    onPress={() => handleOpenSelector('destination')}
                  >
                    <MapPin color="#D81B60" size={16} />
                    <Text
                      style={[
                        styles.dropdownLabel,
                        { color: destination ? t.textPrimary : t.textSecondary },
                      ]}
                      numberOfLines={1}
                    >
                      {destination || 'Select End Station'}
                    </Text>
                    <ChevronDown color={t.textSecondary} size={16} />
                  </TouchableOpacity>

                  {/* Swap Button */}
                  <TouchableOpacity
                    style={[styles.swapButton, { backgroundColor: t.primary, borderColor: t.background }]}
                    onPress={handleSwapStations}
                    activeOpacity={0.85}
                  >
                    <ArrowUpDown color="#FFFFFF" size={18} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* No Route Selected State */}
              {(!source || !destination) && (
                <View style={styles.placeholderContainer}>
                  <Train color={t.textSecondary} size={48} style={{ opacity: 0.5, marginBottom: 12 }} />
                  <Text style={[styles.placeholderTitle, { color: t.textSecondary }]}>Calculate Your Path</Text>
                  <Text style={[styles.placeholderText, { color: t.textTertiary }]}>
                    Select a start and destination station above to build your offline route details.
                  </Text>
                </View>
              )}

              {/* Routing Calculation Details */}
              {source && destination && routeResult && (
                <View style={styles.routeContainer}>
                  {/* Summary Metric Cards */}
                  <View style={styles.metricsRow}>
                    <View style={[styles.metricCard, { backgroundColor: isDark ? t.surface : '#F5F5F5', borderColor: t.border }]}>
                      <Text style={[styles.metricLabel, { color: t.textSecondary }]}>Fare</Text>
                      <Text style={[styles.metricValue, { color: t.textPrimary }]}>₹{routeResult.fare}</Text>
                    </View>

                    <View style={[styles.metricCard, { backgroundColor: isDark ? t.surface : '#F5F5F5', borderColor: t.border }]}>
                      <Text style={[styles.metricLabel, { color: t.textSecondary }]}>Time</Text>
                      <Text style={[styles.metricValue, { color: t.textPrimary }]}>{routeResult.totalTime}m</Text>
                    </View>

                    <View style={[styles.metricCard, { backgroundColor: isDark ? t.surface : '#F5F5F5', borderColor: t.border }]}>
                      <Text style={[styles.metricLabel, { color: t.textSecondary }]}>Switches</Text>
                      <Text style={[styles.metricValue, { color: t.textPrimary }]}>
                        {routeResult.interchanges === 0 ? 'Direct' : routeResult.interchanges}
                      </Text>
                    </View>

                    <View style={[styles.metricCard, { backgroundColor: isDark ? t.surface : '#F5F5F5', borderColor: t.border }]}>
                      <Text style={[styles.metricLabel, { color: t.textSecondary }]}>Stations</Text>
                      <Text style={[styles.metricValue, { color: t.textPrimary }]}>
                        {routeResult.path.length - routeResult.interchanges}
                      </Text>
                    </View>
                  </View>

                  {/* Vertical Route Itinerary Timeline */}
                  <Text style={[styles.timelineTitle, { color: t.textPrimary }]}>Detailed Itinerary</Text>
                  <View style={styles.timelineCard}>
                    {itinerary.map((segment, index) => {
                      if (segment.type === 'ride') {
                        const segmentColor = lineColors[segment.line] || '#808080';
                        const contrastColor = lineContrasts[segment.line] || '#FFFFFF';
                        const isExpanded = !!expandedSegments[index];

                        return (
                          <View key={index} style={styles.rideSegmentRow}>
                            <View style={styles.timelineTrackContainer}>
                              <View style={[styles.timelineDot, { backgroundColor: segmentColor }]} />
                              {index < itinerary.length - 1 && (
                                <View style={[styles.timelineLine, { backgroundColor: segmentColor }]} />
                              )}
                            </View>

                            <View style={styles.timelineContentContainer}>
                              <Text style={[styles.stationHeadline, { color: t.textPrimary }]}>
                                {segment.stations[0]}
                              </Text>

                              <View style={styles.boardingPillRow}>
                                <View style={[styles.linePill, { backgroundColor: segmentColor }]}>
                                  <Text style={[styles.linePillText, { color: contrastColor }]}>
                                    {segment.line}
                                  </Text>
                                </View>
                                <Text style={[styles.platformDirection, { color: t.textSecondary }]}>
                                  Direction: Towards {segment.direction}
                                </Text>
                              </View>

                              {/* Intermediate station list (collapsible) */}
                              {segment.stations.length > 2 ? (
                                <View style={styles.intermediateContainer}>
                                  <TouchableOpacity
                                    style={styles.expandToggle}
                                    onPress={() => toggleSegmentExpanded(index)}
                                    activeOpacity={0.7}
                                  >
                                    <Text style={[styles.expandText, { color: t.primary }]}>
                                      {isExpanded ? 'Hide' : 'Show'} {segment.stations.length - 2} intermediate stations
                                    </Text>
                                    {isExpanded ? (
                                      <ChevronUp color={t.primary} size={14} />
                                    ) : (
                                      <ChevronDown color={t.primary} size={14} />
                                    )}
                                  </TouchableOpacity>

                                  {isExpanded && (
                                    <View style={[styles.intermediateList, { borderLeftColor: t.border }]}>
                                      {segment.stations.slice(1, segment.stations.length - 1).map((name, sIdx) => (
                                        <View key={sIdx} style={styles.intermediateItem}>
                                          <View style={[styles.intermediateDot, { backgroundColor: t.textSecondary }]} />
                                          <Text style={[styles.intermediateName, { color: t.textSecondary }]}>
                                            {name}
                                          </Text>
                                        </View>
                                      ))}
                                    </View>
                                  )}
                                </View>
                              ) : (
                                <View style={{ height: spacing.xs }} />
                              )}
                            </View>
                          </View>
                        );
                      } else {
                        // Interchange / Switch segment
                        return (
                          <View key={index} style={styles.rideSegmentRow}>
                            <View style={styles.timelineTrackContainer}>
                              <View style={[styles.interchangeDot, { borderColor: t.primary, backgroundColor: t.background }]} />
                              {index < itinerary.length - 1 && (
                                <View style={[styles.timelineLine, { backgroundColor: t.border, borderStyle: 'dashed' }]} />
                              )}
                            </View>

                            <View style={[styles.timelineContentContainer, styles.transferPadding]}>
                              <View style={[styles.transferBox, { backgroundColor: isDark ? '#1C1917' : '#FDF2F8', borderColor: '#FBCFE8' }]}>
                                <Text style={[styles.transferText, { color: '#BE185D' }]}>
                                  {segment.walkMessage ||
                                    `Switch from ${segment.fromLine} to ${segment.toLine} at ${segment.stationName}`}
                                </Text>
                                <Text style={[styles.transferSubText, { color: t.textSecondary }]}>
                                  Estimated transition: {segment.time} mins
                                </Text>
                              </View>
                            </View>
                          </View>
                        );
                      }
                    })}

                    {/* Exit Destination Row */}
                    <View style={styles.rideSegmentRow}>
                      <View style={styles.timelineTrackContainer}>
                        <View style={[styles.exitDot, { backgroundColor: t.success }]} />
                      </View>
                      <View style={styles.timelineContentContainer}>
                        <Text style={[styles.stationHeadline, { color: t.textPrimary }]}>{destination}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                          <CheckCircle2 color={t.success} size={14} />
                          <Text style={{ fontSize: 13, color: t.textSecondary, fontWeight: '500' }}>
                            Exit Station reached
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>
          )}

          {metroTab === 'map' && (
            <View style={styles.mapContainer}>
              <View
                style={[
                  styles.mapWrapper,
                  { backgroundColor: isDark ? '#1C1917' : '#EFF6FF' },
                ]}
                onTouchStart={onMapTouchStart}
                onTouchMove={onMapTouchMove}
              >
                <View
                  style={{
                    width: '100%',
                    height: '100%',
                    transform: [
                      { translateX: mapPan.x },
                      { translateY: mapPan.y },
                      { scale: mapScale },
                    ],
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Image
                    source={require('../../../../assets/delhi-metro-map-static.png')}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="contain"
                  />
                </View>
              </View>

              {/* Float Map Overlay Controls */}
              <View style={styles.mapControlOverlay}>
                <TouchableOpacity style={[styles.mapBtn, { backgroundColor: t.surface }]} onPress={handleZoomIn}>
                  <Plus color={t.textPrimary} size={18} />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.mapBtn, { backgroundColor: t.surface }]} onPress={handleZoomOut}>
                  <Minus color={t.textPrimary} size={18} />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.mapBtn, { backgroundColor: t.surface }]} onPress={handleResetMap}>
                  <Maximize2 color={t.textPrimary} size={18} />
                </TouchableOpacity>
              </View>

              {/* Map Guide / Legend Banner */}
              <View style={[styles.mapLegend, { backgroundColor: t.surface, borderTopColor: t.border }]}>
                <Text style={[styles.legendText, { color: t.textSecondary }]}>Delhi-NCR Metro Map (Official DMRC Layout)</Text>
                <Text style={{ fontSize: 10, color: t.textTertiary, marginTop: 4 }}>
                  Tip: Drag to pan map. Pinch or use controls to zoom. Works 100% offline.
                </Text>
              </View>
            </View>
          )}


        </View>
      )}

      {/* Station Picker Modal */}
      <Modal
        visible={stationSelectorOpen}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setStationSelectorOpen(false)}
      >
        <SafeAreaView style={[styles.selectorContainer, { backgroundColor: t.background }]}>
          <View style={[styles.selectorHeader, { borderBottomColor: t.border }]}>
            <Text style={[styles.selectorTitle, { color: t.textPrimary }]}>
              {selectorTarget === 'source' ? 'Select Start Station' : 'Select End Station'}
            </Text>
            <TouchableOpacity onPress={() => setStationSelectorOpen(false)} style={styles.closeBtn}>
              <X color={t.textPrimary} size={20} />
            </TouchableOpacity>
          </View>

          {/* Search bar inside modal */}
          <View style={[styles.selectorSearchCard, { backgroundColor: t.surface, borderColor: t.border }]}>
            <Search color={t.textSecondary} size={18} />
            <TextInput
              style={[styles.selectorInput, { color: t.textPrimary }]}
              placeholder="Search station..."
              placeholderTextColor={t.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              clearButtonMode="while-editing"
            />
          </View>

          {/* List of stations */}
          <FlatList
            data={filteredStationNames}
            keyExtractor={(item) => item}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.selectorList}
            renderItem={({ item }) => {
              const nodes = metroData.stationsByName[item] || [];
              const linesForStation = nodes.map((n) => n.line);

              return (
                <TouchableOpacity
                  style={[styles.selectorItem, { borderBottomColor: t.border }]}
                  onPress={() => handleSelectStation(item)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.selectorItemText, { color: t.textPrimary }]}>{item}</Text>
                    <View style={styles.capsuleRow}>
                      {linesForStation.map((line, lIdx) => (
                        <View
                          key={lIdx}
                          style={[
                            styles.smallLineCapsule,
                            { backgroundColor: lineColors[line] || '#808080' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.smallLineText,
                              { color: lineContrasts[line] || '#FFFFFF' },
                            ]}
                          >
                            {line.replace(' Line', '')}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                  <ChevronRight color={t.textSecondary} size={16} />
                </TouchableOpacity>
              );
            }}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  selectionScroll: {
    paddingBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  modeCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  disabledCard: {
    opacity: 0.65,
  },
  modeIconContainer: {
    width: 60,
    height: 60,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeTextContainer: {
    flex: 1,
    marginLeft: spacing.md,
    marginRight: spacing.xs,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  modeCardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  modeCardDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  activeBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activeBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#2E7D32',
  },
  comingSoonBadge: {
    backgroundColor: '#ECEFF1',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  comingSoonBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#455A64',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
  },
  subScroll: {
    padding: spacing.lg,
    paddingBottom: 140,
  },
  inputCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.lg,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  dropdownsContainer: {
    position: 'relative',
    gap: 8,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: spacing.xs,
    gap: 12,
  },
  dropdownLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  swapButton: {
    position: 'absolute',
    right: 8,
    top: '50%',
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    zIndex: 99,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: spacing.xl,
  },
  placeholderTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  placeholderText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  routeContainer: {
    gap: spacing.md,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metricCard: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  timelineCard: {
    paddingVertical: spacing.md,
  },
  rideSegmentRow: {
    flexDirection: 'row',
  },
  timelineTrackContainer: {
    width: 28,
    alignItems: 'center',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  interchangeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 3,
    marginTop: 4,
  },
  exitDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  timelineLine: {
    width: 3,
    flex: 1,
    marginVertical: 4,
  },
  timelineContentContainer: {
    flex: 1,
    paddingBottom: spacing.lg,
    marginLeft: 8,
  },
  transferPadding: {
    paddingBottom: spacing.md,
  },
  stationHeadline: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  boardingPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  linePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  linePillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  platformDirection: {
    fontSize: 12,
    fontWeight: '500',
  },
  intermediateContainer: {
    marginTop: 8,
  },
  expandToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expandText: {
    fontSize: 12,
    fontWeight: '600',
  },
  intermediateList: {
    borderLeftWidth: 2,
    marginLeft: 4,
    paddingLeft: 12,
    marginTop: 6,
    gap: 6,
  },
  intermediateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  intermediateDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  intermediateName: {
    fontSize: 12,
    fontWeight: '500',
  },
  transferBox: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    gap: 4,
  },
  transferText: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  transferSubText: {
    fontSize: 11,
    fontWeight: '500',
  },
  selectorContainer: {
    flex: 1,
  },
  selectorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  selectorTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  selectorSearchCard: {
    margin: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectorInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  selectorList: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 40,
  },
  selectorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  selectorItemText: {
    fontSize: 15,
    fontWeight: '600',
  },
  capsuleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 6,
  },
  smallLineCapsule: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  smallLineText: {
    fontSize: 9,
    fontWeight: '800',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  mapWrapper: {
    flex: 1,
    overflow: 'hidden',
  },
  mapControlOverlay: {
    position: 'absolute',
    right: 16,
    top: 16,
    gap: 8,
    zIndex: 99,
  },
  mapBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  mapLegend: {
    padding: 12,
    borderTopWidth: 1,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
