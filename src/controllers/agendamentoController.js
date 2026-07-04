const agendamentoService = require('../services/agendamentoService');

/**
 * GET /api/agendamentos
 * Retorna a lista completa de agendamentos
 */
async function listar(req, res) {
  try {
    const agendamentos = await agendamentoService.listarTodosAgendamentos();
    return res.status(200).json(agendamentos);
  } catch (error) {
    console.error('Erro ao buscar a lista de agendamentos:', error);
    return res.status(500).json({ error: 'Erro ao buscar a lista de agendamentos.' });
  }
}

/**
 * PUT /api/agendamentos/:id
 * Atualiza os campos de um agendamento específico
 */
async function atualizar(req, res) {
  try {
    const { id } = req.params;

    // Desestruturação funcional para descartar o ID do corpo
    const { id: _, ...dadosParaAtualizar } = req.body;

    const agendamentoAtualizado = await agendamentoService.atualizarAgendamento(
      id,
      dadosParaAtualizar,
    );

    if (!agendamentoAtualizado) {
      return res.status(404).json({ error: 'Agendamento não localizado para atualização.' });
    }

    return res.status(200).json({
      message: 'Agendamento atualizado com sucesso!',
      data: agendamentoAtualizado,
    });
  } catch (error) {
    console.error(`Erro ao atualizar o agendamento ID ${req.params.id}:`, error);
    return res.status(500).json({ error: 'Erro ao tentar atualizar o agendamento.' });
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

    return res.status(200).json({ message: 'Agendamento removido com sucesso!' });
  } catch (error) {
    console.error(`Erro ao deletar o agendamento ID ${req.params.id}:`, error);
    return res.status(500).json({ error: 'Erro ao tentar deletar o agendamento.' });
  }
}

module.exports = { listar, atualizar, deletar };
