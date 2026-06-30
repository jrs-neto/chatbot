const express = require("express");
const cors = require("cors");
require("dotenv").config();

const apiRoutes = require("./routes/api");

const app = express();

// Middlewares essenciais
app.use(cors()); // Permite que o Front-end (Browser) converse com esta API
app.use(express.json()); // Permite que o servidor entenda dados enviados em formato JSON

// Rotas da API
app.use("/api", apiRoutes);

// Rota simples de teste para garantir que o servidor está online
app.get("/", (req, res) => {
  res.send("🚀 Servidor do Chatbot está online e funcionando perfeitamente!");
});

// Define a porta do servidor (usa a do .env ou a 3000 por padrão)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`🤖 Chatbot Server running on: http://localhost:${PORT}`);
  console.log(`==================================================`);
});
