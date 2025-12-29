function Sidebar({ 
    config, onConfigChange, 
    onPlay, onPause, isPlaying, onStep, simTime,
    interactionMode, setInteractionMode, onRemoveWell, onWellRateChange,
    isOpenMobile, onCloseMobile
}) {
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        // Only parse as float if it's not the geology model selector
        const val = name === 'geoModel' ? value : parseFloat(value);
        
        onConfigChange({
            ...config,
            [name]: val
        });
    };

    const handleClearWells = () => {
        if (confirm('Are you sure you want to remove all wells?')) {
            onConfigChange({
                ...config,
                wells: []
            });
        }
    };

    // Calculate totals
    const totalInjection = config.wells
        .filter(w => w.type === 'injector')
        .reduce((sum, w) => sum + (parseFloat(w.rate) || 0), 0);
        
    const totalProduction = config.wells
        .filter(w => w.type === 'producer')
        .reduce((sum, w) => sum + (parseFloat(w.rate) || 0), 0);

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpenMobile && (
                <div 
                    className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm"
                    onClick={onCloseMobile}
                ></div>
            )}

            {/* Sidebar Container */}
            <aside className={`
                fixed inset-y-0 left-0 w-80 bg-white border-r border-slate-200 flex flex-col z-50 shadow-2xl transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:shadow-lg md:z-20
                ${isOpenMobile ? 'translate-x-0' : '-translate-x-full'}
            `}>
                {/* Control Panel Header */}
                <div className="p-5 border-b border-slate-200 bg-slate-50 relative">
                    <button 
                        onClick={onCloseMobile}
                        className="absolute top-2 right-2 p-1.5 text-slate-400 hover:bg-slate-200 rounded-md md:hidden"
                    >
                        <div className="icon-x text-sm"></div>
                    </button>

                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-slate-800 flex items-center gap-2">
                            <div className="icon-sliders-horizontal text-blue-600"></div>
                            Controls
                        </h2>
                        <div className="text-xs font-mono bg-white border border-slate-200 px-2.5 py-1 rounded shadow-sm text-slate-600">
                            Day: <span className="font-bold text-slate-900">{simTime.toFixed(1)}</span>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={isPlaying ? onPause : onPlay}
                            className={`btn ${isPlaying ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-md' : 'btn-primary'}`}
                        >
                            {isPlaying ? (
                                <><div className="icon-pause fill-current"></div> Pause</>
                            ) : (
                                <><div className="icon-play fill-current"></div> Run</>
                            )}
                        </button>
                        <button onClick={onStep} className="btn btn-secondary" disabled={isPlaying}>
                            <div className="icon-step-forward"></div> Step
                        </button>
                    </div>
                </div>

                {/* Scrollable Settings */}
                <div className="flex-1 overflow-y-auto p-5 space-y-8">
                    
                    {/* Well Placement */}
                    <section>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            Well Placement Tool
                        </h3>
                        <div className="grid grid-cols-3 gap-2 mb-2">
                            <button 
                                onClick={() => setInteractionMode('view')}
                                className={`flex flex-col items-center justify-center p-2 rounded border transition-all ${interactionMode === 'view' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                            >
                                <div className="icon-mouse-pointer-2 mb-1"></div>
                                <span className="text-[10px] font-medium">Select</span>
                            </button>
                            <button 
                                onClick={() => setInteractionMode('add_injector')}
                                className={`flex flex-col items-center justify-center p-2 rounded border transition-all ${interactionMode === 'add_injector' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                            >
                                <div className="icon-circle-arrow-down mb-1"></div>
                                <span className="text-[10px] font-medium">Injector</span>
                            </button>
                            <button 
                                onClick={() => setInteractionMode('add_producer')}
                                className={`flex flex-col items-center justify-center p-2 rounded border transition-all ${interactionMode === 'add_producer' ? 'bg-red-600 text-white border-red-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                            >
                                <div className="icon-circle-arrow-up mb-1"></div>
                                <span className="text-[10px] font-medium">Producer</span>
                            </button>
                        </div>
                    </section>

                    <div className="h-px bg-slate-100"></div>

                    {/* Reservoir Properties with Sliders */}
                    <section>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                            Reservoir Properties
                        </h3>
                        <div className="mb-4">
                            <div className="flex justify-between items-center mb-1.5">
                                <label className="input-label mb-0">Permeability (mD)</label>
                            </div>
                            <div className="flex items-center gap-3">
                                <input 
                                    type="range" name="permeability" min="1" max="1000" step="1" 
                                    value={config.permeability} onChange={handleChange} 
                                    className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" 
                                />
                                <input 
                                    type="number" name="permeability" min="0.1" value={config.permeability} onChange={handleChange} 
                                    className="w-20 input-field py-1 text-right font-mono text-xs"
                                />
                            </div>
                        </div>
                        <div className="mb-4">
                             <div className="flex justify-between items-center mb-1.5">
                                <label className="input-label mb-0">Porosity</label>
                            </div>
                            <div className="flex items-center gap-3">
                                <input 
                                    type="range" name="porosity" min="0.01" max="0.40" step="0.01" 
                                    value={config.porosity} onChange={handleChange} 
                                    className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" 
                                />
                                 <input 
                                    type="number" name="porosity" min="0.01" value={config.porosity} onChange={handleChange} 
                                    className="w-20 input-field py-1 text-right font-mono text-xs" step="0.01"
                                />
                            </div>
                        </div>
                        <div className="input-group">
                            <label className="input-label">Initial Pressure (psi)</label>
                            <input type="number" name="initialPressure" value={config.initialPressure} onChange={handleChange} className="input-field font-mono" />
                        </div>
                        
                        <div className="mt-4">
                            <label className="input-label">Geology Model</label>
                            <select 
                                name="geoModel" 
                                value={config.geoModel || 'homogeneous'} 
                                onChange={handleChange}
                                className="input-field"
                            >
                                <option value="homogeneous">Homogeneous</option>
                                <option value="layered">Layered (High Perm Streaks)</option>
                                <option value="channel">Channel Sand</option>
                                <option value="random">Random (Log-Normal)</option>
                            </select>
                            <p className="text-[10px] text-slate-400 mt-1">Changes require simulation reset.</p>
                        </div>
                    </section>
                    
                    <div className="h-px bg-slate-100"></div>

                    {/* Grid Parameters */}
                    <section>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            Grid Parameters
                        </h3>
                        <div className="input-group">
                            <label className="input-label">Grid Dimensions (Nx, Ny)</label>
                            <div className="grid grid-cols-2 gap-2">
                                <input type="number" name="nx" value={config.nx} onChange={handleChange} className="input-field font-mono" />
                                <input type="number" name="ny" value={config.ny} onChange={handleChange} className="input-field font-mono" />
                            </div>
                        </div>
                        <div className="input-group">
                            <label className="input-label">Cell Size (ft)</label>
                            <div className="grid grid-cols-3 gap-2">
                                <input type="number" name="dx" value={config.dx} onChange={handleChange} className="input-field font-mono" placeholder="dx" />
                                <input type="number" name="dy" value={config.dy} onChange={handleChange} className="input-field font-mono" placeholder="dy" />
                                <input type="number" name="dz" value={config.dz} onChange={handleChange} className="input-field font-mono" placeholder="dz" />
                            </div>
                        </div>
                    </section>
                    
                    {/* Active Wells List */}
                    <section>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                                <span>Active Wells</span>
                                <span className="ml-2 text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{config.wells.length}</span>
                            </h3>
                            {config.wells.length > 0 && (
                                <button onClick={handleClearWells} className="text-[10px] text-red-500 hover:text-red-700 hover:underline">
                                    Clear All
                                </button>
                            )}
                        </div>
                        
                        {/* Rate Summary */}
                        {(totalInjection > 0 || totalProduction > 0) && (
                            <div className="mb-3 grid grid-cols-2 gap-2 text-[10px] bg-slate-50 p-2 rounded border border-slate-100">
                                <div>
                                    <span className="block text-slate-400 uppercase tracking-wider font-bold text-[9px]">Total Inj.</span>
                                    <span className="font-mono text-blue-600 font-bold">{totalInjection.toFixed(0)} <span className="text-[9px] font-normal text-slate-400">STB/d</span></span>
                                </div>
                                <div>
                                    <span className="block text-slate-400 uppercase tracking-wider font-bold text-[9px]">Total Prod.</span>
                                    <span className="font-mono text-red-600 font-bold">{totalProduction.toFixed(0)} <span className="text-[9px] font-normal text-slate-400">STB/d</span></span>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            {config.wells.map((well, idx) => (
                                <div key={idx} className="group flex items-center justify-between bg-white p-2.5 rounded border border-slate-200 shadow-sm hover:border-blue-300 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${well.type === 'injector' ? 'bg-blue-500' : 'bg-red-500'}`}>
                                            {well.type === 'injector' ? 'I' : 'P'}
                                        </div>
                                        <div>
                                            <div className="text-xs font-semibold text-slate-700">
                                                {well.type === 'injector' ? 'Injector' : 'Producer'}
                                            </div>
                                            <div className="text-[10px] text-slate-400 font-mono">
                                                Loc: ({well.i}, {well.j})
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            value={well.rate}
                                            onChange={(e) => onWellRateChange(idx, e.target.value)}
                                            className="w-16 px-1.5 py-1 text-xs border border-slate-200 rounded text-right focus:outline-none focus:border-blue-500 font-mono"
                                            step="10"
                                        />
                                        <span className="text-[10px] text-slate-400">STB/d</span>
                                        <button 
                                            onClick={() => onRemoveWell(idx)}
                                            className="text-slate-300 hover:text-red-500 p-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Remove Well"
                                        >
                                            <div className="icon-trash-2 text-xs"></div>
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {config.wells.length === 0 && (
                                <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-lg">
                                    <p className="text-xs text-slate-400">No active wells.</p>
                                    <p className="text-[10px] text-slate-300">Use tool above to place wells.</p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </aside>
        </>
    );
}