// dashboard.js — Lógica completa del panel de gestión de tags

document.addEventListener('DOMContentLoaded', () => {
  // ── Auth guard ───────────────────────────────────────────────────
  const token = SafeTagAuth.requireAuth();
  if (!token) return;

  const user = SafeTagAuth.getUser();

  // ── DOM Elements ─────────────────────────────────────────────────
  const tagsContainer = document.getElementById('tags-container');
  const statTotal = document.getElementById('stat-total');
  const statActive = document.getElementById('stat-active');
  const statScans = document.getElementById('stat-scans');
  const userAvatar = document.getElementById('user-avatar');
  const userName = document.getElementById('user-name');
  const userEmail = document.getElementById('user-email');
  const btnLogout = document.getElementById('btn-logout');
  const btnNewTag = document.getElementById('btn-new-tag');

  // Modal Tag
  const modalTag = document.getElementById('modal-tag');
  const modalTitle = document.getElementById('modal-title');
  const modalClose = document.getElementById('modal-close');
  const tagForm = document.getElementById('tag-form');
  const btnSaveTag = document.getElementById('btn-save-tag');
  const tagEditId = document.getElementById('tag-edit-id');
  const modalAlertError = document.getElementById('modal-alert-error');
  const modalErrorMsg = document.getElementById('modal-error-msg');
  const modalAlertSuccess = document.getElementById('modal-alert-success');
  const modalSuccessMsg = document.getElementById('modal-success-msg');

  // Modal Scans
  const modalScans = document.getElementById('modal-scans');
  const modalScansClose = document.getElementById('modal-scans-close');
  const scansContent = document.getElementById('scans-content');

  // ── User info ────────────────────────────────────────────────────
  if (user) {
    userAvatar.textContent = user.nombre ? user.nombre.charAt(0).toUpperCase() : '?';
    userName.textContent = user.nombre;
    userEmail.textContent = user.email;
  }

  // ── Load tags ────────────────────────────────────────────────────
  let allTags = [];

  async function loadTags() {
    try {
      const res = await SafeTagAuth.apiRequest('/api/tags');
      if (!res) return;
      const data = await res.json();
      allTags = data.tags || [];
      renderTags(allTags);
      updateStats(allTags);
    } catch (err) {
      tagsContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">⚠️</div>
          <h3>Error al cargar</h3>
          <p>No se pudieron obtener tus tags. Verifica la conexión con el servidor.</p>
          <button class="btn btn-primary" onclick="location.reload()">Reintentar</button>
        </div>`;
    }
  }

  function updateStats(tags) {
    statTotal.textContent = tags.length;
    statActive.textContent = tags.filter(t => t.activo).length;
    statScans.textContent = tags.reduce((sum, t) => sum + (t.total_scans || 0), 0);
  }

  function renderTags(tags) {
    if (tags.length === 0) {
      tagsContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🏷️</div>
          <h3>Sin tags registrados</h3>
          <p>Agrega tu primer chip NFC para empezar a proteger tu equipaje.</p>
          <button class="btn btn-primary" id="empty-new-tag">+ Agregar mi primer tag</button>
        </div>`;
      document.getElementById('empty-new-tag')?.addEventListener('click', () => openCreateModal());
      return;
    }

    tagsContainer.innerHTML = `<div class="tags-grid">${tags.map(renderTagCard).join('')}</div>`;

    // Attach events
    tags.forEach(tag => {
      document.getElementById(`btn-edit-${tag.id}`)?.addEventListener('click', () => openEditModal(tag));
      document.getElementById(`btn-toggle-${tag.id}`)?.addEventListener('click', () => toggleTag(tag));
      document.getElementById(`btn-delete-${tag.id}`)?.addEventListener('click', () => deleteTag(tag));
      document.getElementById(`btn-scans-${tag.id}`)?.addEventListener('click', () => openScansModal(tag.id));
      document.getElementById(`tag-link-${tag.id}`)?.addEventListener('click', () => copyTagLink(tag.id));
    });
  }

  function renderTagCard(tag) {
    const lastScan = tag.ultimo_escaneo
      ? new Date(tag.ultimo_escaneo).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
      : 'Nunca';

    const tagUrl = `${window.location.origin}/tag/${tag.id}`;

    return `
      <div class="tag-card ${!tag.activo ? 'inactive' : ''}" id="tag-card-${tag.id}">
        <div class="tag-card-header">
          <div>
            <div class="tag-id-display">ID: ${escapeHtml(tag.id)}</div>
            <div class="tag-name" style="margin-top:8px">${escapeHtml(tag.nombre_tag)}</div>
            <div class="tag-owner">👤 ${escapeHtml(tag.nombre_dueno)}</div>
          </div>
          <div>
            <span class="badge ${tag.activo ? 'badge-active' : 'badge-inactive'}">
              <span class="badge-dot"></span>
              ${tag.activo ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>

        <div class="tag-link-box" id="tag-link-${tag.id}" title="Clic para copiar enlace">
          🔗 ${tagUrl}
        </div>

        <div class="tag-stats">
          <div class="tag-stat">
            <div class="tag-stat-value">${tag.total_scans || 0}</div>
            <div class="tag-stat-label">Escaneos</div>
          </div>
          <div class="tag-stat">
            <div class="tag-stat-value" style="font-size:0.85rem">${lastScan}</div>
            <div class="tag-stat-label">Último escaneo</div>
          </div>
        </div>

        <div class="tag-actions">
          <button class="btn btn-secondary btn-sm" id="btn-scans-${tag.id}">📊 Historial</button>
          <button class="btn btn-secondary btn-sm" id="btn-edit-${tag.id}">✏️ Editar</button>
          <button class="btn btn-secondary btn-sm" id="btn-toggle-${tag.id}">
            ${tag.activo ? '⏸️ Desactivar' : '▶️ Activar'}
          </button>
          <button class="btn btn-danger btn-sm" id="btn-delete-${tag.id}">🗑️</button>
        </div>
      </div>
    `;
  }

  // ── Copy tag link ────────────────────────────────────────────────
  function copyTagLink(tagId) {
    const tagUrl = `${window.location.origin}/tag/${tagId}`;
    navigator.clipboard.writeText(tagUrl).then(() => {
      showToast('¡Enlace copiado al portapapeles!');
    });
  }

  // ── Toast notification ───────────────────────────────────────────
  function showToast(msg) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed; bottom: 24px; right: 24px;
      background: rgba(0, 212, 170, 0.15); border: 1px solid rgba(0,212,170,0.3);
      color: #00d4aa; padding: 14px 20px; border-radius: 12px;
      font-size: 0.88rem; font-weight: 500; z-index: 9999;
      animation: fadeInUp 0.3s ease; backdrop-filter: blur(12px);
    `;
    toast.textContent = `✅ ${msg}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  }

  // ── Modal Tag ─────────────────────────────────────────────────────
  function openCreateModal() {
    tagEditId.value = '';
    tagForm.reset();
    document.getElementById('tag-id').disabled = false;
    modalTitle.textContent = '➕ Nuevo Tag NFC';
    btnSaveTag.textContent = 'Guardar Tag';
    clearModalAlerts();
    modalTag.classList.add('open');
  }

  function openEditModal(tag) {
    tagEditId.value = tag.id;
    document.getElementById('tag-id').value = tag.id;
    document.getElementById('tag-id').disabled = true;
    document.getElementById('tag-nombre').value = tag.nombre_tag;
    document.getElementById('tag-dueno').value = tag.nombre_dueno;
    document.getElementById('tag-telefono').value = tag.telefono;
    document.getElementById('tag-email').value = tag.email;
    document.getElementById('tag-mensaje').value = tag.mensaje || '';
    modalTitle.textContent = '✏️ Editar Tag';
    btnSaveTag.textContent = 'Guardar cambios';
    clearModalAlerts();
    modalTag.classList.add('open');
  }

  function closeTagModal() {
    modalTag.classList.remove('open');
    tagForm.reset();
    tagEditId.value = '';
    document.getElementById('tag-id').disabled = false;
  }

  function clearModalAlerts() {
    modalAlertError.classList.remove('show');
    modalAlertSuccess.classList.remove('show');
  }

  function showModalError(msg) {
    modalAlertError.classList.add('show');
    modalErrorMsg.textContent = msg;
    modalAlertSuccess.classList.remove('show');
  }
  function showModalSuccess(msg) {
    modalAlertSuccess.classList.add('show');
    modalSuccessMsg.textContent = msg;
    modalAlertError.classList.remove('show');
  }

  // ── Save tag ──────────────────────────────────────────────────────
  tagForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const editingId = tagEditId.value;
    const isEditing = !!editingId;

    const body = {
      id: document.getElementById('tag-id').value.trim(),
      nombre_tag: document.getElementById('tag-nombre').value.trim(),
      nombre_dueno: document.getElementById('tag-dueno').value.trim(),
      telefono: document.getElementById('tag-telefono').value.trim(),
      email: document.getElementById('tag-email').value.trim(),
      mensaje: document.getElementById('tag-mensaje').value.trim()
    };

    if (!body.nombre_tag || !body.nombre_dueno || !body.telefono || !body.email) {
      return showModalError('Por favor completa todos los campos requeridos.');
    }
    if (!isEditing && !body.id) {
      return showModalError('El ID del chip es obligatorio.');
    }

    btnSaveTag.disabled = true;
    btnSaveTag.innerHTML = '<div class="spinner"></div> Guardando...';

    try {
      const endpoint = isEditing ? `/api/tags/${editingId}` : '/api/tags';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await SafeTagAuth.apiRequest(endpoint, {
        method,
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!res.ok) {
        showModalError(data.error || 'Error al guardar el tag.');
        btnSaveTag.disabled = false;
        btnSaveTag.textContent = isEditing ? 'Guardar cambios' : 'Guardar Tag';
        return;
      }

      showModalSuccess(isEditing ? '¡Tag actualizado!' : '¡Tag registrado exitosamente!');
      setTimeout(() => {
        closeTagModal();
        loadTags();
      }, 1000);
    } catch {
      showModalError('Error de conexión.');
      btnSaveTag.disabled = false;
      btnSaveTag.textContent = isEditing ? 'Guardar cambios' : 'Guardar Tag';
    } finally {
      if (!modalAlertError.classList.contains('show')) {
        btnSaveTag.disabled = false;
        btnSaveTag.textContent = isEditing ? 'Guardar cambios' : 'Guardar Tag';
      }
    }
  });

  // ── Toggle active ─────────────────────────────────────────────────
  async function toggleTag(tag) {
    try {
      const res = await SafeTagAuth.apiRequest(`/api/tags/${tag.id}`, {
        method: 'PUT',
        body: JSON.stringify({ activo: !tag.activo })
      });
      if (res?.ok) {
        showToast(tag.activo ? 'Tag desactivado' : 'Tag activado');
        loadTags();
      }
    } catch {
      showToast('Error al cambiar estado del tag');
    }
  }

  // ── Delete tag ────────────────────────────────────────────────────
  async function deleteTag(tag) {
    if (!confirm(`¿Eliminar el tag "${tag.nombre_tag}"? Esta acción no se puede deshacer.`)) return;

    try {
      const res = await SafeTagAuth.apiRequest(`/api/tags/${tag.id}`, { method: 'DELETE' });
      if (res?.ok) {
        showToast('Tag eliminado');
        loadTags();
      }
    } catch {
      showToast('Error al eliminar el tag');
    }
  }

  // ── Scans modal ───────────────────────────────────────────────────
  async function openScansModal(tagId) {
    scansContent.innerHTML = `<div class="empty-state" style="padding:40px"><div class="spinner" style="margin:0 auto;width:32px;height:32px;border-width:3px"></div></div>`;
    modalScans.classList.add('open');

    try {
      const res = await SafeTagAuth.apiRequest(`/api/tags/${tagId}/scans`);
      const data = await res.json();

      if (!res.ok || !data.scans?.length) {
        scansContent.innerHTML = `
          <div class="empty-state" style="padding:40px">
            <div class="empty-state-icon" style="font-size:2.5rem">📡</div>
            <h3>Sin escaneos aún</h3>
            <p>Este tag no ha sido escaneado todavía.</p>
          </div>`;
        return;
      }

      scansContent.innerHTML = `
        <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:16px">
          ${data.total} escaneo${data.total !== 1 ? 's' : ''} registrado${data.total !== 1 ? 's' : ''}
        </p>
        <div style="overflow-x:auto">
          <table class="scans-table">
            <thead>
              <tr>
                <th>Fecha y hora</th>
                <th>País</th>
                <th>Ciudad</th>
                <th>Dispositivo</th>
              </tr>
            </thead>
            <tbody>
              ${data.scans.map(scan => `
                <tr>
                  <td>${new Date(scan.scanned_at).toLocaleString('es-ES')}</td>
                  <td>${escapeHtml(scan.pais || 'Desconocido')}</td>
                  <td>${escapeHtml(scan.ciudad || 'Desconocida')}</td>
                  <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${escapeHtml(scan.user_agent)}">
                    ${getDeviceIcon(scan.user_agent)} ${getDeviceName(scan.user_agent)}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch {
      scansContent.innerHTML = `<div class="empty-state" style="padding:40px"><p>Error al cargar el historial.</p></div>`;
    }
  }

  function getDeviceIcon(ua) {
    if (!ua) return '❓';
    if (/iPhone|iPad|iOS/i.test(ua)) return '🍎';
    if (/Android/i.test(ua)) return '🤖';
    if (/Windows/i.test(ua)) return '🪟';
    if (/Mac/i.test(ua)) return '🍎';
    if (/Linux/i.test(ua)) return '🐧';
    return '🌐';
  }

  function getDeviceName(ua) {
    if (!ua) return 'Desconocido';
    if (/iPhone/i.test(ua)) return 'iPhone';
    if (/iPad/i.test(ua)) return 'iPad';
    if (/Android/i.test(ua)) {
      const m = ua.match(/Android.*?;\s*(.+?)\s*Build/);
      return m ? m[1] : 'Android';
    }
    if (/Chrome/i.test(ua)) return 'Chrome';
    if (/Safari/i.test(ua)) return 'Safari';
    if (/Firefox/i.test(ua)) return 'Firefox';
    return 'Navegador';
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str || ''));
    return div.innerHTML;
  }

  // ── Events ────────────────────────────────────────────────────────
  btnLogout?.addEventListener('click', SafeTagAuth.logout);
  btnNewTag?.addEventListener('click', openCreateModal);
  modalClose?.addEventListener('click', closeTagModal);
  modalScansClose?.addEventListener('click', () => modalScans.classList.remove('open'));

  // Close modals on backdrop click
  modalTag.addEventListener('click', (e) => { if (e.target === modalTag) closeTagModal(); });
  modalScans.addEventListener('click', (e) => { if (e.target === modalScans) modalScans.classList.remove('open'); });

  // ESC to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeTagModal();
      modalScans.classList.remove('open');
    }
  });

  // ── Init ──────────────────────────────────────────────────────────
  loadTags();
});
