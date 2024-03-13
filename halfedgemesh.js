/**
 * Skeleton code implementation for a half-edge mesh
 */

let vec3 = glMatrix.vec3;

///////////////////////////////////////////////////
//                 MESH COMPONENTS               //
///////////////////////////////////////////////////

class HEdge {
    /**
     * Constructor for a half-edge
     */
    constructor() {
        this.head = null; // Head vertex (Type HVertex)
        this.face = null; // Left face (Type HFace)
        this.pair = null; // Half edge on opposite face (Type HEdge)
        this.prev = null; // Previous half edge in CCW order around left face (Type HEdge)
        this.next = null; // Next half edge in CCW order around left face (Type HEdge)
    }

    /**
     * Return a list of the two vertices attached to this edge,
     * or an empty list if one of them has not yet been initialized
     * 
     * @returns {list} A 2-element list of HVertex objects corresponding
     *                  to vertices attached to this edge
     */
    getVertices() {
        let ret = [];
        if (!(this.head === null) && !(this.prev === null)) {
            if (!(this.prev.head === null)) {
                ret = [this.head, this.prev.head];
            }
        }
        return ret;
    }
}

class HFace {
    /**
     * Constructor for a half-edge face
     */
    constructor() {
        this.h = null; // Any HEdge on this face (Type HEdge)
    }
    
    /**
     * Get a list of half-edges involved with this face
     * 
     * @returns {list} A list of HEdge objects corresponding
     *                 to edges at the boundary of this face
     */
    getEdges() {
        if (this.h === null) {
            return [];
        }
        let h = this.h.next;
        let edges = [this.h];

        while(h != this.h) {
            edges.push(h);
            h = h.next;
        }

        return edges;
    }

    /**
     * Get a list of vertices attached to this face
     * 
     * @returns {list} A list of HVertex objects corresponding
     *                 to vertices on this face
     */
    getVertices() {
        if (this.h === null) {
            return [];
        }
        let h = this.h.next;
        let vertices = [this.h.head];
        while (h != this.h) {
            vertices.push(h.head);
            h = h.next;
        }
        return vertices;
    }

    /**
     * Compute the area of this face
     * 
     * @returns {float} The area of this face
     */
    getArea() {
        let edges = this.getEdges();
        let result = vec3.fromValues(0,0,0);

        for(let i = 0; i<edges.length-2; i++) {
            let cross = vec3.create();
            let v1 = vec3.create();
            let v2 = vec3.create();

            v1 = this.getVectorBetweenPoints(edges[i].head.pos, edges[i].prev.head.pos);
            v2 = this.getVectorBetweenPoints(edges[i+1].head.pos, edges[i+1].prev.head.pos);

            vec3.cross(cross, v1, v2);
            vec3.scale(cross, cross, 0.5);
            vec3.add(result, result, cross);
        }

        return vec3.length(result);
    }

    /**
     * Get the normal of this face, assuming it is flat
     * 
     * @returns {vec3} The normal of this face
     */
    getNormal() {
        let normal = vec3.create();
        let v1 = vec3.create();
        let v2 = vec3.create();
        let aux = vec3.create();

        v1 = this.getVectorBetweenPoints(this.h.head.pos, this.h.prev.head.pos);
        v2 = this.getVectorBetweenPoints(this.h.next.head.pos, this.h.head.pos);

        vec3.cross(normal, v1, v2);
        vec3.normalize(normal, normal);

        return normal;
    }

    getVectorBetweenPoints(a, b) {
        let vector = vec3.create();
        let aux = vec3.create();

        vec3.negate(aux, b);
        vec3.add(vector, a, aux);
        
        return vector;
    }
}

class HVertex {
    /**
     * Constructor for a half-edge vertex
     * @param {glMatrix.vec3} pos Position of this vertex
     * @param {glMatrix.vec3} color Color of this vertex.
     *                              If unspecified, it defaults to gray
     */
    constructor(pos, color) {
        if (color === undefined) {
            color = [0.5, 0.5, 0.5];
        }
        this.pos = pos; // Position of this vertex (Type vec3)
        this.color = color; // Color of this vertex (Type vec3)
        this.h = null; // Any hedge on this vertex (Type Hedge)
    }

