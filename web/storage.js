/* The browser keeps only an emergency copy; SQLite is authoritative. */
window.TrainingStore = (() => {
  const pendingKey = 'training-max-tracker:public-demo:pending';
  let revision = 0, token = '', pending = null, saving = false, blocked = false;
  let getSnapshot, applySnapshot;
  const byId = id => document.getElementById(id);
  function status(message, failed = false) {
    byId('saveStatus').textContent = message;
    byId('saveStatus').setAttribute('role', failed ? 'alert' : 'status');
    byId('retrySave').hidden = !failed || blocked;
    byId('useDatabase').hidden = !blocked;
  }
  function freeze(value) { document.querySelector('main').inert = value; }
  function download(data, name) {
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], {type:'application/json'}));
    const link = document.createElement('a');
    link.href = url; link.download = name; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function request(path, body) {
    const response = await fetch(path, body === undefined ? {cache:'no-store'} : {
      method:'POST', headers:{'Content-Type':'application/json','X-Training-Token':token}, body:JSON.stringify(body)
    });
    const result = await response.json();
    if (!response.ok) {
      const error = new Error(result.error || 'The server could not complete this request.');
      error.code = response.status;
      throw error;
    }
    return result;
  }
  function cachePending() {
    try { localStorage.setItem(pendingKey, JSON.stringify({revision, state:pending})); }
    catch { status('Emergency browser copy unavailable. Keep this window open until saved.', true); }
  }
  async function flush() {
    if (saving || blocked || !pending) return;
    saving = true;
    try {
      while (pending) {
        const next = pending;
        status('Saving to SQLite…');
        const result = await request('/api/state', {revision, state:next});
        revision = result.revision;
        if (pending === next) pending = null;
        if (pending) cachePending();
        else { try { localStorage.removeItem(pendingKey); } catch {} }
      }
      freeze(false);
      status('Saved to SQLite');
    } catch (error) {
      blocked = error.code === 409 || error.code === 400;
      freeze(true);
      status(error.message + ' Your changes remain available through Export data.', true);
    } finally { saving = false; }
  }
  function save() {
    pending = getSnapshot();
    cachePending();
    void flush();
  }
  async function progress(exerciseId) {
    if (saving || pending || blocked) {
      status('Wait until your latest changes have saved before progressing TM.', true);
      return;
    }
    freeze(true);
    try {
      const result = await request('/api/progress', {revision, exerciseId});
      revision = result.revision;
      applySnapshot(result.state);
      status('Training max progressed and saved to SQLite');
      freeze(false);
    } catch(error) {
      // A lost response may mean the action committed: reload rather than retry it.
      blocked = true;
      status(error.message + ' Reload the database version before trying progression again.', true);
    }
  }
  async function migrate(initial) {
    const panel = byId('migrationPanel');
    let candidate = null;
    panel.hidden = false;
    freeze(true);
    async function preview(data, label) {
      try {
        const counts = await request('/api/preview', {state:data});
        candidate = data;
        byId('migrationPreview').textContent = `${label}: ${counts.athletes} athletes, ${counts.exercises} exercises, ${counts.records} lift records, ${counts.workouts} workouts. Nothing has been imported yet.`;
        byId('confirmImport').disabled = false;
      } catch (error) {
        candidate = null;
        byId('confirmImport').disabled = true;
        byId('migrationPreview').textContent = error.message;
      }
    }
    byId('importFile').addEventListener('change', async event => {
      const file = event.target.files[0];
      if (!file) return;
      try {
        if (file.size > 16 * 1024 * 1024) throw new Error('Choose a file smaller than 16 MB.');
        let data = JSON.parse(await file.text());
        if (!data.athletes && Array.isArray(data.exercises)) {
          data = {...data, athletes:[{id:'default-athlete', name:'My Training', exercises:data.exercises}]};
        }
        await preview(data, file.name);
      } catch(error) { byId('migrationPreview').textContent = error.message; candidate=null; byId('confirmImport').disabled=true; }
    });
    byId('previewDemo').addEventListener('click', async () => {
      try { await preview(await request('/api/demo'), 'Fictional demo data'); }
      catch(error) { byId('migrationPreview').textContent=error.message; }
    });
    byId('startEmpty').addEventListener('click', () => preview(initial, 'New empty training database'));
    return new Promise(resolve => {
      byId('confirmImport').addEventListener('click', async () => {
        if (!candidate) return;
        byId('confirmImport').disabled = true;
        try {
          const result = await request('/api/state', {revision, state:candidate});
          revision = result.revision;
          panel.hidden = true;
          freeze(false);
          status('Imported and saved to SQLite');
          resolve(candidate);
        } catch(error) {
          byId('migrationPreview').textContent = error.message;
          byId('confirmImport').disabled = false;
        }
      });
    });
  }
  async function start(snapshot, apply) {
    getSnapshot = snapshot;
    applySnapshot = apply;
    byId('exportData').addEventListener('click', () => download(pending || snapshot(), 'training-data.json'));
    byId('retrySave').addEventListener('click', () => void flush());
    byId('useDatabase').addEventListener('click', () => {
      if (confirm('First export your unsaved changes. Then load the database version? This removes the emergency browser copy.')) {
        localStorage.removeItem(pendingKey); pending=null; location.reload();
      }
    });
    byId('databaseBackup').addEventListener('click', async () => {
      if (pending || saving) { status('Wait for changes to save, or export your unsaved data first.', true); return; }
      const link = document.createElement('a'); link.href='/api/backup'; link.download='training.sqlite3'; link.click();
    });
    window.addEventListener('beforeunload', event => {
      if (pending || saving) { event.preventDefault(); event.returnValue=''; }
    });
    freeze(true);
    try {
      const current = await request('/api/state');
      token = current.token; revision = current.revision;
      let emergency;
      try { emergency = JSON.parse(localStorage.getItem(pendingKey) || 'null'); } catch {}
      if (emergency?.state) {
        applySnapshot(emergency.state);
        pending = emergency.state;
        if (emergency.revision === revision) {
          await flush();
        } else {
          blocked = true;
          status('Unsaved browser changes differ from the database. Export them before loading the database version.', true);
        }
      } else {
        applySnapshot(current.state || await migrate(snapshot()));
        freeze(false);
        status('Saved to SQLite');
      }
    } catch(error) {
      status('Cannot open the database: ' + error.message + ' Start the app launcher, then reload this page.', true);
      byId('retrySave').hidden = true;
    }
  }
  return {start, save, progress};
})();
