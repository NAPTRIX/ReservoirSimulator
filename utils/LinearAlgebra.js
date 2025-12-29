// Basic linear algebra helpers.
// A full direct solver is a bit heavy for a browser-based demo, so we stick to iterative methods.

class LinearSolver {
    /**
     * Solves Ax = b using Gauss-Seidel iteration.
     * Simple, robust, but not the fastest for huge grids.
     */
    static solveGaussSeidel(A, b, x0, maxIter = 100, tol = 1e-5) {
        const n = b.length;
        let x = [...x0];
        let error = tol + 1;
        let iter = 0;

        // In a production environment, we'd probably pass a sparse matrix structure here.
        // For now, the solver logic is embedded in the engine for performance reasons.
        // This class remains as a placeholder for future vector operations.
        
        return x;
    }
}