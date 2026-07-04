/**
 * Remove espaços extras, acentos e converte o texto para minúsculo.
 * @param {string} texto - Entrada bruta do usuário
 * @returns {string} Texto higienizado
 */
function higienizarTexto(texto) {
  if (!texto) return '';
  return texto
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

module.exports = higienizarTexto;