    /**
     * Compute the vertices that are attached to this
     * vertex by an edge
     * 
     * @returns {list} List of HVertex objects corresponding
     *                 to the attached vertices
     */
    getVertexNeighbors() {
        if (this.h === null) {
            return [];
        }

        if(this.h.head.ID == this.ID) {
            this.h = this.h.next;
        }

        let neighbors = [];
        let edge = this.h;

        do {
            neighbors.push(edge.head);

            while(edge.head.ID != this.ID) {
                edge = edge.next;
            }

            edge = edge.pair;
        } while(edge.head.ID != neighbors[0].ID);

        return neighbors;
    }

    /**
     * Compute the faces of which this vertex is a member
     * 
     * @returns {list} A list of HFace objects corresponding
     *                  to the incident faces
     */
    getAttachedFaces() {
        if (this.h === null) {
            return [];
        }

        if(this.h.head.ID == this.ID) {
            this.h = this.h.next;
        }

        let faces = [];
        let edge = this.h;

        do {
            if(edge.face !== null) {
                faces.push(edge.face);
            }

            while(edge.head.ID != this.ID) {
                edge = edge.next;
            }

            edge = edge.pair;

            if(edge.face === null) {
                while(edge.head.ID != this.ID) {
                    edge = edge.next;
                }
    
                edge = edge.pair;
            }
        } while(edge.face.ID != faces[0].ID);

        return faces;
    }

    /**
     * Compute the normal of this vertex as an area-weighted
     * average of the normals of the faces attached to this vertex
     * 
     * @returns {vec3} The estimated normal
     */
    getNormal() {
        let normal = vec3.fromValues(0, 0, 0); 
        let faces = this.getAttachedFaces();
        let areaSum = 0.0;

        for(let i = 0; i<faces.length; i++) {
            let faceNormal = faces[i].getNormal();
            
            let area = faces[i].getArea();
            areaSum += area;

            vec3.scale(faceNormal, faceNormal, area);
            vec3.add(normal, normal, faceNormal);
        }

        vec3.scale(normal, normal, 1/areaSum);

        return normal;
    }
}

///////////////////////////////////////////////////
//               HELPER FUNCTIONS                //
///////////////////////////////////////////////////

/**
 * Make two new hedge objects which are linked
 */
function makeHedgePair() {
    const h1 = new HEdge();
    const h2 = new HEdge();
    linkEdges(h1, h2);
    return {'h1':h1, 'h2':h2};
}

/**
 * Make the next pointer of h1 h2 and the previous
 * pointer of h2 h1
 * @param {HEdge} h1 first edge 
 * @param {Hedge} h2 next edge
 */
function makeNextPrev(h1, h2) {
    h1.next = h2;
    h2.prev = h1;
}

/**
 * Link two half-edges together
 * @param {HEdge} h1 first edge 
 * @param {Hedge} h2 next edge
 */
function linkEdges(h1, h2) {
    h1.pair = h2;
    h2.pair = h1;
}


///////////////////////////////////////////////////
//               MAIN MESH CLASS                 //
///////////////////////////////////////////////////

class HedgeMesh extends PolyMesh {
    /**
     * @returns {I} A NumTrisx3 Uint32Array of indices into the vertex array
     */
    getTriangleIndices() {
        let NumTris = 0;
        let allvs = [];
        for (let i = 0; i < this.faces.length; i++) {
            let vsi = this.faces[i].getVertices();
            allvs.push(vsi.map(function(v){
                return v.ID;
            }));
            NumTris += vsi.length - 2;
        }
        let I = new Uint32Array(NumTris*3);
        let i = 0;
        let faceIdx = 0;
        //Now copy over the triangle indices
        while (i < NumTris) {
            let verts = allvs[faceIdx]
            for (let t = 0; t < verts.length - 2; t++) {
                I[i*3] = verts[0];
                I[i*3+1] = verts[t+1];
                I[i*3+2] = verts[t+2];
                i++;
            }
            faceIdx++;
        }
        return I;
    }

    /**
     * @returns {I} A NEdgesx2 Uint32Array of indices into the vertex array
     */
    getEdgeIndices() {
        let I = [];
        for (let i = 0; i < this.edges.length; i++) {
            let vs = this.edges[i].getVertices();
            for (let k = 0; k < vs.length; k++) {
                I.push(vs[k].ID);
            }
        }
        return new Uint32Array(I);
    }

    /**
     * Given two vertex objects representing an edge,
     * and a face to the left of that edge, initialize
     * a half edge object and add it to the list of edges
     * 
     * @param {HVertex} v1 First vertex on edge
     * @param {HVertex} v2 Second vertex on edge
     * @param {HFace} face Face to the left of edge
     * 
     * @returns {HEdge} The constructed half edge
     */
    addHalfEdge(v1, v2, face) {
        const hedge = new HEdge();
        hedge.head = v2; // Points to head vertex of edge
        hedge.face = face;
        v1.h = hedge; // Let tail vertex point to this edge
        this.edges.push(hedge);
        return hedge;
    }

