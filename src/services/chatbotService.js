const agendamentoRepository = require("../repositories/agendamentoRepository");
const estadoRepository = require("../repositories/estadoRepository");
const EstadoConversa = require("../constants/estados");
const MENSAGENS = require("../data/messages.json");
const formatarResposta = require("../utils/formatarResposta");
const validarCPF = require("../utils/validarCPF");
const formatarData = require("../utils/formatarData");
const higienizarTexto = require("../utils/higienizarTexto");

// FUNÇÕES AUXILIARES

/**
 * Atalho para transicionar o usuário de estado, resetando as tentativas inválidas
 */
async function transicionarPara(idUsuario, novoEstado, mensagemCorrespondente) {
  await estadoRepository.salvarEstadoUsuario(idUsuario, novoEstado, 0);
  return formatarResposta(mensagemCorrespondente);
}

/**
 * Trata os erros de digitação e gerencia o limite de tentativas antes do transbordo humano
 */
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
    estado: estado,
  };
}

// HANDLERS DOS ESTADOS DA MÁQUINA

async function gerenciarBoasVindas(idUsuario, opcao, tentativasAtuais) {
  const mensagemTratada = higienizarTexto(opcao);
  const saudacoes = ["oi", "ola", "bom dia", "boa tarde", "boa noite", "ajuda", "inicio", "comecar"];

  if (saudacoes.includes(mensagemTratada) || isNaN(mensagemTratada)) {
    return formatarResposta(MENSAGENS.BOAS_VINDAS);
  }

  switch (opcao) {
    case "1":
      return await transicionarPara(idUsuario, EstadoConversa.ACOLHIMENTO_ORIENTACAO, MENSAGENS.ACOLHIMENTO_ORIENTACAO);
    case "2":
      return await transicionarPara(idUsuario, EstadoConversa.SOLICITAR_CPF, MENSAGENS.SOLICITAR_CPF);
    case "3":
      return await transicionarPara(idUsuario, EstadoConversa.TORNAR_VOLUNTARIO, MENSAGENS.TORNAR_VOLUNTARIO);
    default:
      return processarOpcaoInvalida(idUsuario, EstadoConversa.BOAS_VINDAS, tentativasAtuais);
  }
}

async function gerenciarAcolhimento(idUsuario, opcao, tentativasAtuais) {
  switch (opcao) {
    case "0":
      return await transicionarPara(idUsuario, EstadoConversa.BOAS_VINDAS, MENSAGENS.BOAS_VINDAS);
    case "1":
      return await transicionarPara(idUsuario, EstadoConversa.SOLICITAR_CPF, MENSAGENS.SOLICITAR_CPF);
    default:
      return processarOpcaoInvalida(idUsuario, EstadoConversa.ACOLHIMENTO_ORIENTACAO, tentativasAtuais);
  }
}

async function gerenciarSolicitarCPF(idUsuario, opcao, tentativasAtuais) {
  const cpfLimpo = validarCPF(opcao);

  if (!cpfLimpo) {
    return processarOpcaoInvalida(
      idUsuario,
      EstadoConversa.SOLICITAR_CPF,
      tentativasAtuais,
      "⚠️ CPF inválido. Por favor, digite um CPF válido contendo exatamente 11 números.",
    );
  }

  const agendamento = await agendamentoRepository.buscarPorCPF(cpfLimpo);

  // Ambos os fluxos salvam e retornam o usuário para o estado BOAS_VINDAS com 0 tentativas
  await estadoRepository.salvarEstadoUsuario(idUsuario, EstadoConversa.BOAS_VINDAS, 0);

  if (agendamento) {
    const dataFormatada = formatarData(agendamento.data_inicio);

    return {
      text: `🗓️ **Agendamento Localizado!**\n\n• **Serviço:** ${agendamento.id_especialidade}\n• **Profissional:** ${agendamento.id_voluntario}\n• **Data/Hora:** ${dataFormatada}h\n\nO que deseja fazer agora? Digite qualquer mensagem para voltar ao menu principal.`,
      estado: EstadoConversa.BOAS_VINDAS,
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

    const dataFormatada = formatarData(novoAgendamento.data_inicio);

    return {
      text: `✅ **Triagem Agendada com Sucesso!**\n\nO seu primeiro contacto de acolhimento social foi registado no sistema.\n\n• **Agendamento:** ${novoAgendamento.id_especialidade}\n• **Data Estimada:** ${dataFormatada}h\n\nPor favor, guarde estas informações. Digite qualquer mensagem para regressar ao início.`,
      estado: EstadoConversa.BOAS_VINDAS,
    };
  }
}

async function gerenciarTornarVoluntario(idUsuario, opcao, tentativasAtuais) {
  switch (opcao) {
    case "0":
      return await transicionarPara(idUsuario, EstadoConversa.BOAS_VINDAS, MENSAGENS.BOAS_VINDAS);
    case "1":
      return await transicionarPara(idUsuario, EstadoConversa.ATENDIMENTO_HUMANO, MENSAGENS.ATENDIMENTO_HUMANO);
    default:
      return processarOpcaoInvalida(idUsuario, EstadoConversa.TORNAR_VOLUNTARIO, tentativasAtuais);
  }
}

// LÓGICA PRINCIPAL DO CHATBOT

async function processarMensagem(idUsuario, opcao) {
  // 1. Recupera ou inicializa o estado do usuário no banco
  const dadosEstado = await estadoRepository.buscarEstadoPorUsuario(idUsuario);

  const estado = dadosEstado ? dadosEstado.estado : EstadoConversa.BOAS_VINDAS;
  const tentativasAtuais = dadosEstado ? dadosEstado.tentativas_invalidas : 0;

  // Interceptador global do comando de reset
  if (opcao === "#") {
    return await transicionarPara(idUsuario, EstadoConversa.BOAS_VINDAS, MENSAGENS.BOAS_VINDAS);
  }

  // Despachante da Máquina de Estados
  switch (estado) {
    case EstadoConversa.BOAS_VINDAS:
      return await gerenciarBoasVindas(idUsuario, opcao, tentativasAtuais);

    case EstadoConversa.ACOLHIMENTO_ORIENTACAO:
      return await gerenciarAcolhimento(idUsuario, opcao, tentativasAtuais);

    case EstadoConversa.SOLICITAR_CPF:
      return await gerenciarSolicitarCPF(idUsuario, opcao, tentativasAtuais);

    case EstadoConversa.TORNAR_VOLUNTARIO:
      return await gerenciarTornarVoluntario(idUsuario, opcao, tentativasAtuais);

    case EstadoConversa.ATENDIMENTO_HUMANO:
      return formatarResposta(MENSAGENS.ATENDIMENTO_HUMANO);

    default:
      // Fallback de segurança para caso caia em algum estado indefinido
      return await transicionarPara(idUsuario, EstadoConversa.BOAS_VINDAS, MENSAGENS.BOAS_VINDAS);
  }
}

module.exports = { processarMensagem };
