// Public/Js/registerAdminView.js
function renderRegisterAdminView() {
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Barbeiros/Admins • Barbearia</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <!-- Bootstrap -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <!-- Font Awesome (sem SRI para evitar bloqueio) -->
  <link rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
        referrerpolicy="no-referrer">
  <style>
    body{ background:#f8fafc; }
    .card{ border-radius:16px; }
    .table thead th { white-space:nowrap; }
    /* Centraliza ícones nos botões "Editar" e "Excluir" */
    .btn-icon,
    /* Centraliza ícones nos botões "Editar" e "Excluir" */
.btn-icon-sm {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px; height: 32px;
  padding: 0; line-height: 1;
}
.btn-icon-sm i { font-size: 0.95rem; }


    /* (opcional) tamanho do ícone dentro do botão pequeno */
    .btn-icon-sm i { font-size: 0.95rem; }

    .fa-fw { width: 1.25em; text-align: center; } /* alinha ícones */
  </style>
</head>
<body>

  <!-- HEADER -->
  <header class="bg-white border-bottom">
    <div class="container py-3 d-flex justify-content-between align-items-center">
      <div class="d-flex align-items-center gap-2">
        <img src="/img/Logo.png" alt="Barbearia" style="height:48px">
        <h5 class="mb-0 d-none d-md-block">Barbeiros / Admins</h5>
      </div>

      <!-- Ações (desktop) -->
      <div class="d-none d-md-inline-flex align-items-center gap-2">
        <a class="btn btn-outline-secondary btn-sm" href="/admin">
          <i class="fa-solid fa-gauge fa-fw me-1"></i> Painel
        </a>
        <a class="btn btn-outline-secondary btn-sm" href="/client">
          <i class="fa-regular fa-calendar-check fa-fw me-1"></i> Agendamentos públicos
        </a>
        <a class="btn btn-outline-secondary btn-sm" href="/login">
          <i class="fa-solid fa-right-to-bracket fa-fw me-1"></i> Login
        </a>
        <button id="btnLogout" class="btn btn-outline-danger btn-sm">
          <i class="fa-solid fa-arrow-right-from-bracket fa-fw me-1"></i> Sair
        </button>
      </div>

      <!-- Botão menu mobile -->
      <button class="btn btn-outline-secondary d-md-none" type="button"
              data-bs-toggle="offcanvas" data-bs-target="#mobileMenu"
              aria-controls="mobileMenu" aria-label="Abrir menu">
        ☰
      </button>
    </div>
  </header>

  <!-- OFFCANVAS MOBILE MENU -->
  <div class="offcanvas offcanvas-end" tabindex="-1" id="mobileMenu" aria-labelledby="mobileMenuLabel">
    <div class="offcanvas-header">
      <h5 class="offcanvas-title" id="mobileMenuLabel">Menu</h5>
      <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Fechar"></button>
    </div>
    <div class="offcanvas-body d-flex flex-column gap-2">
      <div class="d-flex align-items-center gap-2 mb-2">
        <img src="/img/Logo.png" alt="Barbearia" style="height:40px">
        <div class="d-flex flex-column">
          <strong>Barbearia</strong>
          <small class="text-muted">Gerenciar contas</small>
        </div>
      </div>

      <a class="btn btn-outline-secondary w-100" href="/admin">
         Home admin
      </a>
      <a class="btn btn-outline-secondary w-100" href="/admin?open=servicos">
         Cadastrar serviços
      </a>
      <a class="btn btn-outline-secondary w-100" href="/admin?open=pagamentos">
         Cadastrar forma de pagamento
      </a>
      <a class="btn btn-outline-secondary w-100" href="/admin?open=relatorios">
         Relatórios diários
      </a>

      <a class="btn btn-outline-secondary w-100" href="/admin/new">
         Admin
      </a>
      <button id="btnLogoutMobile" class="btn btn-outline-danger w-100">
         Sair
      </button>
    </div>
  </div>

  <!-- CONTEÚDO -->
  <div class="container py-4">
    <div class="row g-4">
      <div class="col-12">
        <div class="card shadow-sm">
          <div class="card-body p-4">
            <div class="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-3">
              <h6 class="mb-0">Barbeiros</h6>
              <div class="d-flex gap-2">
                <!-- Botão novo barbeiro (abre modal) -->
                <button id="btnNovo" class="btn btn-primary">
                  <i class="fa-solid fa-user-plus fa-fw me-1"></i> Novo barbeiro
                </button>
                <!-- Recarregar (ícone) -->
                <button id="btnReload" class="btn btn-outline-primary btn-icon" title="Recarregar">
                  <i class="fa-solid fa-rotate-right"></i>
                </button>
              </div>
            </div>

            <div class="table-responsive">
              <table class="table table-sm align-middle">
                <thead>
                  <tr>
                    <!--<th>#</th>-->
                    <th>Nome</th>
                    <th>E-mail</th>
                    <th style="width:140px;">Ações</th>
                  </tr>
                </thead>
                <tbody id="tbAdmins"></tbody>
              </table>
            </div>
            <div id="emptyAdmins" class="text-center text-muted small d-none">Nenhum admin cadastrado ainda.</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal: Novo Barbeiro -->
  <div class="modal fade" id="newAdminModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
      <form class="modal-content" id="formNovoAdmin" novalidate>
        <div class="modal-header">
          <h5 class="modal-title"><i class="fa-solid fa-user-plus fa-fw me-2"></i>Novo barbeiro</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
        </div>
        <div class="modal-body">
          <div class="mb-3">
            <label class="form-label">Nome</label>
            <input type="text" class="form-control" id="nome" required>
          </div>
          <div class="mb-3">
            <label class="form-label">E-mail</label>
            <input type="email" class="form-control" id="email" required>
          </div>
          <div class="mb-1">
            <label class="form-label">Senha</label>
            <input type="password" class="form-control" id="senha" required>
          </div>
          <div id="msg" class="small mt-3"></div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
          <button type="submit" class="btn btn-primary">
            <i class="fa-solid fa-floppy-disk fa-fw me-1"></i> Cadastrar
          </button>
        </div>
      </form>
    </div>
  </div>

  <!-- Modal: Editar Admin -->
  <div class="modal fade" id="editAdminModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
      <form class="modal-content" id="formEditAdmin">
        <div class="modal-header">
          <h5 class="modal-title"><i class="fa-solid fa-user-pen fa-fw me-2"></i>Editar barbeiro/admin</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
        </div>
        <div class="modal-body">
          <input type="hidden" id="editId">
          <div class="mb-3">
            <label class="form-label">Nome</label>
            <input type="text" class="form-control" id="editNome" required>
          </div>
          <div class="mb-3">
            <label class="form-label">E-mail</label>
            <input type="email" class="form-control" id="editEmail" required>
          </div>
          <div class="mb-1">
            <label class="form-label">Nova senha <span class="text-muted">(opcional)</span></label>
            <input type="password" class="form-control" id="editSenha" placeholder="Deixe em branco para manter a atual">
          </div>
          <div id="editMsg" class="small mt-2"></div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
          <button type="submit" class="btn btn-primary">
            <i class="fa-solid fa-floppy-disk fa-fw me-1"></i> Salvar
          </button>
        </div>
      </form>
    </div>
  </div>

  <!-- Modal: Confirmar Exclusão -->
  <div class="modal fade" id="confirmDeleteModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title text-danger"><i class="fa-regular fa-trash-can fa-fw me-2"></i>Excluir barbeiro/admin</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
        </div>
        <div class="modal-body">
          <input type="hidden" id="delId">
          <p class="mb-1">Tem certeza que deseja excluir este registro?</p>
          <div class="p-2 bg-light rounded">
            <div class="small text-muted">Nome</div>
            <div id="delNome" class="fw-semibold"></div>
            <div class="small text-muted mt-2">E-mail</div>
            <div id="delEmail" class="fw-semibold"></div>
          </div>
          <div id="delMsg" class="small mt-2"></div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
          <button type="button" class="btn btn-danger" id="btnConfirmDelete">
            <i class="fa-regular fa-trash-can fa-fw me-1"></i> Excluir
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Scripts -->
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script>
    const tb = document.getElementById('tbAdmins');
    const empty = document.getElementById('emptyAdmins');
    const btnReload = document.getElementById('btnReload');
    const btnNovo = document.getElementById('btnNovo');
    const msg = document.getElementById('msg');

    // Logout (desktop + mobile)
    const btnLogout = document.getElementById('btnLogout');
    const btnLogoutMobile = document.getElementById('btnLogoutMobile');
    async function doLogout(){
      try { await fetch('/logout', { method:'POST' }); } catch {}
      window.location.href = '/login';
    }
    if (btnLogout) btnLogout.addEventListener('click', doLogout);
    if (btnLogoutMobile) btnLogoutMobile.addEventListener('click', doLogout);

    // Modais
    const newModal = new bootstrap.Modal(document.getElementById('newAdminModal'));
    const editModal = new bootstrap.Modal(document.getElementById('editAdminModal'));
    const confirmModal = new bootstrap.Modal(document.getElementById('confirmDeleteModal'));

    // Campos modal editar
    const editId = document.getElementById('editId');
    const editNome = document.getElementById('editNome');
    const editEmail = document.getElementById('editEmail');
    const editSenha = document.getElementById('editSenha');
    const editMsg = document.getElementById('editMsg');

    // Campos modal excluir
    const delId = document.getElementById('delId');
    const delNome = document.getElementById('delNome');
    const delEmail = document.getElementById('delEmail');
    const delMsg = document.getElementById('delMsg');
    const btnConfirmDelete = document.getElementById('btnConfirmDelete');

    function feedback(el, ok, text) {
      el.className = 'small mt-3 ' + (ok ? 'text-success' : 'text-danger');
      el.textContent = text;
    }

    function firstName(full) {
      if (!full) return '';
      return String(full).trim().split(/\s+/)[0];
    }

    async function listarAdmins() {
      try {
        const res = await fetch('/admin/users');
        const data = await res.json();
        const list = data.users || [];
        tb.innerHTML = '';
        empty.classList.toggle('d-none', list.length > 0);

        list.forEach(u => {
          const tr = document.createElement('tr');
          tr.innerHTML = \`
          <td>\${u.primeiro_nome || firstName(u.nome)}</td>
          <td>\${u.email}</td>
          <td>
            <div class="btn-group" role="group">
              <!-- Desktop: botões com texto -->
              <button class="btn btn-outline-primary btn-sm d-none d-md-inline-flex"
                      data-action="edit" data-id="\${u.id}">
                Editar
              </button>
              <button class="btn btn-outline-danger btn-sm d-none d-md-inline-flex"
                      data-action="delete" data-id="\${u.id}">
                Excluir
              </button>

              <!-- Mobile: só ícones -->
              <button class="btn btn-outline-primary btn-icon-sm d-inline-flex d-md-none mx-2"
                      title="Editar" data-action="edit" data-id="\${u.id}">
                <i class="fa-regular fa-pen-to-square"></i>
              </button>
              <button class="btn btn-outline-danger btn-icon-sm d-inline-flex d-md-none"
                      title="Excluir" data-action="delete" data-id="\${u.id}">
                <i class="fa-regular fa-trash-can"></i>
              </button>
            </div>
          </td>
        \`;

          tr.addEventListener('click', (ev) => {
            const btn = ev.target.closest('button');
            if (!btn) return;
            const action = btn.getAttribute('data-action');
            if (action === 'edit') {
              abrirModalEditar(u);
            } else if (action === 'delete') {
              abrirModalExcluir(u);
            }
          });

          tb.appendChild(tr);
        });
      } catch {
        tb.innerHTML = '';
        empty.classList.remove('d-none');
      }
    }

    // Abrir modal "Novo barbeiro"
    btnNovo.addEventListener('click', () => {
      document.getElementById('formNovoAdmin').reset();
      feedback(msg, true, ''); // limpa msg
      newModal.show();
    });

    // Cadastro novo (modal)
    document.getElementById('formNovoAdmin').addEventListener('submit', async (e) => {
      e.preventDefault();
      feedback(msg, true, '');
      const nome = document.getElementById('nome').value.trim();
      const email = document.getElementById('email').value.trim();
      const senha = document.getElementById('senha').value;

      try {
        const res = await fetch('/admin/new', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ nome, email, senha })
        });
        const data = await res.json();
        if (data.ok) {
          feedback(msg, true, 'Cadastro realizado!');
          await listarAdmins();
          setTimeout(() => newModal.hide(), 400);
        } else {
          feedback(msg, false, data.message || 'Falha ao cadastrar.');
        }
      } catch (err) {
        feedback(msg, false, 'Erro inesperado.');
      }
    });

    // Abrir modal editar com dados
    function abrirModalEditar(u) {
      editId.value = u.id;
      editNome.value = u.nome || '';
      editEmail.value = u.email || '';
      editSenha.value = '';
      editMsg.textContent = '';
      editMsg.className = 'small mt-2';
      editModal.show();
    }

    // Salvar edição
    document.getElementById('formEditAdmin').addEventListener('submit', async (e) => {
      e.preventDefault();
      editMsg.textContent = '';
      const id = Number(editId.value);
      const nome = editNome.value.trim();
      const email = editEmail.value.trim();
      const senha = editSenha.value; // opcional

      if (!nome || !email) {
        editMsg.className = 'small mt-2 text-danger';
        editMsg.textContent = 'Preencha nome e e-mail.';
        return;
      }

      try {
        const res = await fetch('/admin/users/' + id, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome, email, senha })
        });
        const d = await res.json();
        if (!d.ok) {
          editMsg.className = 'small mt-2 text-danger';
          editMsg.textContent = d.message || 'Falha ao atualizar.';
          return;
        }
        editMsg.className = 'small mt-2 text-success';
        editMsg.textContent = 'Atualizado com sucesso!';
        await listarAdmins();
        setTimeout(() => editModal.hide(), 500);
      } catch {
        editMsg.className = 'small mt-2 text-danger';
        editMsg.textContent = 'Erro ao atualizar.';
      }
    });

    // Abrir modal excluir
    function abrirModalExcluir(u) {
      document.getElementById('delId').value = u.id;
      document.getElementById('delNome').textContent = u.nome || '';
      document.getElementById('delEmail').textContent = u.email || '';
      document.getElementById('delMsg').textContent = '';
      document.getElementById('delMsg').className = 'small mt-2';
      confirmModal.show();
    }

    // Confirmar exclusão
    btnConfirmDelete.addEventListener('click', async () => {
      const delMsg = document.getElementById('delMsg');
      delMsg.textContent = '';
      const id = Number(document.getElementById('delId').value);
      try {
        const res = await fetch('/admin/users/' + id, { method: 'DELETE' });
        const d = await res.json();
        if (!d.ok) {
          delMsg.className = 'small mt-2 text-danger';
          delMsg.textContent = d.message || 'Falha ao excluir.';
          return;
        }
        delMsg.className = 'small mt-2 text-success';
        delMsg.textContent = 'Excluído com sucesso!';
        await listarAdmins();
        setTimeout(() => confirmModal.hide(), 400);
      } catch {
        delMsg.className = 'small mt-2 text-danger';
        delMsg.textContent = 'Erro ao excluir.';
      }
    });

    // Recarregar lista
    btnReload.addEventListener('click', listarAdmins);

    // inicial
    (async function init(){
      await listarAdmins();
    })();
  </script>
</body>
</html>`;
}

module.exports = { renderRegisterAdminView };
