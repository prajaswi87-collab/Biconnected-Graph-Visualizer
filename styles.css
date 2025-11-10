const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let vertices = [];
let edges = [];
let mode = 'vertex';
let selectedVertex = null;
let vertexIdCounter = 0;

let articulationPoints = new Set();
let bridges = new Set(); // stores "min-max" string keys for edges
let componentColors = new Map();
let dfsTreeEdges = new Set(); // keys
let backEdges = new Set(); // keys

// Dragging variables
let isDragging = false;
let draggedVertex = null;

function setMode(newMode) {
    mode = newMode;
    selectedVertex = null;
    const modeText = {
        'vertex': 'Mode: Add Vertices',
        'edge': 'Mode: Add Edges (Click two vertices)',
        'delete': 'Mode: Delete (Click vertex/edge)'
    };
    document.getElementById('modeIndicator').textContent = modeText[newMode];
}

// Canvas interactions
canvas.addEventListener('click', (e) => {
    if (isDragging) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (mode === 'vertex') {
        addVertex(x, y);
    } else if (mode === 'edge') {
        handleEdgeMode(x, y);
    } else if (mode === 'delete') {
        handleDelete(x, y);
    }
});

canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    for (let v of vertices) {
        const dx = x - v.x;
        const dy = y - v.y;
        if (Math.sqrt(dx * dx + dy * dy) < 20) {
            isDragging = true;
            draggedVertex = v;
            break;
        }
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (!isDragging || !draggedVertex) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    draggedVertex.x = x;
    draggedVertex.y = y;
    draw();
});

canvas.addEventListener('mouseup', () => {
    isDragging = false;
    draggedVertex = null;
});

// Vertex/edge operations
function addVertex(x, y) {
    const vertex = { id: vertexIdCounter++, x: x, y: y, label: vertices.length };
    vertices.push(vertex);
    updateStats();
    draw();
}

function handleEdgeMode(x, y) {
    const clickedVertex = getVertexAt(x, y);
    if (clickedVertex) {
        if (!selectedVertex) {
            selectedVertex = clickedVertex;
        } else {
            if (selectedVertex.id !== clickedVertex.id) {
                addEdge(selectedVertex, clickedVertex);
            }
            selectedVertex = null;
        }
        draw();
    }
}

function addEdge(v1, v2) {
    const edgeExists = edges.some(e =>
        (e.v1.id === v1.id && e.v2.id === v2.id) ||
        (e.v1.id === v2.id && e.v2.id === v1.id)
    );
    if (!edgeExists) {
        edges.push({ v1, v2 });
        updateStats();
    }
}

function handleDelete(x, y) {
    const vertex = getVertexAt(x, y);
    if (vertex) {
        vertices = vertices.filter(v => v.id !== vertex.id);
        edges = edges.filter(e => e.v1.id !== vertex.id && e.v2.id !== vertex.id);
        // reset indices/labels optionally left as-is
        updateStats();
        draw();
        return;
    }

    const edge = getEdgeAt(x, y);
    if (edge) {
        edges = edges.filter(e => e !== edge);
        updateStats();
        draw();
    }
}

function getVertexAt(x, y) {
    return vertices.find(v => {
        const dx = v.x - x;
        const dy = v.y - y;
        return Math.sqrt(dx * dx + dy * dy) < 20;
    });
}

function getEdgeAt(x, y) {
    return edges.find(e => {
        const dist = distanceToSegment(x, y, e.v1.x, e.v1.y, e.v2.x, e.v2.y);
        return dist < 10;
    });
}

function distanceToSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const l2 = dx * dx + dy * dy;
    if (l2 === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);

    let t = ((px - x1) * dx + (py - y1) * dy) / l2;
    t = Math.max(0, Math.min(1, t));

    const projX = x1 + t * dx;
    const projY = y1 + t * dy;
    return Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);
}

// adjacency builder
function buildAdjacencyList() {
    const adj = new Map();
    vertices.forEach(v => adj.set(v.id, []));
    edges.forEach(e => {
        if (!adj.has(e.v1.id) || !adj.has(e.v2.id)) return;
        adj.get(e.v1.id).push(e.v2.id);
        adj.get(e.v2.id).push(e.v1.id);
    });
    return adj;
}

// Utilities for edge key
function edgeKey(a, b) {
    return `${Math.min(a, b)}-${Math.max(a, b)}`;
}

// Tarjan's algorithm implementation
function resetSearchState() {
    articulationPoints.clear();
    bridges.clear();
    dfsTreeEdges.clear();
    backEdges.clear();
    componentColors.clear();
}

function findArticulationPoints() {
    resetSearchState();

    const adj = buildAdjacencyList();
    const n = vertices.length;
    const disc = new Map();
    const low = new Map();
    const parent = new Map();
    let time = 0;

    vertices.forEach(v => {
        disc.set(v.id, -1);
        low.set(v.id, Infinity);
        parent.set(v.id, -1);
    });

    function dfs(u) {
        disc.set(u, ++time);
        low.set(u, disc.get(u));
        let children = 0;

        const neighbors = adj.get(u) || [];
        for (let v of neighbors) {
            const key = edgeKey(u, v);
            if (disc.get(v) === -1) {
                children++;
                parent.set(v, u);
                dfsTreeEdges.add(key);
                dfs(v);

                low.set(u, Math.min(low.get(u), low.get(v)));

                if (parent.get(u) === -1 && children > 1) {
                    articulationPoints.add(u);
                }
                if (parent.get(u) !== -1 && low.get(v) >= disc.get(u)) {
                    articulationPoints.add(u);
                }
                if (low.get(v) > disc.get(u)) {
                    bridges.add(key);
                }
            } else if (v !== parent.get(u)) {
                // back edge
                backEdges.add(key);
                low.set(u, Math.min(low.get(u), disc.get(v)));
            }
        }
    }

    // run DFS for each component
    for (let v of vertices) {
        if (disc.get(v.id) === -1) {
            dfs(v.id);
        }
    }

    updateStats();
    draw();
}

