const { processarMensagem } = require('../src/services/chatbotService');
const estadoRepository = require('../src/repositories/estadoRepository');
const agendamentoRepository = require('../src/repositories/agendamentoRepository');
const EstadoConversa = require('../src/constants/estados');

// Inicializa o mock automático de todas as funções dos módulos
jest.mock('../src/repositories/estadoRepository');
jest.mock('../src/repositories/agendamentoRepository');

describe('ChatbotService - Máquina de Estados (Sprint 8)', () => {
  beforeEach(() => {
    // Reseta o histórico de chamadas de todos os mocks automáticos antes de cada teste
    jest.clearAllMocks();
  });

  describe('Fluxo de Boas-Vindas', () => {
    // 1. Teste de renderizar menu inicial
    it('Deve renderizar o menu de boas-vindas ao receber uma saudação válida em estado inicial', async () => {
      const idUsuario = 'usuario_teste_1';
      const entradaUsuario = 'Olá!';

      // Configuração explícita e controlada dos retornos do mock
      estadoRepository.buscarEstadoPorUsuario.mockResolvedValue(null);
      estadoRepository.salvarEstadoUsuario.mockResolvedValue(true);

      const resultado = await processarMensagem(idUsuario, entradaUsuario);

      // Asserções com foco em previsibilidade
      expect(resultado).toHaveProperty('text');
      expect(resultado.text.toLowerCase()).toContain('bem-vindo');
      expect(resultado.estado).toBe(EstadoConversa.BOAS_VINDAS);

      // Garante que a infraestrutura foi acionada corretamente
      expect(estadoRepository.buscarEstadoPorUsuario).toHaveBeenCalledWith(idUsuario);
    });

    // 2. Teste da opção "1"
    it("Deve transicionar para ACOLHIMENTO_ORIENTACAO ao receber a opção '1' no menu de boas-vindas", async () => {
      const idUsuario = 'usuario_teste_2';
      const entradaUsuario = '1';

      // 1. Configura os mocks de forma controlada
      estadoRepository.buscarEstadoPorUsuario.mockResolvedValue(null);
      estadoRepository.salvarEstadoUsuario.mockResolvedValue(true);

      // 2. Executa a ação da máquina de estados
      const resultado = await processarMensagem(idUsuario, entradaUsuario);

      // 3. Asserções de comportamento de alto nível
      expect(resultado).toHaveProperty('text');
      expect(resultado.estado).toBe(EstadoConversa.ACOLHIMENTO_ORIENTACAO);

      // 4. Valida se os métodos de infraestrutura foram acionados
      expect(estadoRepository.buscarEstadoPorUsuario).toHaveBeenCalledWith(idUsuario);
      expect(estadoRepository.salvarEstadoUsuario).toHaveBeenCalled();
    });

    describe('Fluxo de Validação de CPF', () => {
      it('Deve localizar o agendamento e retornar ao menu inicial quando o CPF existir no banco', async () => {
        const idUsuario = 'usuario_cpf_existente';
        const cpfValido = '12345678901';

        // 1. Configura os mocks: usuário já está no estado SOLICITAR_CPF e possui agendamento
        estadoRepository.buscarEstadoPorUsuario.mockResolvedValue({
          estado: EstadoConversa.SOLICITAR_CPF,
          tentativas_invalidas: 0,
        });
        agendamentoRepository.buscarPorCPF.mockResolvedValue({
          id_especialidade: 'Acolhimento Psicológico',
          id_voluntario: 'João Silva',
          data_inicio: '2026-07-10T14:00:00.000Z',
        });

        // 2. Executa a ação
        const resultado = await processarMensagem(idUsuario, cpfValido);

        // 3. Asserções de comportamento
        expect(resultado).toHaveProperty('text');
        expect(resultado.text.toLowerCase()).toContain('agendamento localizado');
        expect(resultado.estado).toBe(EstadoConversa.BOAS_VINDAS);

        // 4. Valida se consultou o banco e salvou o estado final
        expect(agendamentoRepository.buscarPorCPF).toHaveBeenCalledWith(cpfValido);
        expect(estadoRepository.salvarEstadoUsuario).toHaveBeenCalled();
      });

      it('Deve criar uma nova triagem automaticamente quando o CPF não for encontrado no banco', async () => {
        const idUsuario = 'usuario_cpf_novo';
        const cpfValido = '98765432109';

        // 1. Configura os mocks: usuário no estado SOLICITAR_CPF e CPF não existe (null)
        estadoRepository.buscarEstadoPorUsuario.mockResolvedValue({
          estado: EstadoConversa.SOLICITAR_CPF,
          tentativas_invalidas: 0,
        });
        agendamentoRepository.buscarPorCPF.mockResolvedValue(null);
        agendamentoRepository.criar.mockResolvedValue({
          id_especialidade: 'Acolhimento Social Inicial',
          data_inicio: new Date().toISOString(),
        });

        // 2. Executa a ação
        const resultado = await processarMensagem(idUsuario, cpfValido);

        // 3. Asserções de comportamento
        expect(resultado).toHaveProperty('text');
        expect(resultado.text.toLowerCase()).toContain('triagem agendada com sucesso');
        expect(resultado.estado).toBe(EstadoConversa.BOAS_VINDAS);

        // 4. Garante que acionou o fluxo de criação (INSERT) no repositório
        expect(agendamentoRepository.buscarPorCPF).toHaveBeenCalledWith(cpfValido);
        expect(agendamentoRepository.criar).toHaveBeenCalled();
        expect(estadoRepository.salvarEstadoUsuario).toHaveBeenCalled();
      });

      it('Deve validar o fluxo completo limpando caracteres do CPF antes de realizar a busca', async () => {
        const idUsuario = 'usuario_cpf_formatado';
        const cpfComMascara = '123.456.789-01';
        const cpfLimpoEsperado = '12345678901';

        // 1. Configura os mocks para o fluxo completo
        estadoRepository.buscarEstadoPorUsuario.mockResolvedValue({
          estado: EstadoConversa.SOLICITAR_CPF,
          tentativas_invalidas: 0,
        });
        agendamentoRepository.buscarPorCPF.mockResolvedValue(null); // Cai no fluxo de criação

        // 2. Executa a ação passando o CPF com pontos e traço
        await processarMensagem(idUsuario, cpfComMascara);

        // 3. Valida se a limpeza de string isolou apenas os 11 números antes de injetar na query
        expect(agendamentoRepository.buscarPorCPF).toHaveBeenCalledWith(cpfLimpoEsperado);
      });

      it('Deve incrementar tentativas e não consultar o agendamento se o CPF for inválido', async () => {
        const idUsuario = 'usuario_cpf_invalido';
        const entradaInvalida = '123-abc'; // Input inválido
        const tentativasAtuais = 1;

        // 1. Configura os mocks: usuário está em SOLICITAR_CPF com 1 tentativa já registrada
        estadoRepository.buscarEstadoPorUsuario.mockResolvedValue({
          estado: EstadoConversa.SOLICITAR_CPF,
          tentativas_invalidas: tentativasAtuais,
        });
        estadoRepository.salvarEstadoUsuario.mockResolvedValue(true);

        // 2. Executa a ação
        const resultado = await processarMensagem(idUsuario, entradaInvalida);

        // 3. Asserções de comportamento com RegExp resiliente
        expect(resultado).toHaveProperty('text');
        expect(resultado.text.toLowerCase()).toMatch(/cpf|inv/i);
        expect(resultado.estado).toBe(EstadoConversa.SOLICITAR_CPF); // Mantém o estado atual

        // 4. Valida as regras de infraestrutura (salva tentativa e NÃO busca CPF no banco)
        expect(estadoRepository.salvarEstadoUsuario).toHaveBeenCalled();
        expect(agendamentoRepository.buscarPorCPF).not.toHaveBeenCalled();
      });
    });
  });
  describe('Mecanismo de Fallback (Transbordo)', () => {
    it('Deve transicionar para ATENDIMENTO_HUMANO na 3ª tentativa inválida consecutiva no estado SOLICITAR_CPF e não consultar o banco', async () => {
      const idUsuario = 'usuario_transbordo';
      const entradaInvalida = 'entrada_incorreta';
      const tentativasAtuais = 2;

      estadoRepository.buscarEstadoPorUsuario.mockResolvedValue({
        estado: EstadoConversa.SOLICITAR_CPF,
        tentativas_invalidas: tentativasAtuais,
      });

      estadoRepository.salvarEstadoUsuario.mockResolvedValue(true);
      agendamentoRepository.buscarPorCPF = jest.fn();

      const resultado = await processarMensagem(idUsuario, entradaInvalida);

      expect(resultado).toHaveProperty('text');
      expect(resultado.estado).toBe(EstadoConversa.ATENDIMENTO_HUMANO);

      expect(estadoRepository.salvarEstadoUsuario).toHaveBeenCalled();
      expect(agendamentoRepository.buscarPorCPF).not.toHaveBeenCalled();
    });
  });
});
