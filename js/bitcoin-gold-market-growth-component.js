/*
    Created by @n8makes
    https://n8makes.com
*/

class BitcoinGoldMarketGrowthChart extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.chart = null;
        this.data = null;
    }

    async connectedCallback() {
        this.render();
        this.showLoading();
        try {
            await this.loadChartLibrary();
            this.setupEventListeners();
            await this.fetchData(10); // Default to 10 years
            await this.initChart();
        } catch (error) {
            console.error('Failed to initialize chart:', error);
            this.showError('Failed to load chart library. Please refresh the page.');
        }
    }

    async loadChartLibrary() {
        try {
            if (!window.Chart) {
                const chartScript = document.createElement('script');
                chartScript.src = 'https://cdn.jsdelivr.net/npm/chart.js';

                const loadPromise = new Promise((resolve, reject) => {
                    chartScript.onload = () => resolve();
                    chartScript.onerror = () => reject(new Error('Failed to load Chart.js'));
                });

                document.head.appendChild(chartScript);
                await loadPromise;
            }
            this.Chart = window.Chart;
            console.log('Chart.js loaded successfully');
        } catch (error) {
            console.error('Error loading Chart.js:', error);
            throw error;
        }
    }

    setupEventListeners() {
        const periodSelector = this.shadowRoot.querySelector('.period-selector');
        periodSelector.addEventListener('click', async (e) => {
            if (e.target.tagName === 'BUTTON') {
                this.shadowRoot.querySelectorAll('.period-selector button').forEach(btn => {
                    btn.classList.remove('active');
                });
                e.target.classList.add('active');
                const period = parseInt(e.target.dataset.period);
                await this.fetchData(period);
                this.updateChart();
            }
        });
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: 100%;
                    max-width: 1000px;
                    margin: 0 auto;
                    font-family: system-ui, -apple-system, sans-serif;
                }
                :host h2 {
                    font-size: 1rem;
                    text-align: center;
                }
                .chart-container {
                    width: 96%;
                    height: 500px;
                    background: #ffffff;
                    border-radius: 8px;
                    padding: 2%;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                    position: relative;
                }
                .loading {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    color: #666;
                }
                .error {
                    color: #dc3545;
                    padding: 1rem;
                    text-align: center;
                }
                .period-selector {
                    display: flex;
                    gap: 8px;
                    margin-bottom: 16px;
                    justify-content: flex-end;
                }
                .period-selector button {
                    padding: 8px 16px;
                    border: 1px solid #f68720;
                    background: #f68720;
                    color: #fff;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 14px;
                }
                .period-selector button.active {
                    background: #fff;
                    border-color: #f68720;
                    color: #333;
                    cursor: default;
                }
                .period-selector button:hover {
                    border-color: #999;
                    color: #333;
                }
                @media (prefers-color-scheme: dark) {
                    .chart-container {
                        background: #1a1a1a;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
                    }
                    .period-selector button {
                        background: #2d2d2d;
                        border-color: #404040;
                        color: #ccc;
                    }
                    .period-selector button.active {
                        background: #404040;
                        border-color: #666;
                        color: #fff;
                    }
                    .period-selector button:hover {
                        border-color: #666;
                        color: #fff;
                    }
                }
            </style>
            <div class="period-selector">
                <button data-period="1">1Y</button>
                <button data-period="5">5Y</button>
                <button data-period="10" class="active">10Y</button>
            </div>
            <div class="chart-container">
                <canvas></canvas>
            </div>
        `;
    }

    showLoading() {
        const container = this.shadowRoot.querySelector('.chart-container');
        const loading = document.createElement('div');
        loading.className = 'loading';
        loading.textContent = 'Loading chart...';
        container.appendChild(loading);
    }

    async fetchData(years) {
        try {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setFullYear(endDate.getFullYear() - years);
            const dates = this.generateDates(startDate, endDate);

            this.data = {
                labels: dates,
                datasets: [
                    {
                        label: 'Bitcoin',
                        data: this.generateGrowthData(dates.length, 40, 0.80),
                        borderColor: '#f7931a',
                        backgroundColor: 'rgba(247, 147, 26, 0.1)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'S&P 500',
                        data: this.generateGrowthData(dates.length, 10, 0.20),
                        borderColor: '#2ecc71',
                        backgroundColor: 'rgba(46, 204, 113, 0.1)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Gold',
                        data: this.generateGrowthData(dates.length, 7, 0.15),
                        borderColor: '#f1c40f',
                        backgroundColor: 'rgba(241, 196, 15, 0.1)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true
                    }
                ]
            };
        } catch (error) {
            this.showError('Error fetching asset data');
            console.error('Error:', error);
        }
    }

    generateDates(start, end) {
        const dates = [];
        const current = new Date(start);
        while (current <= end) {
            dates.push(current.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
            current.setMonth(current.getMonth() + 1);
        }
        return dates;
    }

    generateGrowthData(length, baseGrowth, volatility) {
        const data = [];
        let value = 100;
        let trend = 0;

        for (let i = 0; i < length; i++) {
            if (i % 6 === 0) {
                trend = (Math.random() - 0.5) * 2;
            }

            const monthlyBaseGrowth = (Math.pow(1 + baseGrowth / 100, 1 / 12) - 1);
            const cyclicalComponent = trend * (volatility / 24);
            const randomVolatility = (Math.random() - 0.5) * (volatility / 12);
            const monthlyGrowth = monthlyBaseGrowth + cyclicalComponent + (randomVolatility / 100);

            value *= (1 + monthlyGrowth);

            if (Math.random() < 0.02) {
                const shock = (Math.random() - 0.6) * (volatility / 4);
                value *= (1 + shock);
            }

            const percentageGrowth = Math.round(((value - 100) / 100) * 100 * 100) / 100;
            data.push(percentageGrowth);
        }
        return data;
    }

    async initChart() {
        const container = this.shadowRoot.querySelector('.chart-container');
        const loading = container.querySelector('.loading');
        if (loading) {
            loading.remove();
        }

        const canvas = this.shadowRoot.querySelector('canvas');
        const ctx = canvas.getContext('2d');

        if (this.chart) {
            this.chart.destroy();
        }

        this.chart = new this.Chart(ctx, {
            type: 'line',
            data: this.data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    title: {
                        display: true,
                        text: '10-Year Growth Comparison (%)',
                        font: {
                            size: 16,
                            weight: 'normal'
                        }
                    },
                    tooltip: {
                        enabled: true,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleFont: {
                            size: 13
                        },
                        bodyFont: {
                            size: 12
                        },
                        padding: 10,
                        displayColors: true,
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + context.parsed.y.toFixed(1) + '%';
                            }
                        }
                    },
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            boxWidth: 12,
                            padding: 15,
                            font: {
                                size: 12
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: true,
                            drawBorder: false,
                            drawTicks: true
                        },
                        ticks: {
                            maxTicksLimit: 12,
                            font: {
                                size: 11
                            }
                        }
                    },
                    y: {
                        grid: {
                            display: true,
                            drawBorder: false,
                            drawTicks: true
                        },
                        ticks: {
                            font: {
                                size: 11
                            },
                            callback: function(value) {
                                return value.toFixed(0) + '%';
                            }
                        }
                    }
                }
            }
        });
    }

    updateChart() {
        if (this.chart) {
            this.chart.data = this.data;
            this.chart.options.plugins.title.text = `${this.data.datasets[0].data.length < 24 ? '1' : this.data.datasets[0].data.length < 72 ? '5' : '10'}-Year Growth Comparison (%)`;
            this.chart.update();
        }
    }

    showError(message) {
        const container = this.shadowRoot.querySelector('.chart-container');
        container.innerHTML = `
            <div class="error">${message}</div>
        `;
    }

    disconnectedCallback() {
        if (this.chart) {
            this.chart.destroy();
        }
    }
}

customElements.define('bitcoin-gold-market-growth-chart', BitcoinGoldMarketGrowthChart);
