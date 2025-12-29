function SettingsModal({ isOpen, onClose, config, onConfigChange }) {
    if (!isOpen) return null;

    const [localConfig, setLocalConfig] = React.useState(config);

    // Sync when opened
    React.useEffect(() => {
        setLocalConfig(config);
    }, [isOpen, config]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setLocalConfig({
            ...localConfig,
            [name]: parseFloat(value)
        });
    };

    const handleSave = () => {
        onConfigChange(localConfig);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <div className="icon-settings text-slate-400"></div>
                        Advanced Settings
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <div className="icon-x"></div>
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto">
                    <div className="mb-6">
                        <h3 className="text-sm font-bold text-slate-900 mb-3 border-l-2 border-blue-500 pl-2">Fluid Properties (PVT)</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="input-group">
                                <label className="input-label">Oil Viscosity (cp)</label>
                                <input type="number" name="mu_o" value={localConfig.mu_o || 2.0} onChange={handleChange} className="input-field font-mono" step="0.1" />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Water Viscosity (cp)</label>
                                <input type="number" name="mu_w" value={localConfig.mu_w || 1.0} onChange={handleChange} className="input-field font-mono" step="0.1" />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Oil FVF (RB/STB)</label>
                                <input type="number" name="B_o" value={localConfig.B_o || 1.2} onChange={handleChange} className="input-field font-mono" step="0.01" />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Water FVF (RB/STB)</label>
                                <input type="number" name="B_w" value={localConfig.B_w || 1.0} onChange={handleChange} className="input-field font-mono" step="0.01" />
                            </div>
                            <div className="input-group col-span-2">
                                <label className="input-label">Total Compressibility (1/psi)</label>
                                <input type="number" name="ct" value={localConfig.ct || 1e-5} onChange={handleChange} className="input-field font-mono" step="0.000001" />
                            </div>
                        </div>
                    </div>

                    <div className="mb-6">
                        <h3 className="text-sm font-bold text-slate-900 mb-3 border-l-2 border-green-500 pl-2">Numerical Control</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="input-group">
                                <label className="input-label">Time Step (days)</label>
                                <input type="number" name="dt" value={localConfig.dt || 1.0} onChange={handleChange} className="input-field font-mono" step="0.1" />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Grid Depth (ft)</label>
                                <input type="number" name="dz" value={localConfig.dz || 50} onChange={handleChange} className="input-field font-mono" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
                    <button onClick={onClose} className="btn btn-ghost">Cancel</button>
                    <button onClick={handleSave} className="btn btn-primary">Apply Changes</button>
                </div>
            </div>
        </div>
    );
}