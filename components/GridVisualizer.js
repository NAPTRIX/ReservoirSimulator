function GridVisualizer({ nx, ny, data, type = 'pressure', wells = [], interactionMode, onGridClick }) {
    const canvasRef = React.useRef(null);
    const containerRef = React.useRef(null);
    const [hoverInfo, setHoverInfo] = React.useState(null);
    
    // Draw Function
    const draw = React.useCallback(() => {
        const canvas = canvasRef.current;
        if(!canvas) return;
        const ctx = canvas.getContext('2d');
        const container = containerRef.current;
        
        if (!data || data.length === 0) return;

        // Resize
        const rect = container.getBoundingClientRect();
        // Handle high DPI
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;

        const cellW = rect.width / nx;
        const cellH = rect.height / ny;

        // Auto-Scale
        let minVal = Infinity;
        let maxVal = -Infinity;
        let hasValidData = false;

        for(let i=0; i<data.length; i++) {
            const v = data[i];
            if (isFinite(v)) {
                if(v < minVal) minVal = v;
                if(v > maxVal) maxVal = v;
                hasValidData = true;
            }
        }
        
        // Fallback if simulation blew up
        if (!hasValidData) {
            minVal = 0;
            maxVal = 1;
        } else if (Math.abs(maxVal - minVal) < 1e-6) {
            maxVal = minVal + 1;
        }

        // Colormaps
        const getTurboColor = (t) => {
            // "Turbo" style approximation for high contrast engineering
            // t is 0..1
            // Simple R-G-B Rainbow
            // 0.0 -> Blue (0,0,255)
            // 0.5 -> Green (0,255,0)
            // 1.0 -> Red (255,0,0)
            const r = Math.max(0, Math.min(255, 255 * (2 * t - 1))); // Red kicks in at 0.5
            const g = Math.max(0, Math.min(255, 255 * (1 - 2 * Math.abs(t - 0.5))));
            const b = Math.max(0, Math.min(255, 255 * (1 - 2 * t))); // Blue fades out by 0.5
            return `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
        };
        
        const getOceanColor = (t) => {
            // White (0) to Blue (1) for water sat
            // Or Oil (Red) to Water (Blue)
            // t = Sw. Sw=0 (Oil) -> Red, Sw=1 (Water) -> Blue
            // Let's use standard engineering:
            // Sw=0 (Oil) -> Green/Red ? Usually Red/Green is Oil/Water?
            // Let's stick to standard: Blue = Water, Red/Brown = Oil
            // t is normalized value, not necessarily Sw.
            // If type is saturation, data is Sw.
            // 0 (Oil) -> 1 (Water)
            
            // Let's use a Diverging Blue-Red
            // 0 -> Red
            // 1 -> Blue
            const r = Math.floor(255 * (1 - t));
            const g = Math.floor(20 + 100 * (1- Math.abs(t-0.5)*2)); 
            const b = Math.floor(255 * t);
            return `rgb(${r},${g},${b})`;
        };

        // Render Grid
        for (let j = 0; j < ny; j++) {
            for (let i = 0; i < nx; i++) {
                const idx = j * nx + i;
                let val = data[idx];
                
                // Safety clamp
                if (!isFinite(val)) val = minVal;
                
                const t = (val - minVal) / (maxVal - minVal);
                const safeT = Math.max(0, Math.min(1, t));
                
                ctx.fillStyle = type === 'pressure' ? getTurboColor(safeT) : getOceanColor(safeT);
                ctx.fillRect(i * cellW, j * cellH, cellW + 0.5, cellH + 0.5); // +0.5 to fix gap
            }
        }
        
        // Render Grid Lines (Subtle)
        if (nx < 50) {
            ctx.strokeStyle = 'rgba(0,0,0,0.1)';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            for(let i=0; i<=nx; i++) { ctx.moveTo(i*cellW, 0); ctx.lineTo(i*cellW, rect.height); }
            for(let j=0; j<=ny; j++) { ctx.moveTo(0, j*cellH); ctx.lineTo(rect.width, j*cellH); }
            ctx.stroke();
        }

        // Render Wells
        wells.forEach(well => {
            const cx = well.i * cellW + cellW / 2;
            const cy = well.j * cellH + cellH / 2;
            const radius = Math.min(cellW, cellH) * 0.4;
            
            // Shadow
            ctx.beginPath();
            ctx.arc(cx, cy, radius + 2, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fill();

            // Well Body
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
            ctx.fillStyle = well.type === 'injector' ? '#3b82f6' : '#ef4444'; // Blue-500 / Red-500
            ctx.fill();
            
            // Border
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();

            // Label
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(well.type === 'injector' ? 'I' : 'P', cx, cy);
        });
        
        // Highlight Hover
        if (hoverInfo) {
            const { i, j } = hoverInfo;
            ctx.strokeStyle = 'rgba(255,255,255, 0.8)';
            ctx.lineWidth = 2;
            ctx.strokeRect(i * cellW, j * cellH, cellW, cellH);
        }

    }, [nx, ny, data, type, wells, hoverInfo]);

    React.useEffect(() => {
        draw();
        window.addEventListener('resize', draw);
        return () => window.removeEventListener('resize', draw);
    }, [draw]);

    const handleMouseMove = (e) => {
        const canvas = canvasRef.current;
        if(!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const cellW = rect.width / nx;
        const cellH = rect.height / ny;
        
        const i = Math.floor(x / cellW);
        const j = Math.floor(y / cellH);
        
        if (i >= 0 && i < nx && j >= 0 && j < ny) {
            const idx = j * nx + i;
            const val = data ? data[idx] : 0;
            setHoverInfo({ i, j, val, x: e.clientX, y: e.clientY });
        } else {
            setHoverInfo(null);
        }
    };

    const handleMouseLeave = () => {
        setHoverInfo(null);
    };

    const handleClick = () => {
        if(hoverInfo && onGridClick) {
            onGridClick(hoverInfo.i, hoverInfo.j);
        }
    };

    return (
        <div ref={containerRef} className="w-full h-full relative rounded-lg overflow-hidden shadow-inner bg-slate-900 cursor-crosshair group">
            <canvas 
                ref={canvasRef} 
                onClick={handleClick}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                className="block w-full h-full"
            ></canvas>
            
            {/* Hover Tooltip */}
            {hoverInfo && (
                <div 
                    className="fixed z-50 pointer-events-none bg-slate-900/90 backdrop-blur text-white p-2 rounded shadow-xl border border-slate-700 text-xs font-mono"
                    style={{ 
                        left: hoverInfo.x + 15, 
                        top: hoverInfo.y + 15 
                    }}
                >
                    <div className="font-bold text-slate-300 mb-1 border-b border-slate-700 pb-1">
                        Cell ({hoverInfo.i}, {hoverInfo.j})
                    </div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                        <span className="text-slate-400">Value:</span>
                        <span className="text-right font-bold text-emerald-400">
                            {type === 'pressure' ? `${hoverInfo.val.toFixed(1)} psi` : `${(hoverInfo.val * 100).toFixed(1)} %`}
                        </span>
                    </div>
                </div>
            )}
            
            {/* Persistent Legend */}
            <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur border border-slate-200 p-2.5 rounded-lg shadow-lg pointer-events-none">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 text-center">{type === 'pressure' ? 'Pressure (psi)' : 'Water Saturation'}</div>
                <div className="h-3 w-32 rounded bg-gradient-to-r from-blue-600 via-green-500 to-red-600 mb-1.5"
                     style={{
                         background: type === 'pressure' 
                            ? 'linear-gradient(to right, rgb(0,0,255), rgb(0,255,0), rgb(255,0,0))' // Rainbow
                            : 'linear-gradient(to right, rgb(255,0,0), rgb(0,0,255))' // Red->Blue
                     }}
                ></div>
                <div className="flex justify-between text-[9px] text-slate-600 font-mono font-medium">
                    <span>{type === 'pressure' ? 'Low' : 'Oil (0%)'}</span>
                    <span>{type === 'pressure' ? 'High' : 'Water (100%)'}</span>
                </div>
            </div>
        </div>
    );
}