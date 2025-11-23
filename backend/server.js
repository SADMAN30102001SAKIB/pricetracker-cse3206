const express = require("express");
const cors = require("cors");
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

class PriceTracker {
  constructor() {
    this.clients = [];
    this.products = [
      { id: 1, name: "iPhone 15", price: 999 },
      { id: 2, name: "MacBook Pro", price: 2499 },
      { id: 3, name: "AirPods Pro", price: 249 },
    ];
  }

  addObserver(client) {
    this.clients.push(client);
    console.log(`Observer connected. Total: ${this.clients.length}`);
  }

  removeObserver(client) {
    this.clients = this.clients.filter(c => c !== client);
    console.log(`Observer disconnected. Total: ${this.clients.length}`);
  }

  notifyObservers(event) {
    this.clients.forEach(client => {
      client.write(`data: ${JSON.stringify(event)}\n\n`);
    });
  }

  simulatePriceChanges() {
    setInterval(() => {
      const product =
        this.products[Math.floor(Math.random() * this.products.length)];
      const change = Math.random() > 0.5 ? 1 : -1;
      const oldPrice = product.price;
      product.price += change * Math.floor(Math.random() * 50 + 10);

      const eventType = product.price > oldPrice ? "rise" : "drop";

      const event = {
        type: eventType,
        product: product.name,
        oldPrice: oldPrice,
        price: product.price,
        timestamp: new Date().toLocaleTimeString(),
      };

      console.log(
        `Price Update: ${product.name} ${eventType} from $${oldPrice} to $${product.price}`,
      );
      this.notifyObservers(event);
    }, 3000);
  }
}

const priceTracker = new PriceTracker();

app.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  priceTracker.addObserver(res);

  res.write(
    `data: ${JSON.stringify({
      type: "init",
      products: priceTracker.products,
    })}\n\n`,
  );

  req.on("close", () => {
    priceTracker.removeObserver(res);
  });
});

priceTracker.simulatePriceChanges();

app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
  console.log(`📡 SSE endpoint: http://localhost:${PORT}/events`);
});
