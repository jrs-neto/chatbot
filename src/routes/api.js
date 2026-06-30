const express = require("express");
const router = express.Router();

// Importação dos Controllers
const chatController = require("../controllers/chatController");
const agendamentoController = require("../controllers/agendamentoController");

// ROTA DO CHATBOT (Webhook)
router.post("/webhook", chatController.enviarMensagem);

// ROTAS REST API (CRUD - Painel Administrativo)

// 1. Listar todos os agendamentos (GET http://localhost:3000/api/agendamentos)
router.get("/agendamentos", agendamentoController.listar);

// 2. Atualizar um agendamento específico (PUT http://localhost:3000/api/agendamentos/:id)
router.put("/agendamentos/:id", agendamentoController.atualizar);

// 3. Deletar um agendamento específico (DELETE http://localhost:3000/api/agendamentos/:id)
router.delete("/agendamentos/:id", agendamentoController.deletar);

module.exports = router;