    /////////////////////////////////////////////////////////////
    ////                INPUT/OUTPUT METHODS                /////
    /////////////////////////////////////////////////////////////

    /**
     * Load in an OFF file from lines and convert into
     * half edge mesh format. Crucially, this function assumes
     * a consistently oriented mesh with vertices specified 
     * in CCW order
     */
    loadFileFromLines(lines) {
        // Step 1: Consistently orient faces using
        // the basic mesh structure and copy over the result
        const origMesh = new BasicMesh();
        origMesh.loadFileFromLines(lines);
        origMesh.consistentlyOrientFaces();
        origMesh.subtractCentroid();
        const res = {'vertices':[], 'colors':[], 'faces':[]};
        for (let i = 0; i < origMesh.vertices.length; i++) {
            res['vertices'].push(origMesh.vertices[i].pos);
            res['colors'].push(origMesh.vertices[i].color);
        }
        for (let i = 0; i < origMesh.faces.length; i++) {
            // These faces should now be consistently oriented
            const vs = origMesh.faces[i].getVertices();
            res['faces'].push(vs.map(
                function(v) {
                    return v.ID;
                }
            ));
        }

        // Step 1.5: Clear previous mesh
        this.vertices.length = 0;
        this.edges.length = 0;
        this.faces.length = 0;

        // Step 2: Add vertices
        for (let i = 0; i < res['vertices'].length; i++) {
            let V = new HVertex(res['vertices'][i], res['colors'][i]);
            V.ID = this.vertices.length;
            this.vertices.push(V);
        }

        let str2Hedge = {};
        // Step 3: Add faces and halfedges
        for (let i = 0; i < res['faces'].length; i++) {
            const face = new HFace();
            this.faces.push(face);
            let vertsi = [];
            for (let k = 0; k < res['faces'][i].length; k++) {
                vertsi.push(this.vertices[res['faces'][i][k]]);
            }

            // Add halfedges
            for (let k = 0; k < vertsi.length; k++) {
                const v1 = vertsi[k];
                const v2 = vertsi[(k+1)%vertsi.length];
                // Add each half edge
                const hedge = this.addHalfEdge(v1, v2, face);
                // Store half edge in hash table
                let key = v1.ID+"_"+v2.ID;
                str2Hedge[key] = hedge;
                face.h = hedge;
            }

            // Link edges together around face in CCW order
            // assuming each vertex points to the half edge
            // starting at that vertex
            // (which addHalfEdge has just done)
            for (let k = 0; k < vertsi.length; k++) {
                vertsi[k].h.next = vertsi[(k+1)%vertsi.length].h;
                vertsi[(k+1)%vertsi.length].h.prev = vertsi[k].h;
            }
        }

        // Step 4: Add links between opposite half edges if 
        // they exist.  Otherwise, it is a boundary edge, so
        // add a half edge with a null face on the other side
        let boundaryEdges = {}; // Index boundary edges by their tail
        for (const key in str2Hedge) {
            const v1v2 = key.split("_");
            let h1 = str2Hedge[key];
            const other = v1v2[1]+"_"+v1v2[0];
            if (other in str2Hedge) {
                h1.pair = str2Hedge[other];
            }
            else {
                let h2 = new HEdge();
                h1.pair = h2;
                h2.pair = h1;
                h2.head = this.vertices[v1v2[0]];
                boundaryEdges[v1v2[1]] = h2;
                this.edges.push(h2);
            }
        }

        // Step 5: Link boundary edges
        for (let key in boundaryEdges) {
            let e = boundaryEdges[key];
            if (e.next === null) {
                let e2 = boundaryEdges[e.head.ID];
                e.next = e2;
                e2.prev = e;
            }
        }

        // Step 6: Number faces and edges to help with quick removal
        for (let i = 0; i < this.edges.length; i++) {
            this.edges[i].ID = i;
        }
        for (let i = 0; i < this.faces.length; i++) {
            this.faces[i].ID = i;
        }

        console.log("Initialized half edge mesh with " + 
                    this.vertices.length + " vertices, " + 
                    this.edges.length + " half edges, " + 
                    this.faces.length + " faces");

        this.needsDisplayUpdate = true;
    }


    /////////////////////////////////////////////////////////////
    ////                  GEOMETRIC TASKS                   /////
    /////////////////////////////////////////////////////////////
    
