// Important: DO NOT remove this `ErrorBoundary` component.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Simulation Error</h1>
            <p className="text-gray-600 mb-4">The simulator encountered an unexpected state.</p>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-primary"
            >
              Reload System
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
    // App Setup
    const [config, setConfig] = React.useState({
        nx: 20,
        ny: 20,
        dx: 100,
        dy: 100,
        dz: 50,
        permeability: 100,
        porosity: 0.2,
        initialPressure: 3000,
        initialSw: 0.2,
        // Fluid PVT default values
        mu_o: 2.0,
        mu_w: 1.0,
        ct: 1e-5,
        B_o: 1.2,
        B_w: 1.0,
        geoModel: 'homogeneous',
        wells: [
            { i: 4, j: 4, type: 'injector', rate: 500 },
            { i: 15, j: 15, type: 'producer', rate: 500 }
        ],
        dt: 0.1 // Conservative start
    });

    // Runtime state
    const [simData, setSimData] = React.useState(null);
    const [recoveryFactor, setRecoveryFactor] = React.useState(0);
    const [history, setHistory] = React.useState([]);
    const [viewType, setViewType] = React.useState('pressure'); // 'pressure' or 'saturation'
    const [isPlaying, setIsPlaying] = React.useState(false);
    
    // Interactions
    const [interactionMode, setInteractionMode] = React.useState('view'); 
    const [selectedWell, setSelectedWell] = React.useState(null);
    
    // UI toggles
    const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
    const [isDocsOpen, setIsDocsOpen] = React.useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    // Engine instance
    const engineRef = React.useRef(null);
    const timerRef = React.useRef(null);

    // Boot up the engine on mount
    React.useEffect(() => {
        if (!engineRef.current) {
            initEngine(config);
        }
    }, []);

    const initEngine = (cfg) => {
        engineRef.current = new window.SimulatorEngine(cfg);
        updateSimState();
        setHistory([getSnapshot()]);
    };

    const updateSimState = () => {
        if(!engineRef.current) return;
        setSimData(getSnapshot());
    };

    const getSnapshot = () => {
        if(!engineRef.current) return null;
        return {
            pressure: [...engineRef.current.pressure],
            saturation: [...engineRef.current.saturation],
            time: engineRef.current.time,
            recoveryFactor: (engineRef.current.cumulativeProd / engineRef.current.originalOilInPlace) * 100 || 0
        };
    };

    // Handle configuration updates
    const handleConfigChange = (newConfig) => {
        setConfig(newConfig);
        // If critical grid params change, we need a hard reset
        if (newConfig.nx !== config.nx || newConfig.ny !== config.ny || newConfig.geoModel !== config.geoModel) {
             handleReset(newConfig);
        } else {
             // Hot-update parameters that don't require grid rebuild
             if(engineRef.current) {
                 // Rock & Well Props
                 engineRef.current.permeability = newConfig.permeability;
                 engineRef.current.porosity = newConfig.porosity;
                 engineRef.current.wells = newConfig.wells;
                 
                 // Fluid Props
                 engineRef.current.mu_o = newConfig.mu_o;
                 engineRef.current.mu_w = newConfig.mu_w;
                 engineRef.current.ct = newConfig.ct;
                 engineRef.current.B_o = newConfig.B_o;
                 engineRef.current.B_w = newConfig.B_w;
                 engineRef.current.dt = newConfig.dt;
             }
        }
    };

    const handleReset = (cfg = config) => {
        setIsPlaying(false);
        if(timerRef.current) clearInterval(timerRef.current);
        
        // Clear history
        setSimData(null);
        setHistory([]);
        
        // Small timeout to let UI clear before re-initializing
        setTimeout(() => {
            initEngine(cfg);
        }, 50);
    };

    const runStep = () => {
        if(engineRef.current) {
            const res = engineRef.current.step(); 
            const snapshot = getSnapshot();
            setSimData(snapshot);
            setRecoveryFactor(res.recoveryFactor);
            setHistory(prev => {
                const newHist = [...prev, snapshot];
                // Keep history manageable
                if (newHist.length > 500) newHist.shift(); 
                return newHist;
            });
        }
    };

    const togglePlay = () => {
        if (isPlaying) {
            setIsPlaying(false);
            if(timerRef.current) clearInterval(timerRef.current);
        } else {
            setIsPlaying(true);
            timerRef.current = setInterval(() => {
                runStep();
            }, 100); 
        }
    };

    // --- Interaction Logic ---
    const handleGridClick = (i, j) => {
        const existingWellIndex = config.wells.findIndex(w => w.i === i && w.j === j);

        if (interactionMode === 'add_injector' || interactionMode === 'add_producer') {
            const newWell = {
                i, j,
                type: interactionMode === 'add_injector' ? 'injector' : 'producer',
                rate: 500 
            };

            let newWells = [...config.wells];
            if (existingWellIndex >= 0) {
                // Update existing well
                newWells[existingWellIndex] = newWell;
            } else {
                // Create new well
                newWells.push(newWell);
            }

            const newConfig = { ...config, wells: newWells };
            setConfig(newConfig);
            
            // Sync with engine
            if(engineRef.current) engineRef.current.wells = newWells;
        } else if (interactionMode === 'view') {
            if (existingWellIndex >= 0) {
                setSelectedWell(config.wells[existingWellIndex]);
            } else {
                setSelectedWell(null);
            }
        }
    };

    const handleRemoveWell = (idx) => {
        const newWells = config.wells.filter((_, i) => i !== idx);
        const newConfig = { ...config, wells: newWells };
        setConfig(newConfig);
        if(engineRef.current) engineRef.current.wells = newWells;
        setSelectedWell(null);
    };

    const handleWellRateChange = (idx, newRate) => {
        const newWells = [...config.wells];
        newWells[idx] = { ...newWells[idx], rate: parseFloat(newRate) };
        const newConfig = { ...config, wells: newWells };
        setConfig(newConfig);
        if(engineRef.current) engineRef.current.wells = newWells;
    };

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-slate-50 font-sans" data-name="app">
            <Header 
                onReset={() => handleReset(config)} 
                onOpenSettings={() => setIsSettingsOpen(true)}
                onOpenDocs={() => setIsDocsOpen(true)}
                onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
            
            <div className="flex flex-1 overflow-hidden relative">
                <Sidebar 
                    config={config} 
                    onConfigChange={handleConfigChange}
                    onPlay={togglePlay}
                    onPause={togglePlay}
                    isPlaying={isPlaying}
                    onStep={runStep}
                    simTime={simData ? simData.time : 0}
                    interactionMode={interactionMode}
                    setInteractionMode={setInteractionMode}
                    onRemoveWell={handleRemoveWell}
                    onWellRateChange={handleWellRateChange}
                    isOpenMobile={isMobileMenuOpen}
                    onCloseMobile={() => setIsMobileMenuOpen(false)}
                />
                
                <main className="flex-1 flex flex-col min-w-0 p-2 overflow-hidden overflow-y-auto md:overflow-y-hidden">
                    <div className="flex-1 flex flex-col gap-2 min-h-0">
                        
                        {/* Top: Visualizer */}
                        <div className="min-h-[350px] flex-none md:flex-[3] card overflow-hidden flex flex-col bg-white">
                            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-white z-10">
                                <div className="flex items-center gap-4">
                                    <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                        <div className="icon-map text-slate-400"></div>
                                        Field Visualization
                                    </h2>
                                    {simData && (
                                        <div className="flex items-center gap-3 text-xs">
                                            <div className="px-2 py-0.5 bg-green-50 text-green-700 rounded border border-green-200 font-mono">
                                                RF: <span className="font-bold">{recoveryFactor.toFixed(2)}%</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                                    <button 
                                        className={`px-3 py-1.5 text-xs rounded-md font-medium transition-all ${viewType === 'pressure' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
                                        onClick={() => setViewType('pressure')}
                                    >
                                        Pressure
                                    </button>
                                    <button 
                                        className={`px-3 py-1.5 text-xs rounded-md font-medium transition-all ${viewType === 'saturation' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
                                        onClick={() => setViewType('saturation')}
                                    >
                                        Saturation
                                    </button>
                                </div>
                            </div>
                            
                            <div className="flex-1 relative bg-slate-50 flex items-center justify-center p-4 overflow-hidden">
                                {simData ? (
                                    <GridVisualizer 
                                        nx={config.nx} 
                                        ny={config.ny} 
                                        data={viewType === 'pressure' ? simData.pressure : simData.saturation} 
                                        type={viewType}
                                        wells={config.wells}
                                        interactionMode={interactionMode}
                                        onGridClick={handleGridClick}
                                    />
                                ) : (
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <div className="icon-loader animate-spin"></div>
                                        <span>Initializing Engine...</span>
                                    </div>
                                )}
                                
                                {/* Overlay Helper */}
                                <div className="absolute top-4 left-4 pointer-events-none">
                                    <div className="bg-white/80 backdrop-blur-sm border border-slate-200 shadow-sm rounded px-3 py-1.5 text-xs font-mono text-slate-600 flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${interactionMode === 'view' ? 'bg-slate-400' : interactionMode === 'add_injector' ? 'bg-blue-500' : 'bg-red-500'}`}></div>
                                        Mode: {interactionMode === 'view' ? 'View / Inspect' : interactionMode === 'add_injector' ? 'Place Injector' : 'Place Producer'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom: Charts */}
                        <div className="min-h-[300px] flex-none md:flex-[2] card overflow-hidden flex flex-col bg-white">
                            <div className="px-4 py-3 border-b border-slate-100">
                                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                    <div className="icon-chart-line text-slate-400"></div>
                                    Production History
                                </h2>
                            </div>
                            <div className="flex-1 w-full p-4 relative">
                                {history.length > 0 && <ProductionCharts history={history} />}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
            
            {/* Modals */}
            <SettingsModal 
                isOpen={isSettingsOpen} 
                onClose={() => setIsSettingsOpen(false)}
                config={config}
                onConfigChange={handleConfigChange}
            />
            <DocumentationModal 
                isOpen={isDocsOpen} 
                onClose={() => setIsDocsOpen(false)}
            />
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);