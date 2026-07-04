const agendamentoRepository = require("../repositories/agendamentoRepository");

function listarTodosAgendamentos() {
  return agendamentoRepository.listarTodos();
}

function atualizarAgendamento(id, dados) {
  return agendamentoRepository.atualizar(id, dados);
}

function deletarAgendamento(id) {
  return agendamentoRepository.deletar(id);
}

module.exports = { listarTodosAgendamentos, atualizarAgendamento, deletarAgendamento };
