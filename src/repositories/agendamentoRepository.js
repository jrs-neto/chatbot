const supabase = require("../config/database");

async function buscarPorCPF(cpf) {
  const { data, error } = await supabase
    .from("agendamentos")
    .select("*")
    .eq("cpf_cliente", cpf)
    .order("data_inicio", { ascending: false })
    .limit(1);

  if (error) throw error;
  return data && data.length > 0 ? data[0] : null;
}

async function criar(dadosAgendamento) {
  const { data, error } = await supabase.from("agendamentos").insert([dadosAgendamento]).select();

  if (error) throw error;
  return data && data.length > 0 ? data[0] : null;
}

async function listarTodos() {
  const { data, error } = await supabase.from("agendamentos").select("*").order("data_inicio", { ascending: true });

  if (error) throw error;
  return data;
}

async function atualizar(id, dados) {
  const { data, error } = await supabase.from("agendamentos").update(dados).eq("id", id).select();

  if (error) throw error;
  return data && data.length > 0 ? data[0] : null;
}

async function deletar(id) {
  const { error } = await supabase.from("agendamentos").delete().eq("id", id);

  if (error) throw error;
  return true;
}

module.exports = { buscarPorCPF, criar, listarTodos, atualizar, deletar };
