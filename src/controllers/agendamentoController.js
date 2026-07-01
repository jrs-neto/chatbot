const agendamentoService = require("../services/agendamentoService");

/**
 * GET /api/agendamentos
 * Retorna a lista completa de agendamentos
 */
async function listar(req, res) {
  try {
    const agendamentos = await agendamentoService.listarTodosAgendamentos();
    return res.status(200).json(agendamentos);
  } catch (error) {
    return res.status(500).json({ error: "Erro ao buscar a lista de agendamentos." });
  }
}

/**
 * PUT /api/agendamentos/:id
 * Atualiza os campos de um agendamento específico
 */
async function atualizar(req, res) {
  try {
    const { id } = req.params;
    const dadosParaAtualizar = req.body;

    // Impede a alteração acidental de campos sensíveis como o ID do registro
    delete dadosParaAtualizar.id;

    const agendamentoAtualizado = await agendamentoService.atualizarAgendamento(id, dadosParaAtualizar);

    if (!agendamentoAtualizado) {
      return res.status(404).json({ error: "Agendamento não localizado para atualização." });
    }

    return res.status(200).json({
      message: "Agendamento atualizado com sucesso!",
      data: agendamentoAtualizado,
    });
  } catch (error) {
    return res.status(500).json({ error: "Erro ao tentar atualizar o agendamento." });
  }
}

/**
 * DELETE /api/agendamentos/:id
 * Remove um registro de agendamento do banco de dados
 */
async function deletar(req, res) {
  try {
    const { id } = req.params;
    await agendamentoService.deletarAgendamento(id);

    return res.status(200).json({ message: "Agendamento removido do sistema com sucesso." });
  } catch (error) {
    return res.status(500).json({ error: "Erro ao tentar remover o agendamento." });
  }
}

module.exports = {
  listar,
  atualizar,
  deletar,
};
