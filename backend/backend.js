const express = require("express");
const app = express();
const port = process.env.PORT || 3003;

app.use(express.json());

app.get("/health", (req, res) => res.json({ status: "ok", node: process.version }));

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
