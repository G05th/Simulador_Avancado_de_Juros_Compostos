// js/storage.js
// Módulo responsável por salvar/carregar/renomear/excluir cenários no localStorage.
// Usa um namespace único para evitar colisões: 'jurosim:scenarios'

const STORAGE_KEY = 'jurosim:scenarios:v1';

/**
 * Recupera o mapa de cenários do localStorage.
 * @returns {Object} mapa { nome: { createdAt, modifiedAt, data } }
 */
function _readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error('storage: read error', e);
    return {};
  }
}

/**
 * Persiste o mapa de cenários no localStorage.
 * @param {Object} map
 */
function _writeStore(map) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch (e) {
    console.error('storage: write error', e);
    throw e;
  }
}

/**
 * Lista todos os cenários salvos (ordenados por modifiedAt desc).
 * @returns {Array<{name, createdAt, modifiedAt, data}>}
 */
export function listScenarios() {
  const map = _readStore();
  const arr = Object.keys(map).map(name => ({ name, ...map[name] }));
  arr.sort((a,b) => (b.modifiedAt || b.createdAt) - (a.modifiedAt || a.createdAt));
  return arr;
}

/**
 * Salva um cenário. Se overwrite = false e nome existe -> lança erro.
 * @param {string} name
 * @param {Object} data - objeto serializável (params + optionally timeline/results)
 * @param {Object} opts - { overwrite: boolean }
 */
export function saveScenario(name, data, opts = { overwrite: false }) {
  if (!name || typeof name !== 'string') throw new Error('Nome inválido');
  const map = _readStore();
  const exists = Boolean(map[name]);
  if (exists && !opts.overwrite) {
    throw new Error('Já existe um cenário com este nome. Use overwrite=true para substituir.');
  }
  const now = Date.now();
  map[name] = {
    createdAt: exists ? map[name].createdAt : now,
    modifiedAt: now,
    data
  };
  _writeStore(map);
  // dispatch event
  document.dispatchEvent(new CustomEvent('jurosim:storage:changed', { detail: { action: 'save', name } }));
  return true;
}

/**
 * Carrega cenário por nome. Retorna { name, createdAt, modifiedAt, data } ou null.
 * @param {string} name
 */
export function loadScenario(name) {
  const map = _readStore();
  return map[name] ? { name, ...map[name] } : null;
}

/**
 * Deleta cenário por nome.
 * @param {string} name
 */
export function deleteScenario(name) {
  const map = _readStore();
  if (!map[name]) return false;
  delete map[name];
  _writeStore(map);
  document.dispatchEvent(new CustomEvent('jurosim:storage:changed', { detail: { action: 'delete', name } }));
  return true;
}

/**
 * Renomeia um cenário (se target já existir lança erro).
 * @param {string} oldName
 * @param {string} newName
 */
export function renameScenario(oldName, newName) {
  if (!oldName || !newName) throw new Error('Nomes inválidos');
  const map = _readStore();
  if (!map[oldName]) throw new Error('Cenário original não encontrado');
  if (map[newName]) throw new Error('Já existe um cenário com o novo nome');
  map[newName] = { ...map[oldName], modifiedAt: Date.now() };
  delete map[oldName];
  _writeStore(map);
  document.dispatchEvent(new CustomEvent('jurosim:storage:changed', { detail: { action: 'rename', from: oldName, to: newName } }));
  return true;
}

/**
 * Exporta todos os cenários como objeto (para fazer download JSON se quiser).
 * @returns {Object}
 */
export function exportAllScenarios() {
  return _readStore();
}

/**
 * Importa cenários (mescla). Se colisão de nomes usa sufixo timestamp.
 * @param {Object} importedMap
 * @returns {Object} map resultante
 */
export function importScenarios(importedMap = {}) {
  if (typeof importedMap !== 'object') throw new Error('Formato inválido');
  const map = _readStore();
  Object.keys(importedMap).forEach(name => {
    const candidateName = map[name] ? `${name}_${Date.now()}` : name;
    map[candidateName] = importedMap[name];
    if (!map[candidateName].createdAt) map[candidateName].createdAt = Date.now();
    map[candidateName].modifiedAt = Date.now();
  });
  _writeStore(map);
  document.dispatchEvent(new CustomEvent('jurosim:storage:changed', { detail: { action: 'import' } }));
  return map;
}

/**
 * Remove todos os cenários (USE COM CUIDADO)
 */
export function clearAll() {
  localStorage.removeItem(STORAGE_KEY);
  document.dispatchEvent(new CustomEvent('jurosim:storage:changed', { detail: { action: 'clear' } }));
  return true;
}
