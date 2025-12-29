// Core 2D Black Oil simulation logic.
// Uses the IMPES method (Implicit Pressure, Explicit Saturation) to solve flow.
// Handles variable time-stepping and harmonic averaging for permeability.

class SimulatorEngine {
    constructor(config) {
        // Grid setup
        this.nx = config.nx || 20;
        this.ny = config.ny || 20;
        this.dx = config.dx || 100; // ft
        this.dy = config.dy || 100; // ft
        this.dz = config.dz || 50;  // ft
        
        // Rock properties
        // Default values to keep the math stable.
        this.avgPerm = Math.max(0.1, config.permeability !== undefined ? config.permeability : 100); 
        this.avgPoro = Math.max(0.01, config.porosity !== undefined ? config.porosity : 0.2);
        
        // Geology type
        this.geoModel = config.geoModel || 'homogeneous'; 
        
        // Field arrays
        this.K = [];   // Permeability (mD)
        this.Phi = []; // Porosity
        
        // Fluid PVT props
        this.mu_o = config.mu_o || 2.0;
        this.mu_w = config.mu_w || 1.0;
        this.ct = config.ct || 1e-5; 
        this.B_o = config.B_o || 1.2;
        this.B_w = config.B_w || 1.0;

        // Initial conditions
        this.initialPressure = config.initialPressure || 3000;
        this.initialSw = config.initialSw || 0.2;
        this.pressure = [];
        this.saturation = [];
        this.time = 0;
        
        // Time control
        this.dt = config.dt || 0.1; 
        this.max_dS = 0.05; // Cap saturation change for stability
        
        // Well configuration
        this.wells = config.wells || [];
        
        // Production tracking
        this.originalOilInPlace = 0;
        this.cumulativeProd = 0;

        this.initialize();
    }

    initialize() {
        const N = this.nx * this.ny;
        this.pressure = new Float64Array(N).fill(this.initialPressure);
        this.saturation = new Float64Array(N).fill(this.initialSw);
        this.time = 0;
        this.cumulativeProd = 0;
        
        // Build the grid properties
        this.generateGeology();
        
        // Estimate initial oil in place
        this.calculateSTOIIP();
    }
    
    generateGeology() {
        const N = this.nx * this.ny;
        this.K = new Float64Array(N);
        this.Phi = new Float64Array(N);
        
        // Fixed seed for consistent testing results.
        const seed = 12345; 
        const random = () => Math.random(); 

        for (let j = 0; j < this.ny; j++) {
            for (let i = 0; i < this.nx; i++) {
                const idx = this.idx(i, j);
                
                if (this.geoModel === 'homogeneous') {
                    this.K[idx] = this.avgPerm;
                    this.Phi[idx] = this.avgPoro;
                } else if (this.geoModel === 'layered') {
                    // Create some high perm streaks
                    const layerFactor = (j % 5 === 0) ? 5.0 : 0.5;
                    this.K[idx] = this.avgPerm * layerFactor * (0.8 + 0.4 * random());
                    this.Phi[idx] = this.avgPoro * (0.9 + 0.2 * random());
                } else if (this.geoModel === 'channel') {
                    // Simple sinusoidal channel
                    const center = this.nx / 2 + (this.nx / 4) * Math.sin(j / 5);
                    const dist = Math.abs(i - center);
                    const isChannel = dist < 3;
                    this.K[idx] = isChannel ? this.avgPerm * 10 : this.avgPerm * 0.1;
                    this.Phi[idx] = isChannel ? this.avgPoro * 1.2 : this.avgPoro * 0.8;
                } else if (this.geoModel === 'random') {
                    // Log-normal distribution
                    const randNormal = Math.sqrt(-2 * Math.log(random())) * Math.cos(2 * Math.PI * random());
                    this.K[idx] = this.avgPerm * Math.exp(randNormal * 0.5); 
                    this.Phi[idx] = this.avgPoro * (0.85 + 0.3 * random());
                }
            }
        }
    }

