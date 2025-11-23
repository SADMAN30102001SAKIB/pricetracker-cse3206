class BaseAlert {
  constructor(data) {
    this.data = data;
    this.icon = "📢";
    this.cssClass = "alert-default";
  }

  render() {
    return `
      <div class="alert ${this.cssClass}">
        <span class="alert-icon">${this.icon}</span>
        <strong>${this.data.product}</strong>: $${this.data.oldPrice} → $${this.data.price}
        <span class="alert-time">${this.data.timestamp}</span>
      </div>
    `;
  }
}

class PriceRiseAlert extends BaseAlert {
  constructor(data) {
    super(data);
    this.icon = "⬆️";
    this.cssClass = "alert-rise";
  }

  render() {
    return `
      <div class="alert ${this.cssClass}">
        <span class="alert-icon">${this.icon}</span>
        <strong>${this.data.product}</strong> increased from $${this.data.oldPrice} to $${this.data.price}
        <span class="alert-time">${this.data.timestamp}</span>
      </div>
    `;
  }
}

class PriceDropAlert extends BaseAlert {
  constructor(data) {
    super(data);
    this.icon = "⬇️";
    this.cssClass = "alert-drop";
  }

  render() {
    return `
      <div class="alert ${this.cssClass}">
        <span class="alert-icon">${this.icon}</span>
        <strong>${this.data.product}</strong> dropped from $${this.data.oldPrice} to $${this.data.price}
        <span class="alert-time">${this.data.timestamp}</span>
      </div>
    `;
  }
}

class AlertFactory {
  static create(type, data) {
    switch (type) {
      case "rise":
        return new PriceRiseAlert(data);
      case "drop":
        return new PriceDropAlert(data);
      default:
        return new BaseAlert(data);
    }
  }
}

class PriceObserver {
  constructor() {
    this.updateCount = 0;
    this.products = new Map();
    this.eventSource = null;
  }

  connect() {
    this.eventSource = new EventSource("http://localhost:3000/events");

    this.eventSource.onopen = () => {
      console.log("✅ Connected to price tracker");
      document.getElementById("connection-status").textContent = "🟢 Connected";
      document.getElementById("connection-status").classList.add("connected");
    };

    this.eventSource.onmessage = event => {
      const data = JSON.parse(event.data);
      this.handleEvent(data);
    };

    this.eventSource.onerror = () => {
      console.log("❌ Connection lost");
      document.getElementById("connection-status").textContent =
        "🔴 Disconnected";
      document
        .getElementById("connection-status")
        .classList.remove("connected");
    };
  }

  handleEvent(data) {
    if (data.type === "init") {
      this.initializeProducts(data.products);
    } else {
      this.updateCount++;
      document.getElementById(
        "update-count",
      ).textContent = `Updates: ${this.updateCount}`;

      this.updateProduct(data);

      const alert = AlertFactory.create(data.type, data);
      this.displayAlert(alert);
    }
  }

  initializeProducts(products) {
    const container = document.getElementById("current-prices");
    container.innerHTML = "";

    products.forEach(product => {
      this.products.set(product.id, product);
      container.innerHTML += `
        <div class="product-card" id="product-${product.id}">
          <h3>${product.name}</h3>
          <div class="price">$${product.price}</div>
        </div>
      `;
    });
  }

  updateProduct(data) {
    const productCards = document.querySelectorAll(".product-card");
    productCards.forEach(card => {
      if (card.querySelector("h3").textContent === data.product) {
        card.querySelector(".price").textContent = `$${data.price}`;
      }
    });
  }

  displayAlert(alert) {
    const alertsContainer = document.getElementById("alerts");
    alertsContainer.innerHTML = alert.render() + alertsContainer.innerHTML;

    const alerts = alertsContainer.children;
    if (alerts.length > 10) {
      alertsContainer.removeChild(alerts[alerts.length - 1]);
    }
  }
}

const observer = new PriceObserver();
observer.connect();
