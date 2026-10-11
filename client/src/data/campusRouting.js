// ==============================================================================
// AMRITA VISHWA VIDYAPEETHAM, ETTIMADAI CAMPUS
// Comprehensive Campus Pedestrian Navigation Graph & Routing Engine
// ==============================================================================

// Earth radius in meters for accurate Haversine walking distance calculation
const EARTH_RADIUS_METERS = 6371000;

// Standard human walking speed: ~4.8 km/h = 80 meters per minute (1.33 m/s)
export const WALKING_SPEED_METERS_PER_MIN = 80;

/**
 * Calculates straight-line geographic distance between two coordinates in meters
 * using the Haversine formula.
 */
export function calculateHaversineDistance(coord1, coord2) {
  const lat1 = (coord1[0] * Math.PI) / 180;
  const lat2 = (coord2[0] * Math.PI) / 180;
  const dLat = ((coord2[0] - coord1[0]) * Math.PI) / 180;
  const dLng = ((coord2[1] - coord1[1]) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

/**
 * Campus Landmark Nodes (Origins & Destinations)
 */
export const CAMPUS_LANDMARKS = [
  {
    id: 'loc-1',
    name: 'Main Canteen',
    fullName: 'Main Canteen (Central Dining Hall)',
    category: 'Food & Dining',
    categoryIcon: '🍽️',
    zone: 'Central Amenities Block',
    building: 'Central Amenities Block',
    coords: [10.9001391, 76.9036924],
    description: 'Primary South Indian dining hall with breakfast, meals, and snacks.',
    shortcuts: true
  },
  {
    id: 'loc-it',
    name: 'IT Canteen',
    fullName: 'IT Canteen (AB-3 Food Court)',
    category: 'Food & Dining',
    categoryIcon: '🍔',
    zone: 'North Academic Quad',
    building: 'Academic Block 3 Food Court',
    coords: [10.9049287, 76.8980703],
    description: 'Popular student food court next to AB-3 serving biryani, parottas, and shakes.',
    shortcuts: true
  },
  {
    id: 'loc-mba',
    name: 'MBA Canteen',
    fullName: 'MBA Canteen (School of Business)',
    category: 'Food & Dining',
    categoryIcon: '☕',
    zone: 'East Campus',
    building: 'Amrita School of Business',
    coords: [10.9045954, 76.9022441],
    description: 'Cafeteria with espresso, cold beverages, baked sandwiches, and light meals.',
    shortcuts: true
  },
  {
    id: 'loc-xerox',
    name: 'Stationery & Xerox Hub',
    fullName: 'Amrita Campus Stationery & Xerox Center',
    category: 'Academic Store',
    categoryIcon: '📚',
    zone: 'Central Shopping Complex',
    building: 'Campus Shopping Complex',
    coords: [10.90215, 76.8986],
    description: 'All academic stationery, record books, notebooks, printing, and Xerox services.',
    shortcuts: true
  },
  {
    id: 'loc-store',
    name: 'Amrita General Store',
    fullName: 'Amrita General Store & Student Provisions',
    category: 'Retail Store',
    categoryIcon: '🛒',
    zone: 'Central Amenities Plaza',
    building: 'Campus Shopping Complex',
    coords: [10.9019, 76.8987],
    description: 'Daily student provisions, toiletries, packaged snacks, and supplies.',
    shortcuts: true
  },
  {
    id: 'loc-lib',
    name: 'Central Library',
    fullName: 'Central Library Tower & Reading Halls',
    category: 'Facilities',
    categoryIcon: '📖',
    zone: 'Central Academic Quad',
    building: 'Central Library Block',
    coords: [10.9038752, 76.8991802],
    description: 'Multi-storey central library with digital research lab and 24x7 study zones.',
    shortcuts: true
  },
  {
    id: 'loc-ab1',
    name: 'Academic Block 1 (AB-1)',
    fullName: 'Academic Block 1 — School of Engineering',
    category: 'Academic & Labs',
    categoryIcon: '🎓',
    zone: 'East Academic',
    building: 'Academic Block 1',
    coords: [10.9005275, 76.9029156],
    description: 'Mechanical, Civil, Chemical engineering departments and Admissions Office.',
    shortcuts: true
  },
  {
    id: 'loc-ab2',
    name: 'Academic Block 2 (AB-2)',
    fullName: 'Academic Block 2 — ECE, EEE & Sciences',
    category: 'Academic & Labs',
    categoryIcon: '⚡',
    zone: 'North Academic',
    building: 'Academic Block 2',
    coords: [10.9042855, 76.8986378],
    description: 'Electronics & Communication, Electrical engineering, and physics labs.',
    shortcuts: true
  },
  {
    id: 'loc-ab3',
    name: 'Academic Block 3 (AB-3)',
    fullName: 'Academic Block 3 — CSE, AI & Computing',
    category: 'Academic & Labs',
    categoryIcon: '💻',
    zone: 'North Academic',
    building: 'Academic Block 3',
    coords: [10.906335, 76.8978217],
    description: 'Computer Science, AI, and IT departments with high-performance computing labs.',
    shortcuts: true
  },
  {
    id: 'loc-ab4',
    name: 'Academic Block 4 (AB-4)',
    fullName: 'Academic Block 4 — Data Science & PG Labs',
    category: 'Academic & Labs',
    categoryIcon: '🔬',
    zone: 'North-West Academic',
    building: 'Academic Block 4',
    coords: [10.90565, 76.89745],
    description: 'Data science research labs, cybersecurity center, and PG classrooms.',
    shortcuts: false
  },
  {
    id: 'loc-admin',
    name: 'Administration Block',
    fullName: 'Administrative Block & Vice-Chancellor Office',
    category: 'Administration',
    categoryIcon: '🏛️',
    zone: 'Central Campus',
    building: 'Admin Block',
    coords: [10.9031, 76.9002],
    description: 'University administrative offices, Vice-Chancellor office, and registrar.',
    shortcuts: false
  },
  {
    id: 'loc-cir',
    name: 'CIR Placement Block',
    fullName: 'Corporate & Industry Relations (CIR)',
    category: 'Facilities',
    categoryIcon: '💼',
    zone: 'Central-East Quad',
    building: 'CIR Building',
    coords: [10.9036, 76.9010],
    description: 'Campus placement drives, interview suites, and corporate career training.',
    shortcuts: false
  },
  {
    id: 'loc-clinic',
    name: 'Amrita Clinic & Health Care',
    fullName: 'Amrita Clinic & Student Health Centre',
    category: 'Medical & Health',
    categoryIcon: '🏥',
    zone: 'South-West Campus',
    building: 'Health Centre Block',
    coords: [10.9012, 76.8972],
    description: '24x7 medical clinic, doctor consultation rooms, and ambulance service.',
    shortcuts: true
  },
  {
    id: 'loc-hg',
    name: 'Girls Hostels (Gargi)',
    fullName: 'Girls Hostels — Gargi & Mythreyi Bhavanam',
    category: 'Hostels & Living',
    categoryIcon: '🏢',
    zone: 'Girls Residential Zone',
    building: 'Gargi Bhavanam',
    coords: [10.9030173, 76.8997916],
    description: 'Senior and junior girls hostel complexes with dining mess.',
    shortcuts: true
  },
  {
    id: 'loc-hb1',
    name: 'Boys Hostels (Agasthya & Vasishta)',
    fullName: 'Boys Hostels — Agasthya & Vasishta Bhavanam',
    category: 'Hostels & Living',
    categoryIcon: '🏢',
    zone: 'West Residential Zone',
    building: 'Agasthya Bhavanam',
    coords: [10.9025293, 76.8962109],
    description: 'Undergraduate boys hostel blocks and indoor recreation rooms.',
    shortcuts: true
  },
  {
    id: 'loc-hb2',
    name: 'Boys Hostel (Nachiketas)',
    fullName: 'Boys Hostel — Nachiketas Bhavanam',
    category: 'Hostels & Living',
    categoryIcon: '🏢',
    zone: 'South-East Zone',
    building: 'Nachiketas Bhavanam',
    coords: [10.900509, 76.9047835],
    description: 'Postgraduate and senior boys hostel situated close to Main Canteen.',
    shortcuts: false
  },
  {
    id: 'loc-gate',
    name: 'Main Campus Entrance Gate',
    fullName: 'Amrita Main Entrance Arch (Gate 1)',
    category: 'Facilities',
    categoryIcon: '🚪',
    zone: 'South Campus Entrance',
    building: 'Main Security Gate',
    coords: [10.8980, 76.9003],
    description: 'Main campus entrance gate, visitor check-in, and security outpost.',
    shortcuts: true
  },
  {
    id: 'loc-ground',
    name: 'Central Sports Ground',
    fullName: 'Central Playground & 400m Track',
    category: 'Sports & Recreation',
    categoryIcon: '⚽',
    zone: 'Sports Zone',
    building: 'Outdoor Sports Pavilion',
    coords: [10.9027685, 76.9029683],
    description: 'Standard 400m athletic track, football ground, and cricket pitch.',
    shortcuts: false
  },
  {
    id: 'loc-gym',
    name: 'Arogya Sadhanam Gym',
    fullName: 'Arogya Sadhanam — Boys Fitness Centre',
    category: 'Sports & Recreation',
    categoryIcon: '🏋️',
    zone: 'Sports Zone',
    building: 'Gymnasium Block',
    coords: [10.9018532, 76.9020925],
    description: 'Multi-station weightlifting gym and cardio training facility.',
    shortcuts: false
  },
  {
    id: 'loc-pool',
    name: 'Olympic Swimming Pool',
    fullName: 'Olympic Swimming Pool & Aquatic Complex',
    category: 'Sports & Recreation',
    categoryIcon: '🏊',
    zone: 'North Sports Zone',
    building: 'Aquatic Complex',
    coords: [10.9063381, 76.8989158],
    description: '50-meter Olympic-standard competitive swimming pool.',
    shortcuts: false
  }
];

/**
 * Pedestrian Walkway Graph Nodes (Intersections & Road Waypoints)
 * Precise geographic path nodes along Amrita Ettimadai pedestrian network
 */
const GRAPH_NODES = {
  // Landmark nodes (registered with identical coordinates)
  ...CAMPUS_LANDMARKS.reduce((acc, l) => {
    acc[l.id] = l.coords;
    return acc;
  }, {}),

  // Walkway intersection nodes
  'j_gate_arch': [10.8982, 76.9003],
  'j_south_avenue_1': [10.8992, 76.9003],
  'j_south_cross': [10.8998, 76.9003],
  'j_amenities_fork': [10.9000, 76.9020],
  'j_canteen1_plaza': [10.9001, 76.9033],
  'j_ab1_entrance': [10.9005, 76.9026],
  'j_nachiketas_lane': [10.9005, 76.9044],
  'j_clinic_fork': [10.9012, 76.8982],
  'j_clinic_lane': [10.9012, 76.8975],
  'j_shopping_front': [10.9020, 76.8988],
  'j_central_circle': [10.9030, 76.8996],
  'j_lib_front': [10.9037, 76.8993],
  'j_cir_road': [10.9034, 76.9008],
  'j_mba_avenue': [10.9044, 76.9018],
  'j_ground_west': [10.9024, 76.9018],
  'j_ground_north': [10.9028, 76.9026],
  'j_north_avenue_mid': [10.9042, 76.8989],
  'j_it_canteen_plaza': [10.9049, 76.8983],
  'j_ab3_court': [10.9058, 76.8979],
  'j_pool_turn': [10.9061, 76.8987],
  'j_west_hostels_cross': [10.9025, 76.8970],
  'j_west_hostels_lane': [10.9025, 76.8964]
};

/**
 * Pedestrian Walkway Network Edges (Connections along campus roads and walkways)
 */
const GRAPH_EDGES = [
  // South Entrance Avenue
  ['loc-gate', 'j_gate_arch'],
  ['j_gate_arch', 'j_south_avenue_1'],
  ['j_south_avenue_1', 'j_south_cross'],

  // South Cross to Amenities & Canteen 1
  ['j_south_cross', 'j_amenities_fork'],
  ['j_amenities_fork', 'j_canteen1_plaza'],
  ['j_canteen1_plaza', 'loc-1'],
  ['j_amenities_fork', 'j_ab1_entrance'],
  ['j_ab1_entrance', 'loc-ab1'],
  ['j_canteen1_plaza', 'j_nachiketas_lane'],
  ['j_nachiketas_lane', 'loc-hb2'],

  // South Cross to Clinic & Medical
  ['j_south_cross', 'j_clinic_fork'],
  ['j_clinic_fork', 'j_clinic_lane'],
  ['j_clinic_lane', 'loc-clinic'],

  // Central Spine: South Cross to Shopping Complex, Xerox, & Central Circle
  ['j_south_cross', 'j_shopping_front'],
  ['j_shopping_front', 'loc-xerox'],
  ['j_shopping_front', 'loc-store'],
  ['j_shopping_front', 'j_central_circle'],

  // West Hostels (Agasthya & Vasishta) connection
  ['j_clinic_fork', 'j_west_hostels_cross'],
  ['j_shopping_front', 'j_west_hostels_cross'],
  ['j_west_hostels_cross', 'j_west_hostels_lane'],
  ['j_west_hostels_lane', 'loc-hb1'],

  // Central Circle: Admin Block & Girls Hostels
  ['j_central_circle', 'loc-admin'],
  ['j_central_circle', 'loc-hg'],
  ['j_central_circle', 'j_lib_front'],
  ['j_lib_front', 'loc-lib'],

  // Central Circle towards East (CIR, Ground, MBA Canteen)
  ['j_central_circle', 'j_cir_road'],
  ['j_cir_road', 'loc-cir'],
  ['j_cir_road', 'j_mba_avenue'],
  ['j_mba_avenue', 'loc-mba'],

  // Amenities / Gym / Ground linkages
  ['j_amenities_fork', 'j_ground_west'],
  ['j_ground_west', 'loc-gym'],
  ['j_ground_west', 'j_cir_road'],
  ['j_ground_west', 'j_ground_north'],
  ['j_ground_north', 'loc-ground'],
  ['j_ground_north', 'j_mba_avenue'],

  // North Avenue: Library to AB-2, IT Canteen, AB-3, Pool
  ['j_lib_front', 'j_north_avenue_mid'],
  ['j_north_avenue_mid', 'loc-ab2'],
  ['j_north_avenue_mid', 'j_it_canteen_plaza'],
  ['j_it_canteen_plaza', 'loc-it'],
  ['j_it_canteen_plaza', 'j_ab3_court'],
  ['j_ab3_court', 'loc-ab3'],
  ['j_ab3_court', 'loc-ab4'],
  ['j_ab3_court', 'j_pool_turn'],
  ['j_pool_turn', 'loc-pool'],

  // Cross link from MBA Avenue to IT Canteen area
  ['j_mba_avenue', 'j_north_avenue_mid']
];

/**
 * Builds adjacency graph with pre-computed Haversine edge weights in meters
 */
function buildCampusAdjacencyMap() {
  const adj = {};

  Object.keys(GRAPH_NODES).forEach((nodeId) => {
    adj[nodeId] = [];
  });

  GRAPH_EDGES.forEach(([u, v]) => {
    if (GRAPH_NODES[u] && GRAPH_NODES[v]) {
      const weight = calculateHaversineDistance(GRAPH_NODES[u], GRAPH_NODES[v]);
      adj[u].push({ node: v, weight });
      adj[v].push({ node: u, weight });
    }
  });

  return adj;
}

const CAMPUS_GRAPH = buildCampusAdjacencyMap();

/**
 * Finds the closest graph node to arbitrary GPS coordinates (e.g., user's current location)
 */
export function findClosestGraphNode(targetCoords) {
  let closestNode = null;
  let minDistance = Infinity;

  Object.entries(GRAPH_NODES).forEach(([nodeId, coords]) => {
    const dist = calculateHaversineDistance(targetCoords, coords);
    if (dist < minDistance) {
      minDistance = dist;
      closestNode = { id: nodeId, coords, distance: dist };
    }
  });

  return closestNode;
}

/**
 * Dijkstra's Shortest Path Algorithm on Campus Pedestrian Graph
 * Returns: { pathNodeIds, pathCoords, totalDistanceMeters, walkMinutes, stepInstructions }
 */
export function calculateCampusRoute(originId, destinationId, customOriginCoords = null) {
  if (!originId || !destinationId) return null;

  let startNodeId = originId;
  let customStartCoords = null;

  // Handle GPS / Current Location input
  if (originId === 'current-location' || originId === 'gps') {
    if (!customOriginCoords) return null;
    const closest = findClosestGraphNode(customOriginCoords);
    if (!closest) return null;
    startNodeId = closest.id;
    customStartCoords = customOriginCoords;
  }

  // Handle identical origin and destination
  if (startNodeId === destinationId) {
    const destLoc = CAMPUS_LANDMARKS.find((l) => l.id === destinationId);
    return {
      success: true,
      pathNodeIds: [destinationId],
      pathCoords: [destLoc ? destLoc.coords : GRAPH_NODES[destinationId]],
      totalDistanceMeters: 0,
      formattedDistance: '0 m',
      walkMinutes: 0,
      formattedTime: '0 mins',
      originName: 'Your Location',
      destinationName: destLoc ? destLoc.name : destinationId,
      stepInstructions: ['You are already at your destination.']
    };
  }

  // Run Dijkstra's algorithm
  const distances = {};
  const previous = {};
  const unvisited = new Set(Object.keys(GRAPH_NODES));

  Object.keys(GRAPH_NODES).forEach((nodeId) => {
    distances[nodeId] = Infinity;
    previous[nodeId] = null;
  });

  distances[startNodeId] = 0;

  while (unvisited.size > 0) {
    // Find node in unvisited with smallest distance
    let current = null;
    let shortestDist = Infinity;
    for (const node of unvisited) {
      if (distances[node] < shortestDist) {
        shortestDist = distances[node];
        current = node;
      }
    }

    if (!current || shortestDist === Infinity) break;
    if (current === destinationId) break;

    unvisited.delete(current);

    const neighbors = CAMPUS_GRAPH[current] || [];
    for (const edge of neighbors) {
      if (unvisited.has(edge.node)) {
        const alt = distances[current] + edge.weight;
        if (alt < distances[edge.node]) {
          distances[edge.node] = alt;
          previous[edge.node] = current;
        }
      }
    }
  }

  // Reconstruct path
  const pathNodeIds = [];
  let curr = destinationId;
  while (curr) {
    pathNodeIds.unshift(curr);
    curr = previous[curr];
  }

  if (pathNodeIds[0] !== startNodeId) {
    // No path found via graph, fallback to direct path
    const pStart = customStartCoords || GRAPH_NODES[originId] || [10.898, 76.9003];
    const pEnd = GRAPH_NODES[destinationId] || [10.9001, 76.9037];
    const directDist = Math.round(calculateHaversineDistance(pStart, pEnd) * 1.25);
    const mins = Math.max(1, Math.round(directDist / WALKING_SPEED_METERS_PER_MIN));

    return {
      success: true,
      pathNodeIds: [originId, destinationId],
      pathCoords: [pStart, pEnd],
      totalDistanceMeters: directDist,
      formattedDistance: directDist >= 1000 ? `${(directDist / 1000).toFixed(1)} km` : `${directDist} m`,
      walkMinutes: mins,
      formattedTime: `~${mins} min walk`,
      originName: originId === 'current-location' ? 'Your Location' : originId,
      destinationName: destinationId,
      stepInstructions: [`Walk towards ${destinationId} (~${directDist}m)`]
    };
  }

  // Collect path coordinates
  const pathCoords = [];
  if (customStartCoords) {
    pathCoords.push(customStartCoords);
  }

  pathNodeIds.forEach((id) => {
    if (GRAPH_NODES[id]) {
      pathCoords.push(GRAPH_NODES[id]);
    }
  });

  // Calculate true path distance along waypoints
  let computedDistance = 0;
  for (let i = 0; i < pathCoords.length - 1; i++) {
    computedDistance += calculateHaversineDistance(pathCoords[i], pathCoords[i + 1]);
  }

  const roundedDistance = Math.round(computedDistance);
  const formattedDistance =
    roundedDistance >= 1000
      ? `${(roundedDistance / 1000).toFixed(2)} km`
      : `${roundedDistance} m`;

  const walkMinutes = Math.max(1, Math.round(roundedDistance / WALKING_SPEED_METERS_PER_MIN));
  const formattedTime = `~${walkMinutes} min walk`;

  const originLoc = CAMPUS_LANDMARKS.find((l) => l.id === originId);
  const destLoc = CAMPUS_LANDMARKS.find((l) => l.id === destinationId);

  // Generate turn-by-turn guidance steps
  const steps = [];
  steps.push(`Start from ${originLoc ? originLoc.name : (customStartCoords ? 'Your Current Location' : 'Starting Point')}`);

  if (pathNodeIds.includes('j_south_cross') && destinationId !== 'loc-gate') {
    steps.push('Follow South Avenue past the Central Shopping Complex');
  }
  if (pathNodeIds.includes('j_central_circle')) {
    steps.push('Cross Central Circle near the Administration Block');
  }
  if (pathNodeIds.includes('j_lib_front')) {
    steps.push('Proceed along Library Promenade');
  }
  if (pathNodeIds.includes('j_it_canteen_plaza')) {
    steps.push('Approach the North Academic Quad (near AB-3 & Food Court)');
  }
  if (pathNodeIds.includes('j_amenities_fork') && destinationId === 'loc-1') {
    steps.push('Turn into the Central Student Amenities forecourt');
  }

  steps.push(`Arrive at ${destLoc ? destLoc.fullName : 'Destination'} (${formattedDistance})`);

  return {
    success: true,
    pathNodeIds,
    pathCoords,
    totalDistanceMeters: roundedDistance,
    formattedDistance,
    walkMinutes,
    formattedTime,
    originName: originLoc ? originLoc.name : (customStartCoords ? 'Your Current Location' : 'Selected Origin'),
    destinationName: destLoc ? destLoc.name : destinationId,
    destinationCategory: destLoc?.category || 'Facility',
    destinationBuilding: destLoc?.building || 'Amrita Campus',
    stepInstructions: steps,
    caloriesBurnedKcal: Math.round(roundedDistance * 0.045), // ~45 kcal per km
    estimatedSteps: Math.round(roundedDistance * 1.35) // ~1350 steps per km
  };
}