    calculateSTOIIP() {
        let poreVol = 0;
        let hcVol = 0;
        const cellVol = this.dx * this.dy * this.dz; // ft3
        const ft3_to_bbl = 0.1781076;
        
        for(let k=0; k<this.nx*this.ny; k++) {
            const pv = cellVol * this.Phi[k];
            poreVol += pv;
            hcVol += pv * (1 - this.initialSw);
        }
        
        // Convert to stock tank barrels
        this.originalOilInPlace = (hcVol * ft3_to_bbl) / this.B_o;
    }

    idx(i, j) {
        return j * this.nx + i;
    }

    // Harmonic average ensures continuity of flux
    getHarmonicPerm(k1, k2) {
        return (2 * k1 * k2) / (k1 + k2 + 1e-10);
    }

    // Relative Permeability (Corey curves)
    krw(Sw) {
        const Swirr = 0.2;
        const Sor = 0.2;
        if (Sw <= Swirr) return 0;
        if (Sw >= 1 - Sor) return 1; 
        const Swn = (Sw - Swirr) / (1 - Swirr - Sor);
        return 0.3 * Math.pow(Swn, 2); 
    }

    kro(Sw) {
        const Swirr = 0.2;
        const Sor = 0.2;
        if (Sw <= Swirr) return 1; 
        if (Sw >= 1 - Sor) return 0;
        const Swn = (Sw - Swirr) / (1 - Swirr - Sor);
        return 0.8 * Math.pow(1 - Swn, 2); 
    }

