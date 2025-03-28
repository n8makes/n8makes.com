/*
    Created by @n8makes
    https://n8makes.com
*/

class DollarToSatsWebComponent extends HTMLElement {
  constructor() {
    super();

    this.intervalId = null;
    this.loading = true;
    this.error = null;
    this.data = null;
  }

  connectedCallback() {
    const intervalUpdateSeconds = this.getAttribute('interval-update-seconds') || 60;

    this.render();
    this.fetchData();

    if (intervalUpdateSeconds > 9) {
      this.intervalId = setInterval(() => this.fetchData(), intervalUpdateSeconds * 1000);
    }
  }

  disconnectedCallback() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  async fetchData() {
    try {
      this.loading = true;
      this.error = null;
      this.render();

      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');

      if (!response.ok) {
        throw new Error('Failed to fetch Bitcoin price');
      }

      const coinGeckoData = await response.json();
      this.data = {
        time: {
          updated: new Date().toISOString()
        },
        bpi: {
          USD: {
            rate_float: coinGeckoData.bitcoin.usd
          }
        }
      };
      this.loading = false;
    } catch (err) {
      this.error = err.message;
      this.loading = false;
    } finally {
      this.render();
    }
  }

  formatDateTime(dateString) {
    const date = new Date(dateString);

    const dateFormatted = date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });

    return dateFormatted;
  }

  formatSatsPerDollar(rateFloat) {
    const satsPerDollar = Math.round(100000000 / rateFloat);

    return satsPerDollar.toLocaleString();
  }

  render() {

    const backgroudColor = this.getAttribute('background-color') || '#fff';
    const textColor = this.getAttribute('text-color') || '#333';
    const isFullWidth = this.getAttribute('full-width') || false;

    const style = `
      <style>
        .card {
          font-size: 62.5%;
          background-color: ${backgroudColor};
          color: ${textColor};
          width: ${isFullWidth === 'true' ? '100%' : 'auto'};
          display: ${isFullWidth === 'true' ? 'block' : 'inline-block'};
          padding: 20px 0;
        }

        .card h2 {
          font-size: 2rem;
          margin: 0;
          padding: 10px 20px;
          line-height: 1;
          font-weight: 600;
        }

        .card p {
          font-weight: 300;
          font-size: 1rem;
          line-height: 1;
          margin: 0;
          padding: 0 20px;
        }

        .card .btc-orange {
          color: #f68720;
        }
      </style>
    `;

    if (this.loading) {
      this.setAttribute('loading', '');
    } else {
      this.removeAttribute('loading');
    }

    let content = '';

    if (this.error) {
      content = `
                  <div class="card">
                      <p>&nbsp;</p>
                      <h2 class="error">
                          Error: ${this.error}
                      </h2>
                      <p>&nbsp;</p>
                  </div>
              `;
    } else if (this.data) {
      const { time, bpi } = this.data;

      content = `
                  <div class="card">
                      <p class="date-time">
                          ${this.formatDateTime(time.updated)}
                      </p>
                      <h2>
                          $1 gets you <span class="btc-orange">${this.formatSatsPerDollar(bpi.USD.rate_float)} SATS</span>
                      </h2>
                      <p class="btc-orange">1 Bitcoin (BTC) = 100,000,000 SATS</p>
                  </div>
              `;
    } else {
      content = `
                  <div class="card">
                      <p>&nbsp;</p>
                      <h2 class="loading-text">Loading Bitcoin prices...</h2>
                      <p>&nbsp;</p>
                  </div>
              `;
    }

    this.innerHTML = `${style} ${content}`;
  }
}

/* 
  Created by @n8makes

  Replit: https://replit.com/@n8makes/Dollar-to-Bitcoin-Sats-Web-Component
  Github: https://github.com/n8makes
*/

customElements.define('dollar-to-sats-web-component', DollarToSatsWebComponent);