    /**
     * Move each vertex along its normal by a factor
     * 
     * @param {float} fac Move each vertex position by this
     *                    factor of its normal.
     *                    If positive, the mesh will inflate.
     *                    If negative, the mesh will deflate.
     */
    inflateDeflate(fac) {
        // Loop through all the vertices in the mesh
        for (let vertex of this.vertices) {
            // TODO: Fill this in
        }
        this.needsDisplayUpdate = true;
    }

    /**
     * Compute the mean vector from all of this vertex's neighbors
     * to the vertex.  If smoothing, subtract this vector off.
     * If sharpening, add this vector on
     * 
     * @param {boolean} smooth If true, smooth.  If false, sharpen
     */
    laplacianSmoothSharpen(smooth) {
        // TODO: Fill this in

        this.needsDisplayUpdate = true;
    }


    /////////////////////////////////////////////////////////////
    ////                  TOPOLOGICAL TASKS                 /////
    /////////////////////////////////////////////////////////////
    /**
     * Return a list of boundary cycles
     * 
     * @returns {list} A list of cycles, each of which is
     *                 its own list of HEdge objects corresponding
     *                 to a unique cycle
     */
    getBoundaryCycles() {
        let cycles = [];
        // TODO: Fill this in (hint: Add a variable to an edge which
        // stores whether this edge has been checked yet)

        return cycles;
    }

    /**
     * Compute the genus of this mesh if it is watertight.
     * If it is not watertight, return -1
     * 
     * @returns {int} genus if watertight, or -1 if not
     */
    getGenus() {
        let genus = -1;
        // TODO: Fill this in (hint: there are two half edges for every edge!)

        return genus;

    }


    /////////////////////////////////////////////////////////////
    ////                MESH CREATION TASKS                 /////
    /////////////////////////////////////////////////////////////
    
    /**
     * An simple method to show how to make a half-edge mesh with
     * everything linked together properly
     */
    makeTriangle() {
        let mesh = new HedgeMesh();
        let v1 = new HVertex(vec3.fromValues(0, 0, 0));
        let v2 = new HVertex(vec3.fromValues(1, 0, 0));
        let v3 = new HVertex(vec3.fromValues(0, 1, 0));
        mesh.vertices = [v1, v2, v3];
        for (let k = 0; k < 6; k++) {
            mesh.edges.push(new HEdge());
        }
        let f = new HFace();
        f.h = mesh.edges[0];
        mesh.faces = [f];
        for (let k = 0; k < 3; k++) {
            mesh.vertices[k].h = mesh.edges[k];
            mesh.edges[k].head = mesh.vertices[(k+1)%3];
            mesh.edges[k+3].head = mesh.vertices[k];
            mesh.edges[k].face = f;
            makeNextPrev(mesh.edges[k], mesh.edges[(k+1)%3]);
            makeNextPrev(mesh.edges[3+(k+1)%3], mesh.edges[3+k]);
            linkEdges(mesh.edges[k], mesh.edges[k+3]);
        }
        mesh.needsDisplayUpdate = true;
        return mesh;
    }

    /**
     * Create a surface of revolution
     * @param {list} points A list of [x, y] points on the original curve
     * @param {int} NAngles Number of angles by which to rotate the original points
     */
    makeSurfaceOfRevolution(points, NAngles) {
        let mesh = new HedgeMesh();
        // TODO: Fill this in
        mesh.needsDisplayUpdate = true;
        return mesh;
    }

    /**
     * Truncate the mesh by slicing off the tips of each vertex
     * @param {float} fac The amount to go down each edge from the vertex
     *                    (should be between 0 and 1)
     */
    truncate(fac) {
        let mesh = new HedgeMesh();
        // TODO: Fill this in
        mesh.needsDisplayUpdate = true;
        return mesh;
    }

    /**
     * Perform a purely topological subdivision, assuming a triangle mesh
     */
    subdivideTopological() {
        let mesh = new HedgeMesh();
        // TODO: Fill this in
        mesh.needsDisplayUpdate = true;
        return mesh;
    }

    /**
     * Perform a linear subdivision of a triangle mesh
     */
    subdivideLinear() {
        let mesh = this.subdivideTopological();
        // TODO: Fill this in
        return mesh;
    }

    /** 
     * Perform Loop subdivision on the mesh
     */
    subdivideLoop() {
        let mesh = this.subdivideTopological();
        // TODO: Fill this in
        return mesh;
    }
}