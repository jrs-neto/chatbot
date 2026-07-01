const agendamentoRepository = require("../repositories/agendamentoRepository");

async function listarTodosAgendamentos() {
  return await agendamentoRepository.listarTodos();
}

async function atualizarAgendamento(id, dados) {
  return await agendamentoRepository.atualizar(id, dados);
}

async function deletarAgendamento(id) {
  return await agendamentoRepository.deletar(id);
}

module.exports = { listarTodosAgendamentos, atualizarAgendamento, deletarAgendamento };
