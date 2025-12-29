function Header({ onReset, onOpenSettings, onOpenDocs, onToggleMobileMenu }) {
    return (
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 z-30 shadow-sm relative shrink-0">
            <div className="flex items-center gap-3">
                <button 
                    onClick={onToggleMobileMenu}
                    className="md:hidden p-1.5 -ml-1.5 text-slate-500 hover:bg-slate-100 rounded-md transition-colors"
                >
                    <div className="icon-menu"></div>
                </button>
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-1.5 rounded-lg shadow-sm hidden xs:block">
                    <div className="icon-activity text-white text-lg"></div>
                </div>
                <div>
                    <h1 className="text-base font-bold text-slate-900 tracking-tight leading-none">ResSim <span className="text-blue-600">Advanced</span></h1>
                    <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider hidden sm:block">Reservoir Engineering Suite</p>
                </div>
            </div>
            
            <div className="flex items-center gap-2 md:gap-3">
                <div className="hidden md:flex items-center gap-4 mr-4">
                    <button 
                        onClick={onOpenDocs}
                        className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 cursor-pointer transition-colors focus:outline-none"
                    >
                        <div className="icon-file-text text-sm"></div>
                        Documentation
                    </button>
                    <button 
                        onClick={onOpenSettings}
                        className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 cursor-pointer transition-colors focus:outline-none"
                    >
                        <div className="icon-settings text-sm"></div>
                        Settings
                    </button>
                </div>
                
                <div className="h-6 w-px bg-slate-200 mx-2"></div>
                
                 <button 
                    className="btn btn-secondary py-1.5 h-8 text-xs gap-1.5" 
                    onClick={onReset}
                >
                    <div className="icon-rotate-ccw text-xs"></div>
                    Reset Simulation
                </button>
            </div>
        </header>
    );
}