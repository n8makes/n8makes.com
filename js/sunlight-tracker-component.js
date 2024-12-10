class SunlightTrackerComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.render(); // Initial render with loading state
        this.loadLuxon().then(() => {
            console.log('Initializing with Luxon');
            this.DateTime = luxon.DateTime;
            this.loadSunData();
        }).catch(error => {
            console.error('Failed to initialize:', error);
        });
    }

    loadLuxon() {
        return new Promise((resolve, reject) => {
            if (window.luxon) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/luxon@3.4.4/build/global/luxon.min.js';
            script.onload = () => {
                console.log('Luxon library loaded successfully');
                resolve();
            };
            script.onerror = (error) => {
                console.error('Failed to load Luxon library:', error);
                reject(new Error('Failed to load Luxon library'));
            };
            document.head.appendChild(script);
        }).catch(error => {
            this.showError('Failed to load required libraries. Please try again later.');
            throw error;
        });
    }

    connectedCallback() {
        // Initialization is handled in constructor after Luxon loads
    }

    async loadSunData() {
        try {
            // Get user's location using IP geolocation API
            const position = await fetch("https://ipapi.co/json/").then((res) =>
                res.json(),
            );

            const { latitude, longitude } = position;

            // Get today's sun data
            const today = new Date().toISOString().split("T")[0];
            const tomorrow = new Date(Date.now() + 86400000)
                .toISOString()
                .split("T")[0];

            const [todayData, tomorrowData] = await Promise.all([
                fetch(
                    `https://api.sunrise-sunset.org/json?lat=${latitude}&lng=${longitude}&date=${today}&formatted=0`,
                ).then((res) => res.json()),
                fetch(
                    `https://api.sunrise-sunset.org/json?lat=${latitude}&lng=${longitude}&date=${tomorrow}&formatted=0`,
                ).then((res) => res.json()),
            ]);

            if (todayData.status === "OK" && tomorrowData.status === "OK") {
                this.updateTimes(todayData.results, tomorrowData.results);
            } else {
                throw new Error("Failed to fetch sun data");
            }
        } catch (error) {
            this.showError("Unable to load sun times. Please try again later.");
        }
    }

    updateTimes(todayResults, tomorrowResults) {
        const container = this.shadowRoot.querySelector(".sun-component");
        container.classList.remove("loading");

        const sunrise = this.DateTime.fromISO(todayResults.sunrise).toLocal();
        const sunset = this.DateTime.fromISO(todayResults.sunset).toLocal();
        const tomorrowSunrise = this.DateTime.fromISO(
            tomorrowResults.sunrise,
        ).toLocal();
        const tomorrowSunset = this.DateTime.fromISO(
            tomorrowResults.sunset,
        ).toLocal();

        // Calculate daylight durations
        const todayDuration = sunset.diff(sunrise);
        const tomorrowDuration = tomorrowSunset.diff(tomorrowSunrise);
        const durationDiff = tomorrowDuration
            .minus(todayDuration)
            .as("minutes");

        const hours = Math.floor(todayDuration.as("hours"));
        const minutes = Math.floor(todayDuration.as("minutes") % 60);

        const sunriseTime = this.shadowRoot.querySelector(".sunrise-time");
        const sunsetTime = this.shadowRoot.querySelector(".sunset-time");
        const durationEl = this.shadowRoot.querySelector(".duration-time");
        const trendEl = this.shadowRoot.querySelector(".trend-icon");

        sunriseTime.textContent = sunrise.toLocaleString(
            this.DateTime.TIME_SIMPLE,
        );
        sunsetTime.textContent = sunset.toLocaleString(
            this.DateTime.TIME_SIMPLE,
        );
        durationEl.textContent = `${hours}h ${minutes}m`;

        // Update trend icon and tooltip
        const trendIcon = durationDiff > 0 ? "↑" : durationDiff < 0 ? "↓" : "→";
        const trendClass =
            durationDiff > 0
                ? "increasing"
                : durationDiff < 0
                    ? "decreasing"
                    : "same";
        const diffMinutes = Math.abs(Math.round(durationDiff));
        const trendText =
            durationDiff === 0
                ? "Same daylight duration tomorrow"
                : `${Math.abs(Math.round(durationDiff))} minutes ${durationDiff > 0 ? "more" : "less"} daylight tomorrow`;

        trendEl.textContent = trendIcon;
        trendEl.className = `trend-icon ${trendClass}`;
        trendEl.title = trendText;
    }

    showError(message) {
        const container = this.shadowRoot.querySelector(".sun-component");
        container.classList.remove("loading");

        const error = document.createElement("div");
        error.className = "error-message";
        error.textContent = message;
        container.appendChild(error);
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    --sun-primary: #f68720;
                    --sun-secondary: #ffa500;
                    --text-light: #ffffff;
                    --bg-dark: #222222;
                    --bg-darker: #1a1a1a;
                    --error-color: #dc3545;

                    font-size: 62.5%;
                }

                .sun-component {
                    background: var(--bg-dark);
                    border-radius: 1rem;
                    padding: 1.5rem;
                    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
                    font-family: system-ui, -apple-system, sans-serif;
                    max-width: 400px;
                }

                .sun-component__header {
                    color: var(--sun-primary);
                    margin-bottom: 1.5rem;
                    display: flex;
                    align-items: center;
                    font-size: 1.4rem;
                    font-weight: 600;
                    margin: 0 0 10px 0;
                }

                .sun-component__trending {
                    color: var(--text-light);
                    font-size: 0.9rem;
                }

                .sun-component__times {
                    display: flex;
                    justify-items: space-between;
                }

                .sun-component__time {
                    color: var(--sun-primary);
                    font-size: 1.25rem;
                    margin: 0.5rem 0;
                    width: 50%;
                }

                .sun-component__icon {
                    width: 2.4rem;
                    height: 2.4rem;
                    margin-right: 0.75rem;
                    fill: none;
                    stroke: var(--sun-primary);
                }

                .sun-component__duration {
                    background: var(--bg-darker);
                    border-radius: 0.5rem;
                    padding: 0.8rem;
                    margin-top: 1.5rem;
                    color: var(--text-light);
                    font-size: 1.1rem;
                }

                .sun-component__duration strong {
                    color: var(--sun-primary);
                }

                .loading {
                    opacity: 0.6;
                    pointer-events: none;
                }

                .error-message {
                    color: var(--error-color);
                    padding: 1rem;
                    text-align: center;
                    border: 1px solid var(--error-color);
                    border-radius: 0.5rem;
                    margin-top: 1rem;
                }

                strong {
                    color: var(--text-light);
                }

                .trend-icon {
                    font-size: 1rem;
                    margin-left: 0.5rem;
                    cursor: help;
                }

                .trend-icon.increasing {
                    color: #4caf50;
                }

                .trend-icon.decreasing {
                    color: #f44336;
                }

                .trend-icon.same {
                    color: var(--sun-secondary);
                }
            </style>
            <div class="sun-component loading">
                <h2 class="sun-component__header">
                    <svg class="sun-component__icon" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="5" />
                        <line x1="12" y1="1" x2="12" y2="3" />
                        <line x1="12" y1="21" x2="12" y2="23" />
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                        <line x1="1" y1="12" x2="3" y2="12" />
                        <line x1="21" y1="12" x2="23" y2="12" />
                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                    </svg>
                    Today's Sun Times
                </h2>
                <div class="sun-component__times">
                    <div class="sun-component__time">
                        <strong>Sunrise:</strong> <span class="sunrise-time">--:--</span>
                    </div>
                    <div class="sun-component__time">
                        <strong>Sunset:</strong> <span class="sunset-time">--:--</span>
                    </div>
                </div>
                <p class="sun-component__trending">Daylight duration trending: <span class="trend-icon" title="Loading trend...">⋯</span></p>
                <div class="sun-component__duration">
                    You have <strong class="duration-time">--h --m</strong> to get some sun on your skin
                </div>
            </div>
        `;
    }
}

customElements.define("sunlight-tracker-component", SunlightTrackerComponent);
