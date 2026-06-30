const agendamentoRepository = require("../repositories/agendamentoRepository");
const estadoRepository = require("../repositories/estadoRepository");
const EstadoConversa = require("../constants/estados");
const MENSAGENS = require("../data/messages.json");

// Formatar saídas
function formatarResposta(contextoMensagem) {
  return {
    text: `${contextoMensagem.mensagem}\n\n${contextoMensagem.menu.join("\n")}`,
    estado: contextoMensagem.estado,
  };
}

/**
 * Lógica Principal do Chatbot (Estados)
 */
async function processarMensagem(idUsuario, opcao) {
  // 1. Recupera ou inicializa o estado do usuário no banco
  let dadosEstado = await estadoRepository.buscarEstadoPorUsuario(idUsuario);

  let estado = dadosEstado ? dadosEstado.estado : EstadoConversa.BOAS_VINDAS;
  let tentativasAtuais = dadosEstado ? dadosEstado.tentativas_atuais : 0;

  // Se o usuário digitar #, reseta o fluxo para o início
  if (opcao === "#") {
    await estadoRepository.salvarEstadoUsuario(idUsuario, EstadoConversa.BOAS_VINDAS, 0);
    return formatarResposta(MENSAGENS.BOAS_VINDAS);
  }

  // ==========================================
  // ESTADO: BOAS_VINDAS
  // ==========================================
  if (estado === EstadoConversa.BOAS_VINDAS) {
    const mensagemTratada = opcao
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    const saudacoes = ["oi", "ola", "bom dia", "boa tarde", "boa noite", "ajuda", "inicio", "comecar"];

    if (saudacoes.includes(mensagemTratada) || isNaN(mensagemTratada)) {
      return formatarResposta(MENSAGENS.BOAS_VINDAS);
    }

    if (opcao === "1") {
      await estadoRepository.salvarEstadoUsuario(idUsuario, EstadoConversa.ACOLHIMENTO_ORIENTACAO, 0);
      return formatarResposta(MENSAGENS.ACOLHIMENTO_ORIENTACAO);
    }
    if (opcao === "2") {
      await estadoRepository.salvarEstadoUsuario(idUsuario, EstadoConversa.SOLICITAR_CPF, 0);
      return formatarResposta(MENSAGENS.SOLICITAR_CPF);
    }
    if (opcao === "3") {
      await estadoRepository.salvarEstadoUsuario(idUsuario, EstadoConversa.TORNAR_VOLUNTARIO, 0);
      return formatarResposta(MENSAGENS.TORNAR_VOLUNTARIO);
    }

    return processarOpcaoInvalida(idUsuario, estado, tentativasAtuais);
  }

  // ==========================================
  // ESTADO: ACOLHIMENTO_ORIENTACAO
  // ==========================================
  if (estado === EstadoConversa.ACOLHIMENTO_ORIENTACAO) {
    if (opcao === "0") {
      await estadoRepository.salvarEstadoUsuario(idUsuario, EstadoConversa.BOAS_VINDAS, 0);
      return formatarResposta(MENSAGENS.BOAS_VINDAS);
    }
    if (opcao === "1") {
      await estadoRepository.salvarEstadoUsuario(idUsuario, EstadoConversa.SOLICITAR_CPF, 0);
      return formatarResposta(MENSAGENS.SOLICITAR_CPF);
    }

    return processarOpcaoInvalida(idUsuario, estado, tentativasAtuais);
  }

  // ==========================================
  // ESTADO: SOLICITAR_CPF
  // ==========================================
  if (estado === EstadoConversa.SOLICITAR_CPF) {
    const cpfLimpo = opcao.replace(/\D/g, "");

    if (cpfLimpo.length !== 11) {
      return processarOpcaoInvalida(
        idUsuario,
        estado,
        tentativasAtuais,
        "⚠️ CPF inválido. Por favor, digite um CPF válido contendo exatamente 11 números.",
      );
    }

    const agendamento = await agendamentoRepository.buscarPorCPF(cpfLimpo);

    if (agendamento) {
      const dataFormatada = new Date(agendamento.data_inicio).toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
      });
      await estadoRepository.salvarEstadoUsuario(idUsuario, EstadoConversa.BOAS_VINDAS, 0);

      return {
        text: `🗓️ **Agendamento Localizado!**\n\n• **Serviço:** ${agendamento.id_especialidade}\n• **Profissional:** ${agendamento.id_voluntario}\n• **Data/Hora:** ${dataFormatada}h\n\nO que deseja fazer agora? Digite qualquer mensagem para voltar ao menu principal.`,
      };
    } else {
      const dataTriagem = new Date();
      dataTriagem.setDate(dataTriagem.getDate() + 1);

      const novoAgendamento = await agendamentoRepository.criar({
        id_voluntario: "Triagem Automatizada (Sistema)",
        id_especialidade: "Acolhimento Social Inicial",
        data_inicio: dataTriagem.toISOString(),
        cpf_cliente: cpfLimpo,
      });

      const dataFormatada = new Date(novoAgendamento.data_inicio).toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
      });
      await estadoRepository.salvarEstadoUsuario(idUsuario, EstadoConversa.BOAS_VINDAS, 0);

      return {
        text: `✅ **Triagem Agendada com Sucesso!**\n\nO seu primeiro contacto de acolhimento social foi registado no sistema.\n\n• **Agendamento:** ${novoAgendamento.id_especialidade}\n• **Data Estimada:** ${dataFormatada}h\n\nPor favor, guarde estas informações. Digite qualquer mensagem para regressar ao início.`,
      };
    }
  }

  // ... (Tratativas para TORNAR_VOLUNTARIO e ATENDIMENTO_HUMANO)
}

// Funções Repassadas para a REST API (Apenas servem de ponte para o Repository)
async function listarTodosAgendamentos() {
  return await agendamentoRepository.listarTodos();
}
async function atualizarAgendamento(id, dados) {
  return await agendamentoRepository.atualizar(id, dados);
}
async function deletarAgendamento(id) {
  return await agendamentoRepository.deletar(id);
}

// Função auxiliar de tratamento de erros de digitação do menu
async function processarOpcaoInvalida(idUsuario, estado, tentativasAtuais, msgCustomizada = null) {
  const novasTentativas = tentativasAtuais + 1;

  if (novasTentativas >= 3) {
    await estadoRepository.salvarEstadoUsuario(idUsuario, EstadoConversa.ATENDIMENTO_HUMANO, 0);
    return formatarResposta(MENSAGENS.TIMEOUT);
  }

  await estadoRepository.salvarEstadoUsuario(idUsuario, estado, novasTentativas);
  return {
    text:
      msgCustomizada ||
      `⚠️ Opção inválida. Por favor, selecione uma das opções válidas do menu. (Tentativa ${novasTentativas} de 3)`,
  };
}

module.exports = {
  processarMensagem,
  listarTodosAgendamentos,
  atualizarAgendamento,
  deletarAgendamento,
};
