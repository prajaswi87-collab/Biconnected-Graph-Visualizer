const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let vertices = [];
let edges = [];
let mode = 'vertex';
let selectedVertex = null;
let vertexIdCounter = 0;

let articulationPoints = new Set();
let bridges = new Set();
let componentColors = new Map();
let dfsTreeEdges = new Set();
let backEdges = new Set();

// 🟡 New variables for dragging
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

// 🖱️ Original click event (slightly tweaked to ignore clicks during drag)
canvas.addEventListener('click', (e) => {
    if (isDragging) return; // Prevent click from triggering when dragging

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

// 🖐️ New drag events
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

function addVertex(x, y) {
    const vertex = {
        id: vertexIdCounter++,
        x: x,
        y: y,
        label: vertices.length
    };
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

// 🧠 Graph algorithms (unchanged)
function buildAdjacencyList() {
    const adj = new Map();
    vertices.forEach(v => adj.set(v.id, []));
    edges.forEach(e => {
        adj.get(e.v1.id).push(e.v2.id);
        adj.get(e.v2.id).push(e.v1.id);
    });
    return adj;
}

// === articulationPoints, findBridges, colorComponents stay exactly as before ===
// (I’m not repeating them since no changes are needed in logic)

// 🎨 Modified draw() to add glow effect when dragging
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    edges.forEach(e => {
        const edgeKey = `${Math.min(e.v1.id, e.v2.id)}-${Math.max(e.v1.id, e.v2.id)}`;

        ctx.beginPath();
        ctx.moveTo(e.v1.x, e.v1.y);
        ctx.lineTo(e.v2.x, e.v2.y);

        if (bridges.has(edgeKey)) {
            ctx.strokeStyle = '#ff8800';
            ctx.lineWidth = 5;
        } else if (dfsTreeEdges.has(edgeKey)) {
            ctx.strokeStyle = '#4444ff';
            ctx.lineWidth = 3;
        } else if (backEdges.has(edgeKey)) {
            ctx.strokeStyle = '#44ff44';
            ctx.lineWidth = 3;
        } else {
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2;
        }

        ctx.stroke();
    });

    vertices.forEach(v => {
        ctx.beginPath();
        ctx.arc(v.x, v.y, 20, 0, Math.PI * 2);

        // 🟡 If being dragged, glow yellow
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

        ctx.shadowBlur = 0; // reset glow
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
    articulationPoints.clear();
    bridges.clear();
    componentColors.clear();
    dfsTreeEdges.clear();
    backEdges.clear();
    selectedVertex = null;
    vertexIdCounter = 0;
    updateStats();
    draw();
}

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

updateStats();
draw();
