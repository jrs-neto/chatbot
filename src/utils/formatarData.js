function formatarData(data) {
  return new Date(data).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
  });
}

module.exports = formatarData;
