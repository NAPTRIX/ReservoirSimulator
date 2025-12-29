function DocumentationModal({ isOpen, onClose }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <div className="icon-book-open text-slate-400"></div>
                        Simulator Documentation
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <div className="icon-x"></div>
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto prose prose-sm prose-slate max-w-none">
                    <h3>Overview</h3>
                    <p>
                        This is a browser-based 2-Phase (Oil/Water) Black Oil reservoir simulator. It uses the IMPES (Implicit Pressure, Explicit Saturation) method 
                        to solve the diffusivity equation for fluid flow in porous media.
                    </p>

                    <h3>Governing Equations</h3>
                    <p>
                        The simulator solves the mass conservation equations for Oil and Water phases combined with Darcy's Law:
                    </p>
                    <div className="bg-slate-50 p-3 rounded border border-slate-200 font-mono text-xs my-2">
                        ∇·(λt ∇P) = ct φ / Δt (P_new - P_old)
                    </div>
                    
                    <h3>Key Features</h3>
                    <ul className="list-disc pl-5 space-y-1">
                        <li><strong>IMPES Formulation:</strong> Decouples pressure and saturation to solve sequentially.</li>
                        <li><strong>Gauss-Seidel Solver:</strong> Iteratively solves the pressure matrix system.</li>
                        <li><strong>Relative Permeability:</strong> Uses Corey type curves for oil and water relative permeability.</li>
                    </ul>

                    <h3>User Guide</h3>
                    <ul className="list-disc pl-5 space-y-1">
                        <li><strong>Visualizer:</strong> Shows real-time Pressure or Water Saturation distribution across the field.</li>
                        <li><strong>Well Placement:</strong> Use the sidebar tools to add Injectors (Blue) or Producers (Red). Injectors add water to sweep oil; Producers recover fluids.</li>
                        <li><strong>Controls:</strong> Play/Pause simulation, or step through manually. Adjust Grid and Rock properties in the sidebar or detailed PVT properties in Settings.</li>
                    </ul>

                    <h3>Limitations</h3>
                    <p className="text-xs text-slate-500">
                        This is a simplified educational tool running entirely in JavaScript. It assumes incompressible rock (mostly), constant formation volume factors (simplified in equation), 
                        and simplified boundary conditions (no flow). It is not intended for commercial field development planning.
                    </p>
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                    <button onClick={onClose} className="btn btn-secondary">Close</button>
                </div>
            </div>
        </div>
    );
}