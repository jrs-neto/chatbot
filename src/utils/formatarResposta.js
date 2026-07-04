/**
 * Formata as saídas de forma defensiva, evitando quebras caso o 'menu' seja undefined
 */
function formatarResposta(contextoMensagem) {
  const itensMenu = contextoMensagem.menu?.join('\n') || '';

  return {
    text: `${contextoMensagem.mensagem}${itensMenu ? `\n\n${itensMenu}` : ''}`,
    estado: contextoMensagem.estado,
  };
}

module.exports = formatarResposta;