    step() {
        const N = this.nx * this.ny;
        
        // 1. Adaptive time-stepping
        // Limit max saturation change per step to ~5% to avoid instability
        this.dt = Math.min(this.dt, 5.0); // Cap at 5 days max
        
        // 2. Solve Pressure (Implicit Step)
        const newPressure = new Float64Array(this.pressure);
        const sourceMap = new Float64Array(N).fill(0);
        
        // Map wells to grid
        this.wells.forEach(w => {
            const k = this.idx(w.i, w.j);
            if (w.type === 'injector') {
                sourceMap[k] = w.rate * this.B_w; // Injection is positive
            } else {
                sourceMap[k] = -w.rate * (this.B_o + this.B_w) * 0.5; // Production is negative
            }
        });

        // Iterative Solver (SOR - Successive Over-Relaxation)
        const omega = 1.2; 
        const tolerance = 1e-3;
        let maxError = 0;
        
        // Unit conversion constant for field units
        const alpha = 0.001127; 
        
        for (let iter = 0; iter < 50; iter++) {
            maxError = 0;
            for (let j = 0; j < this.ny; j++) {
                for (let i = 0; i < this.nx; i++) {
                    const k = this.idx(i, j);
                    
                    // Grid neighbors
                    const neighbors = [
                        { i: i - 1, j: j }, // West
                        { i: i + 1, j: j }, // East
                        { i: i, j: j - 1 }, // South
                        { i: i, j: j + 1 }  // North
                    ];
                    
                    let sumOffDiag = 0;
                    let diag = 0;
                    
                    // Accumulation term
                    const Vp = this.dx * this.dy * this.dz * this.Phi[k];
                    const acc = (Vp * this.ct) / this.dt; 
                    
                    const Sw = this.saturation[k];
                    const lambda_t = (this.krw(Sw)/this.mu_w + this.kro(Sw)/this.mu_o); 

                    neighbors.forEach(nb => {
                        if (nb.i >= 0 && nb.i < this.nx && nb.j >= 0 && nb.j < this.ny) {
                            const nbIdx = this.idx(nb.i, nb.j);
                            
                            // Geometry
                            const dist = (nb.i !== i) ? this.dx : this.dy;
                            const area = (nb.i !== i) ? (this.dy * this.dz) : (this.dx * this.dz);
                            
                            // Transmissibility
                            const k_harm = this.getHarmonicPerm(this.K[k], this.K[nbIdx]);
                            const T = alpha * (k_harm * area / dist);
                            const T_eff = T * lambda_t;
                            
                            sumOffDiag += T_eff * newPressure[nbIdx];
                            diag += T_eff;
                        }
                    });

                    diag += acc;
                    const rhs = acc * this.pressure[k] + sourceMap[k];
                    
                    let p_new_star;
                    if (Math.abs(diag) < 1e-15) {
                         p_new_star = newPressure[k]; // Isolated cell, no flow
                    } else {
                         p_new_star = (sumOffDiag + rhs) / diag;
                    }

                    const p_new = (1 - omega) * newPressure[k] + omega * p_new_star;
                    
                    const diff = Math.abs(p_new - newPressure[k]);
                    if(diff > maxError) maxError = diff;
                    
                    newPressure[k] = p_new;
                }
            }
            if(maxError < tolerance) break;
        }
        
        // 3. Solve Saturation (Explicit Step)
        const newSaturation = new Float64Array(this.saturation);
        let maxDeltaSw = 0;

        for (let j = 0; j < this.ny; j++) {
            for (let i = 0; i < this.nx; i++) {
                const k = this.idx(i, j);
                const Vp = this.dx * this.dy * this.dz * this.Phi[k];
                
                let netFluxW = 0;
                
                const neighbors = [
                    { i: i - 1, j: j }, 
                    { i: i + 1, j: j }, 
                    { i: i, j: j - 1 }, 
                    { i: i, j: j + 1 }  
                ];

                neighbors.forEach(nb => {
                    if (nb.i >= 0 && nb.i < this.nx && nb.j >= 0 && nb.j < this.ny) {
                        const nbIdx = this.idx(nb.i, nb.j);
                        
                        // Pressure difference drives flow
                        const dP = newPressure[nbIdx] - newPressure[k];
                        
                        const dist = (nb.i !== i) ? this.dx : this.dy;
                        const area = (nb.i !== i) ? (this.dy * this.dz) : (this.dx * this.dz);
                        const k_harm = this.getHarmonicPerm(this.K[k], this.K[nbIdx]);
                        const T = alpha * (k_harm * area / dist);
                        
                        // Upstream Weighting
                        let mob_w;
                        if (dP > 0) { // Inflow
                            const Sw_nb = this.saturation[nbIdx];
                            mob_w = this.krw(Sw_nb) / this.mu_w;
                        } else { // Outflow
                            const Sw_curr = this.saturation[k];
                            mob_w = this.krw(Sw_curr) / this.mu_w;
                        }
                        
                        netFluxW += T * mob_w * dP; 
                    }
                });

                // Source/Sink terms
                let sourceTerm = 0;
                const well = this.wells.find(w => w.i === i && w.j === j);
                if (well) {
                    if (well.type === 'injector') {
                        sourceTerm = well.rate * this.B_w; 
                    } else {
                        // Fractional flow for producers
                        const Sw_curr = this.saturation[k];
                        const Mw = this.krw(Sw_curr) / this.mu_w;
                        const Mo = this.kro(Sw_curr) / this.mu_o;
                        const fw = Mw / (Mw + Mo + 1e-10);
                        
                        sourceTerm = -well.rate * fw * this.B_w; 
                        
                        // Calculate oil production for reporting
                        const fo = 1 - fw;
                        const oilRate = well.rate * fo; 
                        this.cumulativeProd += oilRate * this.dt;
                    }
                }
                
                // Update saturation
                const dVol = (netFluxW + sourceTerm) * this.dt;
                
                // Safety check against zero porosity
                const safeVp = Math.max(Vp, 1e-10);
                const dSw = dVol / safeVp;
                
                if (Math.abs(dSw) > maxDeltaSw) maxDeltaSw = Math.abs(dSw);
                
                let nextSw = this.saturation[k] + dSw;
                nextSw = Math.max(0, Math.min(1.0, nextSw));
                newSaturation[k] = nextSw;
            }
        }

        this.pressure = newPressure;
        this.saturation = newSaturation;
        this.time += this.dt;
        
        // Adjust next time step based on stability
        if (maxDeltaSw > 0.05) {
            this.dt *= 0.5;
        } else if (maxDeltaSw < 0.01) {
            this.dt *= 1.2;
        }
        this.dt = Math.max(0.001, Math.min(this.dt, 10.0));

        return {
            pressure: this.pressure,
            saturation: this.saturation,
            time: this.time,
            recoveryFactor: (this.cumulativeProd / this.originalOilInPlace) * 100
        };
    }
}

window.SimulatorEngine = SimulatorEngine;