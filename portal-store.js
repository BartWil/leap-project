(() => {
  'use strict';

  const STORAGE_KEY = 'leap-portal-coordinator-changes-v1';
  const base = window.LEAP_DEMO_DATA;
  const clone = value => JSON.parse(JSON.stringify(value));

  function readChanges() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return stored?.schemaVersion === 1 ? stored : null;
    } catch {
      return null;
    }
  }

  function load() {
    const data = clone(base);
    const changes = readChanges();
    data.coordinatorMessages = [];
    if (!changes) return data;

    if (Array.isArray(changes.blocks)) data.blocks = clone(changes.blocks);
    if (Array.isArray(changes.tasks)) data.tasks = clone(changes.tasks);
    if (Array.isArray(changes.messages)) data.coordinatorMessages = clone(changes.messages);
    if (Array.isArray(changes.teamOverrides)) {
      const overrides = new Map(changes.teamOverrides.map(item => [item.id, item]));
      data.team = data.team.map(person => ({ ...person, ...(overrides.get(person.id) || {}) }));
    }
    return data;
  }

  function save(data) {
    const changes = {
      schemaVersion: 1,
      baseVersion: base.version,
      updatedAt: new Date().toISOString(),
      blocks: clone(data.blocks),
      tasks: clone(data.tasks),
      messages: clone(data.coordinatorMessages || []),
      teamOverrides: data.team.map(person => ({
        id: person.id,
        notesPublic: person.notesPublic,
        responsibilities: clone(person.responsibilities)
      }))
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(changes));
    window.dispatchEvent(new CustomEvent('leap-data-updated', { detail: changes.updatedAt }));
  }

  window.LEAP_PORTAL_STORE = { load, save, storageKey: STORAGE_KEY };
})();
