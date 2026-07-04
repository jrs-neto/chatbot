/**
 * Limpa caracteres não numéricos e valida se a string possui exatamente 11 dígitos.
 * @param {string} entrada - O CPF bruto enviado pelo usuário
 * @returns {string|null} Retorna o CPF limpo se válido, ou null se inválido
 */
function validarCPF(entrada) {
  if (!entrada) return null;

  const cpfLimpo = entrada.replace(/\D/g, '');

  if (cpfLimpo.length !== 11) {
    return null;
  }

  return cpfLimpo;
}

module.exports = validarCPF;
