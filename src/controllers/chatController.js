const chatbotService = require("../services/chatbotService");

async function enviarMensagem(req, res) {
  try {
    const { idUsuario, mensagem } = req.body;

    if (!idUsuario || !mensagem) {
      return res.status(400).json({
        error: "Campos obrigatórios ausentes. É necessário enviar 'idUsuario' e 'mensagem'.",
      });
    }

    const respostaBot = await chatbotService.processarMensagem(idUsuario, mensagem);

    return res.status(200).json(respostaBot);
  } catch (error) {
    console.error("Erro no chatController:", error);
    return res.status(500).json({
      error: "Ocorreu um erro interno no servidor ao processar a mensagem.",
    });
  }
}

module.exports = {
  enviarMensagem,
};
