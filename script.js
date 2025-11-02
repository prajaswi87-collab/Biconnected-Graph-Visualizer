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

canvas.addEventListener('click', (e) => {
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

function buildAdjacencyList() {
    const adj = new Map();
    vertices.forEach(v => adj.set(v.id, []));
    edges.forEach(e => {
        adj.get(e.v1.id).push(e.v2.id);
        adj.get(e.v2.id).push(e.v1.id);
    });
    return adj;
}

function findArticulationPoints() {
    articulationPoints.clear();
    bridges.clear();
    dfsTreeEdges.clear();
    backEdges.clear();
    componentColors.clear();

    if (vertices.length === 0) {
        updateStats();
        draw();
        return;
    }

    const adj = buildAdjacencyList();
    const visited = new Set();
    const disc = new Map();
    const low = new Map();
    const parent = new Map();
    let time = 0;

    function dfs(u) {
        visited.add(u);
        disc.set(u, time);
        low.set(u, time);
        time++;

        let children = 0;
        const neighbors = adj.get(u);

        for (const v of neighbors) {
            if (!visited.has(v)) {
                children++;
                parent.set(v, u);
                dfsTreeEdges.add(`${Math.min(u,v)}-${Math.max(u,v)}`);

                dfs(v);

                low.set(u, Math.min(low.get(u), low.get(v)));

                if (parent.get(u) === undefined && children > 1) {
                    articulationPoints.add(u);
                }

                if (parent.get(u) !== undefined && low.get(v) >= disc.get(u)) {
                    articulationPoints.add(u);
                }
            } else if (v !== parent.get(u)) {
                low.set(u, Math.min(low.get(u), disc.get(v)));
                backEdges.add(`${Math.min(u,v)}-${Math.max(u,v)}`);
            }
        }
    }

    vertices.forEach(v => {
        if (!visited.has(v.id)) {
            parent.set(v.id, undefined);
            dfs(v.id);
        }
    });

    updateStats();
    draw();
}

function findBridges() {
    articulationPoints.clear();
    bridges.clear();
    dfsTreeEdges.clear();
    backEdges.clear();
    componentColors.clear();

    if (vertices.length === 0) {
        updateStats();
        draw();
        return;
    }

    const adj = buildAdjacencyList();
    const visited = new Set();
    const disc = new Map();
    const low = new Map();
    const parent = new Map();
    let time = 0;

    function dfs(u) {
        visited.add(u);
        disc.set(u, time);
        low.set(u, time);
        time++;

        const neighbors = adj.get(u);

        for (const v of neighbors) {
            if (!visited.has(v)) {
                parent.set(v, u);
                dfsTreeEdges.add(`${Math.min(u,v)}-${Math.max(u,v)}`);

                dfs(v);

                low.set(u, Math.min(low.get(u), low.get(v)));

                if (low.get(v) > disc.get(u)) {
                    bridges.add(`${Math.min(u,v)}-${Math.max(u,v)}`);
                }
            } else if (v !== parent.get(u)) {
                low.set(u, Math.min(low.get(u), disc.get(v)));
                backEdges.add(`${Math.min(u,v)}-${Math.max(u,v)}`);
            }
        }
    }

    vertices.forEach(v => {
        if (!visited.has(v.id)) {
            parent.set(v.id, undefined);
            dfs(v.id);
        }
    });

    updateStats();
    draw();
}

function colorComponents() {
    articulationPoints.clear();
    bridges.clear();
    dfsTreeEdges.clear();
    backEdges.clear();
    componentColors.clear();

    if (vertices.length === 0) {
        updateStats();
        draw();
        return;
    }

    const adj = buildAdjacencyList();
    const visited = new Set();
    const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', 
        '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
        '#F8B88B', '#A8E6CF'
    ];
    let colorIndex = 0;

    function dfs(u, color) {
        visited.add(u);
        componentColors.set(u, color);

        const neighbors = adj.get(u);
        for (const v of neighbors) {
            if (!visited.has(v)) {
                dfs(v, color);
            }
        }
    }

    vertices.forEach(v => {
        if (!visited.has(v.id)) {
            dfs(v.id, colors[colorIndex % colors.length]);
            colorIndex++;
        }
    });

    updateStats();
    draw();
}

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
