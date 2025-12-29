function ProductionCharts({ history }) {
    const chartRef = React.useRef(null);
    const chartInstance = React.useRef(null);

    React.useEffect(() => {
        if (!chartRef.current) return;

        const ctx = chartRef.current.getContext('2d');
        const ChartJS = window.Chart;

        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        // Prepare Data
        const times = history.map(h => h.time.toFixed(1));
        const avgPressure = history.map(h => {
            const sum = h.pressure.reduce((a, b) => a + b, 0);
            return sum / h.pressure.length;
        });
        
        // Simplified: Assuming we are tracking field average water saturation
        const avgSw = history.map(h => {
             const sum = h.saturation.reduce((a, b) => a + b, 0);
            return sum / h.saturation.length;
        });

        chartInstance.current = new ChartJS(ctx, {
            type: 'line',
            data: {
                labels: times,
                datasets: [
                    {
                        label: 'Avg Field Pressure (psi)',
                        data: avgPressure,
                        borderColor: '#2563eb', // Blue
                        backgroundColor: 'rgba(37, 99, 235, 0.1)',
                        yAxisID: 'y',
                        tension: 0.4
                    },
                    {
                        label: 'Avg Water Saturation',
                        data: avgSw,
                        borderColor: '#16a34a', // Green
                        backgroundColor: 'rgba(22, 163, 74, 0.1)',
                        yAxisID: 'y1',
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        enabled: true
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Time (days)'
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Pressure (psi)'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Saturation (frac)'
                        },
                        grid: {
                            drawOnChartArea: false, // only want the grid lines for one axis to show up
                        },
                    },
                }
            }
        });

        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [history]);

    return (
        <div className="w-full h-full p-4">
            <canvas ref={chartRef}></canvas>
        </div>
    );
}