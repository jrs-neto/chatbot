const supabase = require("../config/database");

async function buscarEstadoPorUsuario(idUsuario) {
  const { data, error } = await supabase.from("estados_conversa").select("*").eq("id_usuario", idUsuario).single();

  if (error && error.code !== "PGRST116") throw error; // Ignora erro de registro não encontrado
  return data;
}

async function salvarEstadoUsuario(idUsuario, estado, tentativas) {
  const { error } = await supabase
    .from("estados_conversa")
    .upsert({ id_usuario: idUsuario, estado, tentativas_invalidas: tentativas }, { onConflict: "id_usuario" });

  if (error) throw error;
}

module.exports = { buscarEstadoPorUsuario, salvarEstadoUsuario };