function findBridges() {
    // Tarjan already sets bridges in findArticulationPoints; but ensure it's computed
    findArticulationPoints(); // will compute both APs and bridges
    // draw will reflect bridges
}

// Color connected components
function colorComponents() {
    // compute connected components
    componentColors.clear();
    const adj = buildAdjacencyList();
    const visited = new Set();
    const palette = [
        '#fee2e2', '#feeccf', '#fef3c7', '#ecfccb', '#d1fae5',
        '#dbeafe', '#e9d5ff', '#ffe4f0', '#f0f9ff', '#e6fffb'
    ];

    let colorIndex = 0;

    function bfs(startId) {
        const q = [startId];
        visited.add(startId);
        const comp = [];
        while (q.length) {
            const u = q.shift();
            comp.push(u);
            const nbrs = adj.get(u) || [];
            for (let v of nbrs) {
                if (!visited.has(v)) {
                    visited.add(v);
                    q.push(v);
                }
            }
        }
        const color = palette[colorIndex % palette.length];
        colorIndex++;
        comp.forEach(id => componentColors.set(id, color));
    }

    for (let v of vertices) {
        if (!visited.has(v.id)) {
            bfs(v.id);
        }
    }

    updateStats();
    draw();
}

function resetHighlights() {
    articulationPoints.clear();
    bridges.clear();
    dfsTreeEdges.clear();
    backEdges.clear();
    componentColors.clear();
    updateStats();
    draw();
}

// drawing
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // draw edges
    edges.forEach(e => {
        const key = edgeKey(e.v1.id, e.v2.id);
        ctx.beginPath();
        ctx.moveTo(e.v1.x, e.v1.y);
        ctx.lineTo(e.v2.x, e.v2.y);

        if (bridges.has(key)) {
            ctx.strokeStyle = '#ff8800';
            ctx.lineWidth = 5;
        } else if (dfsTreeEdges.has(key)) {
            ctx.strokeStyle = '#4444ff';
            ctx.lineWidth = 3;
        } else if (backEdges.has(key)) {
            ctx.strokeStyle = '#44ff44';
            ctx.lineWidth = 3;
        } else {
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2;
        }
        ctx.stroke();
    });

    // draw vertices
    vertices.forEach(v => {
        ctx.beginPath();
        ctx.arc(v.x, v.y, 20, 0, Math.PI * 2);

        if (v === draggedVertex) {
            ctx.shadowColor = 'yellow';
            ctx.shadowBlur = 20;
        } else {
            ctx.shadowBlur = 0;
        }

        if (articulationPoints.has(v.id)) {
            ctx.fillStyle = '#ff4444';
        } else if (componentColors.has(v.id)) {
            ctx.fillStyle = componentColors.get(v.id);
        } else {
            ctx.fillStyle = '#667eea';
        }

        ctx.fill();
        ctx.strokeStyle = v === selectedVertex ? '#ffff00' : '#333';
        ctx.lineWidth = v === selectedVertex ? 4 : 2;
        ctx.stroke();

        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(v.label, v.x, v.y);

        ctx.shadowBlur = 0;
    });
}

function updateStats() {
    document.getElementById('vertexCount').textContent = vertices.length;
    document.getElementById('edgeCount').textContent = edges.length;
    document.getElementById('apCount').textContent = articulationPoints.size;
    document.getElementById('bridgeCount').textContent = bridges.size;

    const componentSet = new Set(componentColors.values());
    document.getElementById('componentCount').textContent = componentSet.size || 0;
}

function clearGraph() {
    vertices = [];
    edges = [];
    resetSearchState();
    selectedVertex = null;
    vertexIdCounter = 0;
    updateStats();
    draw();
}

// Examples
function loadExample(type) {
    clearGraph();

    if (type === 'simple') {
        vertices = [
            {id: 0, x: 200, y: 150, label: 0},
            {id: 1, x: 350, y: 150, label: 1},
            {id: 2, x: 500, y: 150, label: 2},
            {id: 3, x: 350, y: 300, label: 3},
            {id: 4, x: 500, y: 300, label: 4}
        ];
        edges = [
            {v1: vertices[0], v2: vertices[1]},
            {v1: vertices[1], v2: vertices[2]},
            {v1: vertices[1], v2: vertices[3]},
            {v1: vertices[2], v2: vertices[4]},
            {v1: vertices[3], v2: vertices[4]}
        ];
        vertexIdCounter = 5;
    } else if (type === 'complex') {
        vertices = [
            {id: 0, x: 200, y: 200, label: 0},
            {id: 1, x: 350, y: 150, label: 1},
            {id: 2, x: 500, y: 200, label: 2},
            {id: 3, x: 350, y: 300, label: 3},
            {id: 4, x: 650, y: 200, label: 4},
            {id: 5, x: 800, y: 150, label: 5},
            {id: 6, x: 800, y: 300, label: 6}
        ];
        edges = [
            {v1: vertices[0], v2: vertices[1]},
            {v1: vertices[1], v2: vertices[2]},
            {v1: vertices[1], v2: vertices[3]},
            {v1: vertices[2], v2: vertices[3]},
            {v1: vertices[2], v2: vertices[4]},
            {v1: vertices[4], v2: vertices[5]},
            {v1: vertices[4], v2: vertices[6]},
            {v1: vertices[5], v2: vertices[6]}
        ];
        vertexIdCounter = 7;
    }

    updateStats();
    draw();
}

// init
updateStats();
draw();
