// Public/Js/adminView.js
function renderAdminView({ user = { nome: "Administrador", fotoUrl: "" } } = {}) {
  const avatar = user.fotoUrl
    ? `<img src="${user.fotoUrl}" alt="${user.nome}" class="w-10 h-10 rounded-full object-cover" />`
    : `<div class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
         style="width:40px;height:40px;font-weight:700;">
         ${String(user.nome || "A").trim().charAt(0).toUpperCase()}
       </div>`;

  const hoje = new Date();
  const yyyy = hoje.getFullYear();
  const mm = String(hoje.getMonth() + 1).padStart(2, "0");
  const dd = String(hoje.getDate()).padStart(2, "0");
  const hojeISO = `${yyyy}-${mm}-${dd}`;

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Admin • Barbearia</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" referrerpolicy="no-referrer" />
  <style>
    body { background:#f8fafc; }
    .slot-btn { min-width: 160px; }
    .avatar-wrap { width:40px; height:40px; }
    .table thead th { white-space: nowrap; }
    .slot-card .badge { text-transform: none; }
  </style>
</head>
<body>
  <!-- HEADER -->
  <header class="bg-white border-bottom">
    <div class="container py-3 d-flex justify-content-between align-items-center">
      <div class="d-flex align-items-center gap-3">
        ${avatar}
        <div class="d-flex flex-column">
          <strong>${user.nome || "Administrador"}</strong>
        </div>
      </div>

      <!-- Ações (desktop) -->
      <div class="d-none d-md-inline-flex align-items-center gap-2">
        <div class="border rounded p-2 d-flex align-items-center justify-content-between">
          <div class="small text-muted">Status da barbearia</div>
          <div class="form-check form-switch m-0">
            <input class="form-check-input" type="checkbox" id="chkLojaAbertaMobile">
          </div>
        </div>

        <button class="btn btn-outline-secondary btn-sm" data-bs-toggle="modal" data-bs-target="#servicoModal">
          Cadastrar serviços
        </button>
        <button class="btn btn-outline-secondary btn-sm" data-bs-toggle="modal" data-bs-target="#pagamentoModal">
          Cadastrar forma de pagamento
        </button>
        <button class="btn btn-outline-secondary btn-sm" data-bs-toggle="modal" data-bs-target="#relatoriosModal">
          Relatórios diários
        </button>
        <a href="/admin/new" id="btnRegister" class="btn btn-outline-secondary btn-sm">Admin</a>
        <button id="btnLogout" class="btn btn-outline-danger btn-sm">Sair</button>
      </div>

      <!-- Botão menu mobile -->
      <button class="btn btn-outline-secondary d-md-none" type="button" data-bs-toggle="offcanvas" data-bs-target="#adminMobileMenu" aria-controls="adminMobileMenu" aria-label="Abrir menu">
        ☰
      </button>
    </div>
  </header>

  <!-- OFFCANVAS MOBILE MENU -->
  <div class="offcanvas offcanvas-end" tabindex="-1" id="adminMobileMenu" aria-labelledby="adminMobileMenuLabel">
    <div class="offcanvas-header">
      <h5 class="offcanvas-title" id="adminMobileMenuLabel">Menu</h5>
      <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Fechar"></button>
    </div>
    <div class="offcanvas-body d-flex flex-column gap-2">
      <div class="d-flex align-items-center gap-2 mb-2">
        ${avatar}
        <div class="d-flex flex-column">
          <strong>${user.nome || "Administrador"}</strong>
          <small class="text-muted">Painel do administrador</small>
        </div>
      </div>
      <!-- Toggle: Barbearia aberta -->
      <div class="form-check form-switch me-2">
        <input class="form-check-input" type="checkbox" id="chkLojaAberta">
        <label class="form-check-label" for="chkLojaAberta">Abrir barbearia</label>
      </div>
      <button class="btn btn-outline-secondary w-100" data-bs-toggle="modal" data-bs-target="#servicoModal" data-bs-dismiss="offcanvas">
        Cadastrar serviços
      </button>
      <button class="btn btn-outline-secondary w-100" data-bs-toggle="modal" data-bs-target="#pagamentoModal" data-bs-dismiss="offcanvas">
        Cadastrar forma de pagamento
      </button>
      <button class="btn btn-outline-secondary w-100" data-bs-toggle="modal" data-bs-target="#relatoriosModal" data-bs-dismiss="offcanvas">
        Relatórios diários
      </button>
      <a href="/admin/new" id="btnRegisterMobile" class="btn btn-outline-secondary w-100">
        Admin
      </a>
      <button id="btnLogoutMobile" class="btn btn-outline-danger w-100">
        Sair
      </button>
    </div>
  </div>

  <main class="container my-4">
    <div class="card shadow-sm">
      <div class="card-body">
        <div class="row g-3 align-items-end">
          <div class="col-12 col-md-4">
            <label class="form-label">Data selecionada</label>
            <input type="date" id="dataSelecionada" class="form-control" value="${hojeISO}">
          </div>
          <div class="col-12 col-md-3">
            <label class="form-label d-block"> </label>
            <button id="btnCarregar" class="btn btn-primary w-100">Carregar horários</button>
          </div>
          <div class="col-12 col-md-5 text-md-end">
            <label class="form-label d-block">Hoje</label>
            <div id="dataHoje" class="text-muted"></div>
          </div>
        </div>

        <hr class="my-4">

        <div class="d-flex justify-content-between align-items-center mb-2">
          <h5 class="mb-0">Horários (10:00 às 20:00)</h5>
          <div>
            <!--span class="badge text-bg-success">Disponível</span-->
            <!--<span class="badge text-bg-secondary">Indisponível</span>-->
          </div>
        </div>

        <!-- Lista de cards (mobile) -->
        <div id="cardsSlots" class="d-md-none d-grid gap-3"></div>

        <!-- Tabela (desktop e tablets ≥ md) -->
        <div class="table-responsive d-none d-md-block">
          <table class="table align-middle" id="tabelaSlots">
            <thead>
              <tr>
                <th>Hora</th>
                <th>Status</th>
                <th>Cliente</th>
                <th>Barbeiro</th>
                <th>Forma</th>
                <th>Presença</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody id="tbodySlots"></tbody>
          </table>
        </div>
      </div>
    </div>
  </main>

  <!-- Modal: Cadastro de Serviço -->
  <div class="modal fade" id="servicoModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-lg">
      <form id="formServico" class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Serviços</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
        </div>
        <div class="modal-body">
          <div class="row g-3">
            <div class="col-12 col-md-6">
              <label class="form-label">Serviço</label>
              <input type="text" id="servicoNome" class="form-control" placeholder="Corte, Barba..." required>
            </div>
            <div class="col-12 col-md-3">
              <label class="form-label">Preço (R$)</label>
              <input type="number" id="servicoPreco" class="form-control" min="0" step="0.01" placeholder="Ex.: 35.00" required>
            </div>
            <div class="col-12 col-md-2 d-flex align-items-end">
              <button type="submit" class="btn btn-primary w-100">Cadastrar</button>
            </div>
          </div>
          <div id="servicoFeedback" class="small text-muted mt-2"></div>

          <hr class="my-4">
          <h6 class="mb-2">Lista de serviços</h6>
          <div class="table-responsive">
            <table class="table table-sm align-middle">
              <thead>
                <tr>
                  <th>Nome</th><th>Preço (R$)</th><th style="width:160px;">Ações</th>
                </tr>
              </thead>
              <tbody id="tbServicos"></tbody>
            </table>
          </div>
        </div>
      </form>
    </div>
  </div>

  <!-- Modal: Cadastro de Forma de Pagamento -->
  <div class="modal fade" id="pagamentoModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-lg">
      <form id="formPagamento" class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Formas de pagamento</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
        </div>
        <div class="modal-body">
          <div class="row g-3">
            <div class="col-12 col-md-6">
              <label class="form-label">Forma de pagamento</label>
              <input type="text" id="pagNome" class="form-control" placeholder="Dinheiro, Pix, Cartão..." required>
            </div>
            <div class="col-12 col-md-2">
              <label class="form-label">Taxa (%)</label>
              <input type="number" id="pagTaxa" class="form-control" min="0" step="0.01" placeholder="Ex.: 0, 1.99">
            </div>
            <div class="col-12 col-md-3 d-flex align-items-end">
              <button type="submit" class="btn btn-primary w-100">Cadastrar</button>
            </div>
          </div>
          <div id="pagamentoFeedback" class="small text-muted mt-2"></div>

          <hr class="my-4">
          <h6 class="mb-2">Lista de formas</h6>
          <div class="table-responsive">
            <table class="table table-sm align-middle">
              <thead>
                <tr>
                  <th>Nome</th><th>Taxa (%)</th><th style="width:160px;">Ações</th>
                </tr>
              </thead>
              <tbody id="tbFormas"></tbody>
            </table>
          </div>
        </div>
      </form>
    </div>
  </div>

  <!-- Modal: Relatórios Diários -->
  <div class="modal fade" id="relatoriosModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Relatórios diários</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
        </div>
        <div class="modal-body">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <div class="text-muted small">Mostrando últimos 30 dias (inclui hoje)</div>
            <div>
              <button id="btnRefreshReports" class="btn btn-sm btn-outline-primary">Atualizar</button>
            </div>
          </div>

          <div id="reportsContainer" class="row g-3"></div>

          <div id="reportsEmpty" class="text-center py-4 d-none">
            <p class="mb-0 text-muted">Sem dados para exibir.</p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal: Detalhe do Relatório do Dia -->
<div class="modal fade" id="relatorioDetalheModal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-xl">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">
          Detalhes do dia
          <small class="text-muted d-block fs-6" id="relDetTitulo"></small>
        </h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
      </div>
      <div class="modal-body">
        <!-- Tabela desktop -->
        <div class="table-responsive d-none d-md-block">
          <table class="table table-sm align-middle">
            <thead>
              <tr>
                <th>Hora</th>
                <th>Cliente</th>
                <th>Serviço</th>
                <th>Barbeiro</th>
                <th>Presença</th>
                <th class="text-end">Valor</th>
                <th style="width:170px;">Ações</th>
              </tr>
            </thead>
            <tbody id="relDetTbody"></tbody>
          </table>
        </div>

        <!-- Cards mobile -->
        <div id="relDetCards" class="d-md-none d-grid gap-2"></div>

        <div id="relDetEmpty" class="text-center py-4 d-none">
          <p class="text-muted mb-0">Nenhum atendimento marcado como “presente” neste dia.</p>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Modal: Editar atendimento -->
<div class="modal fade" id="editarAtendimentoModal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog">
    <form id="formEditarAtendimento" class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Corrigir atendimento</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
      </div>
      <div class="modal-body">
        <input type="hidden" id="editAgId">
        <div class="mb-2">
          <label class="form-label">Cliente</label>
          <input type="text" id="editCliente" class="form-control" readonly>
        </div>
        <div class="mb-2">
          <label class="form-label">Serviço</label>
          <input type="text" id="editServico" class="form-control" readonly>
        </div>
        <div class="row g-2">
          <div class="col-6">
            <label class="form-label">Presença</label>
            <select id="editPresenca" class="form-select">
              <option value="">—</option>
              <option value="presente">Presente</option>
              <option value="falta">Falta</option>
            </select>
          </div>
          <div class="col-6">
            <label class="form-label">Valor (R$)</label>
            <input type="number" id="editValor" class="form-control" min="0" step="0.01">
          </div>
        </div>
      </div>
      <div class="modal-footer justify-content-between">
        <button type="button" id="btnExcluirAt" class="btn btn-outline-danger">
          Excluir atendimento
        </button>
        <button type="submit" class="btn btn-primary">Salvar alterações</button>
      </div>
    </form>
  </div>
</div>



  <script src="/socket.io/socket.io.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script>
    const socket = io();
    const dataInput = document.getElementById('dataSelecionada');
    const btnCarregar = document.getElementById('btnCarregar');
    const dataHoje = document.getElementById('dataHoje');

    const tbody = document.getElementById('tbodySlots');
    const cardsSlots = document.getElementById('cardsSlots');

    const modalServ = document.getElementById('servicoModal');
    const modalPag  = document.getElementById('pagamentoModal');

    // ==== Helpers de data ====
    function pad(n){ return String(n).padStart(2,'0'); }
    function toISODate(val) {
      if (!val && val !== 0) return '';
      if (val instanceof Date) {
        return \`\${val.getFullYear()}-\${pad(val.getMonth()+1)}-\${pad(val.getDate())}\`;
      }
      const s = String(val);
      const m = s.match(/^(\\d{4})-(\\d{2})-(\\d{2})/);
      if (m) return \`\${m[1]}-\${m[2]}-\${m[3]}\`;
      const d = new Date(s);
      if (!isNaN(d)) return \`\${d.getFullYear()}-\${pad(d.getMonth()+1)}-\${pad(d.getDate())}\`;
      return '';
    }
    function toBRDate(val) {
      const iso = toISODate(val);
      if (!iso) return '—';
      const [y,m,d] = iso.split('-').map(Number);
      const dt = new Date(y, m-1, d);
      if (isNaN(dt)) return '—';
      return dt.toLocaleDateString('pt-BR', { weekday:'long', day:'2-digit', month:'long', year:'numeric' });
    }
    function formatarDataHumana(dStr) { return toBRDate(dStr); }

    // ========== Render: Tabela (desktop) + Cards (mobile) ==========
    function desenharTabela(payload) {
      tbody.innerHTML = '';
      cardsSlots.innerHTML = '';

      const slots = payload.slots || [];

      slots.forEach(slot => {
        // ------- TABELA (≥ md) -------
        const tr = document.createElement('tr');

        const tdHora = document.createElement('td');
        tdHora.textContent = slot.hora;
        tr.appendChild(tdHora);

        const tdStatus = document.createElement('td');
        tdStatus.innerHTML = slot.disponivel
          ? '<span class="badge text-bg-success">Livre</span>'
          : '<span class="badge text-bg-secondary">Ocupado</span>';
        tr.appendChild(tdStatus);

        const tdCliente = document.createElement('td');
        tdCliente.textContent = slot.clienteNome || '-';
        tr.appendChild(tdCliente);

        const tdBarbeiro = document.createElement('td');
        tdBarbeiro.textContent = slot.barbeiroNome || '-';
        tr.appendChild(tdBarbeiro);

        const tdForma = document.createElement('td');
        tdForma.textContent = slot.formaNome || '-';
        tr.appendChild(tdForma);


        const tdPres = document.createElement('td');
        if (slot.agendamentoId) {
          const select = document.createElement('select');
          select.className = 'form-select form-select-sm';
          select.innerHTML = \`
            <option value="" \${!slot.presenca ? 'selected' : ''}>—</option>
            <option value="presente" \${slot.presenca === 'presente' ? 'selected' : ''}>Presente</option>
            <option value="falta" \${slot.presenca === 'falta' ? 'selected' : ''}>Falta</option>
          \`;
          select.addEventListener('change', () => {
            const val = select.value || null;
            if (val) socket.emit('admin/setPresence', { agendamentoId: slot.agendamentoId, presenca: val, dataISO: dataInput.value });
          });
          tdPres.appendChild(select);
        } else {
          tdPres.innerHTML = '<span class="text-muted">—</span>';
        }
        tr.appendChild(tdPres);

        const tdAcao = document.createElement('td');
        const btn = document.createElement('button');
        btn.className = 'btn btn-sm ' + (slot.disponivel ? 'btn-outline-danger' : 'btn-outline-success') + ' slot-btn';
        btn.textContent = slot.disponivel ? 'Ocupar' : 'Liberar';
        btn.addEventListener('click', () => {
          const novoValor = !slot.disponivel;
          socket.emit('admin/toggleSlot', { dataISO: dataInput.value, hora: slot.hora, disponivel: novoValor });
        });
        tdAcao.appendChild(btn);
        tr.appendChild(tdAcao);

        tbody.appendChild(tr);

        // ------- CARDS (mobile) -------
        const card = document.createElement('div');
        card.className = 'card slot-card shadow-sm';

        const statusBadge = slot.disponivel
          ? '<span class="badge text-bg-success">Livre</span>'
          : '<span class="badge text-bg-secondary">Ocupado</span>';

        const headerHTML = \`
          <div class="d-flex justify-content-between align-items-center">
            <span class="fs-6 fw-semibold">\${slot.hora}</span>
            \${statusBadge}
          </div>
        \`;

        const bodyTop = document.createElement('div');
        bodyTop.className = 'row g-2 mt-2';
        bodyTop.innerHTML = \`
          <!-- Cliente -->
          <div class="col-12">
            <div class="d-flex align-items-center gap-1">
              <i class="fa-solid fa-user text-muted fa-fw"></i>
              <span class="text-muted small">Cliente:</span>
              <span class="fw-semibold ms-1 flex-grow-1">\${slot.clienteNome || '-'}</span>
            </div>
          </div>

          <!-- Barbeiro -->
          <div class="col-12">
            <div class="d-flex align-items-center gap-1">
              <i class="fa-solid fa-user-tie text-muted fa-fw"></i>
              <span class="text-muted small">Barbeiro:</span>
              <span class="fw-semibold ms-1 flex-grow-1">\${slot.barbeiroNome || '-'}</span>
            </div>
          </div>

          <!-- Forma de pagamento -->
          <div class="col-12">
            <div class="d-flex align-items-center gap-1">
              <i class="fa-solid fa-money-bill-wave text-muted fa-fw"></i>
              <span class="text-muted small">Pagamento:</span>
              <span class="fw-semibold ms-1 flex-grow-1">\${slot.formaNome || '-'}</span>
            </div>
          </div>
        \`;


        const presWrap = document.createElement('div');
        presWrap.className = 'mt-3';
        if (slot.agendamentoId) {
          presWrap.innerHTML = '<div class="text-muted small mb-1">Presença</div>';
          const select = document.createElement('select');
          select.className = 'form-select form-select-sm';
          select.innerHTML = \`
            <option value="" \${!slot.presenca ? 'selected' : ''}>—</option>
            <option value="presente" \${slot.presenca === 'presente' ? 'selected' : ''}>Presente</option>
            <option value="falta" \${slot.presenca === 'falta' ? 'selected' : ''}>Falta</option>
          \`;
          select.addEventListener('change', () => {
            const val = select.value || null;
            if (val) socket.emit('admin/setPresence', { agendamentoId: slot.agendamentoId, presenca: val, dataISO: dataInput.value });
          });
          presWrap.appendChild(select);
        } else {
          presWrap.innerHTML = '<div class="text-muted small">Presença</div><div class="text-muted">—</div>';
        }

        const actionWrap = document.createElement('div');
        actionWrap.className = 'mt-3 d-grid';
        const actBtn = document.createElement('button');
        actBtn.className = 'btn ' + (slot.disponivel ? 'btn-outline-danger' : 'btn-outline-success');
        actBtn.textContent = slot.disponivel ? 'Ocupar' : 'Liberar';
        actBtn.addEventListener('click', () => {
          const novoValor = !slot.disponivel;
          socket.emit('admin/toggleSlot', { dataISO: dataInput.value, hora: slot.hora, disponivel: novoValor });
        });
        actionWrap.appendChild(actBtn);

        const cardBody = document.createElement('div');
        cardBody.className = 'card-body';
        cardBody.innerHTML = headerHTML;
        cardBody.appendChild(bodyTop);
        cardBody.appendChild(presWrap);
        cardBody.appendChild(actionWrap);

        card.appendChild(cardBody);
        cardsSlots.appendChild(card);
      });
    }

    function carregarDia(dataISO) {
      dataHoje.textContent = formatarDataHumana(dataISO);
      socket.emit('admin/getDay', { dataISO });
    }

    // === Listagem/CRUD Serviços & Formas ===
    const tbServicos = document.getElementById('tbServicos');
    const tbFormas = document.getElementById('tbFormas');

    function renderServicos(list) {
      tbServicos.innerHTML = '';
      list.forEach(s => {
        const tr = document.createElement('tr');
        tr.innerHTML = \`
          <td>\${s.nome}</td>
          <td>\${Number(s.preco).toFixed(2)}</td>
          <td>
            <button class="btn btn-sm btn-outline-primary me-2">Editar</button>
            <button class="btn btn-sm btn-outline-danger">Excluir</button>
          </td>
        \`;
        const [btnEdit, btnDel] = tr.querySelectorAll('button');

        btnEdit.addEventListener('click', () => {
          const novoNome = prompt('Novo nome do serviço:', s.nome);
          if (novoNome === null) return;
          const novoPrecoStr = prompt('Novo preço (R$):', String(s.preco));
          if (novoPrecoStr === null) return;
          const novoPreco = Number(novoPrecoStr);
          if (!novoNome.trim() || isNaN(novoPreco) || novoPreco < 0) return alert('Dados inválidos.');
          socket.emit('admin/updateService', { id: s.id, nome: novoNome.trim(), preco: novoPreco });
        });

        btnDel.addEventListener('click', () => {
          if (!confirm('Excluir este serviço?')) return;
          socket.emit('admin/deleteService', { id: s.id });
        });

        tbServicos.appendChild(tr);
      });
    }

    function renderFormas(list) {
      tbFormas.innerHTML = '';
      list.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = \`
          <td>\${p.nome}</td>
          <td>\${p.taxa_pct == null ? '-' : Number(p.taxa_pct).toFixed(2)}</td>
          <td>
            <button class="btn btn-sm btn-outline-primary me-2">Editar</button>
            <button class="btn btn-sm btn-outline-danger">Excluir</button>
          </td>
        \`;
        const [btnEdit, btnDel] = tr.querySelectorAll('button');

        btnEdit.addEventListener('click', () => {
          const novoNome = prompt('Novo nome da forma:', p.nome);
          if (novoNome === null) return;
          const novaTaxaStr = prompt('Nova taxa (%):', p.taxa_pct == null ? '' : String(p.taxa_pct));
          if (novaTaxaStr === null) return;
          const novaTaxa = novaTaxaStr.trim() === '' ? null : Number(novaTaxaStr);
          if (!novoNome.trim() || (novaTaxa !== null && (isNaN(novaTaxa) || novaTaxa < 0))) return alert('Dados inválidos.');
          socket.emit('admin/updatePaymentMethod', { id: p.id, nome: novoNome.trim(), taxa: novaTaxa });
        });

        btnDel.addEventListener('click', () => {
          if (!confirm('Excluir esta forma de pagamento?')) return;
          socket.emit('admin/deletePaymentMethod', { id: p.id });
        });

        tbFormas.appendChild(tr);
      });
    }

    function requisitarCatalogosAdmin() {
      socket.emit('admin/getCatalogs'); // vai retornar services & payments
    }

    // Eventos Socket (Admin)
    socket.on('admin/dayState', (payload) => {
      const cur = toISODate(dataInput.value);
      const pay = toISODate(payload?.dataISO);
      if (cur && pay && cur === pay) desenharTabela(payload);
    });

    socket.on('admin/slotUpdated', (payload) => {
      const cur = toISODate(dataInput.value);
      const pay = toISODate(payload?.dataISO);
      if (cur && pay && cur === pay) desenharTabela(payload);
      if (document.getElementById('relatoriosModal')?.classList.contains('show')) {
        socket.emit('admin/getDailyReports', { days: 30 });
      }
    });

    // Feedbacks cadastro
    socket.on('admin/serviceSaved', ({ ok, message }) => {
      document.getElementById('servicoFeedback').textContent = message || (ok ? 'Serviço salvo!' : 'Erro ao salvar');
      if (ok) document.getElementById('formServico').reset();
      requisitarCatalogosAdmin();
    });
    socket.on('admin/paymentSaved', ({ ok, message }) => {
      document.getElementById('pagamentoFeedback').textContent = message || (ok ? 'Forma salva!' : 'Erro ao salvar');
      if (ok) document.getElementById('formPagamento').reset();
      requisitarCatalogosAdmin();
    });

    socket.on('admin/catalogs', ({ servicos, formas }) => {
      renderServicos(servicos || []);
      renderFormas(formas || []);
    });

    socket.on('admin/serviceUpdated', ({ ok, message }) => {
      if (!ok) alert(message || 'Erro ao atualizar serviço.');
      requisitarCatalogosAdmin();
    });
    socket.on('admin/serviceDeleted', ({ ok, message }) => {
      if (!ok) alert(message || 'Erro ao excluir serviço.');
      requisitarCatalogosAdmin();
    });
    socket.on('admin/paymentUpdated', ({ ok, message }) => {
      if (!ok) alert(message || 'Erro ao atualizar forma de pagamento.');
      requisitarCatalogosAdmin();
    });
    socket.on('admin/paymentDeleted', ({ ok, message }) => {
      if (!ok) alert(message || 'Erro ao excluir forma de pagamento.');
      requisitarCatalogosAdmin();
    });

    socket.on('admin/error', ({ message }) => alert(message || 'Erro'));

    // Relatórios
    const reportsContainer = document.getElementById('reportsContainer');
    const reportsEmpty = document.getElementById('reportsEmpty');
    const btnRefreshReports = document.getElementById('btnRefreshReports');
    const relModalEl = document.getElementById('relatoriosModal');

    function money(v) {
      return Number(v || 0).toLocaleString('pt-BR', { style:'currency', currency:'BRL' });
    }
    function renderReports(reports) {
      reportsContainer.innerHTML = '';
      const has = Array.isArray(reports) && reports.length > 0;
      reportsEmpty.classList.toggle('d-none', has);
      if (!has) return;

      const todayISO = toISODate(new Date());
      reports.forEach(r => {
  const diaISO = toISODate(r.dia);
  const isHoje = diaISO === todayISO;

  const col = document.createElement('div');
  col.className = 'col-12 col-md-6';

  const card = document.createElement('div');
  card.className = 'card shadow-sm';
  if (isHoje) card.classList.add('border-primary');

  card.innerHTML = \`
    <div class="card-body">
      <div class="d-flex justify-content-between align-items-start">
        <div>
          <h6 class="mb-1">\${toBRDate(diaISO)}</h6>
          <div class="text-muted small">\${isHoje ? 'Hoje' : ''}</div>
        </div>
        <span class="badge \${isHoje ? 'text-bg-primary' : 'text-bg-secondary'}">
          \${isHoje ? 'Dia atual' : 'Histórico'}
        </span>
      </div>
      <hr>
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <div class="text-muted small">Clientes atendidos</div>
          <div class="fs-5 fw-semibold">\${r.atendidos || 0}</div>
        </div>
        <div class="text-end">
          <div class="text-muted small">Total do dia</div>
          <div class="fs-5 fw-semibold">\${money(r.total)}</div>
        </div>
      </div>
      <div class="mt-3 d-grid d-md-flex justify-content-md-end">
        <button class="btn btn-sm btn-outline-secondary" data-dia="\${diaISO}">
          Ver detalhes
        </button>
      </div>
    </div>
  \`;

  const btn = card.querySelector('button[data-dia]');
  btn.addEventListener('click', () => abrirRelatorioDetalhe(diaISO));

  col.appendChild(card);
  reportsContainer.appendChild(col);
});

    }

    if (relModalEl) {
      relModalEl.addEventListener('shown.bs.modal', () => {
        socket.emit('admin/getDailyReports', { days: 30 });
      });
    }
    if (btnRefreshReports) {
      btnRefreshReports.addEventListener('click', () => {
        socket.emit('admin/getDailyReports', { days: 30 });
      });
    }
    socket.on('admin/dailyReports', ({ reports, error }) => {
      if (error) {
        reportsContainer.innerHTML = '';
        reportsEmpty.classList.remove('d-none');
        alert(error);
        return;
      }
      renderReports(reports || []);
    });

    // Ações gerais
    document.getElementById('formServico').addEventListener('submit', (e) => {
      e.preventDefault();
      const nome = document.getElementById('servicoNome').value.trim();
      const preco = Number(document.getElementById('servicoPreco').value);
      socket.emit('admin/addService', { nome, preco });
    });
    document.getElementById('formPagamento').addEventListener('submit', (e) => {
      e.preventDefault();
      const nome = document.getElementById('pagNome').value.trim();
      const taxaStr = document.getElementById('pagTaxa').value;
      const taxa = taxaStr === "" ? null : Number(taxaStr);
      socket.emit('admin/addPaymentMethod', { nome, taxa });
    });
    modalServ.addEventListener('shown.bs.modal', requisitarCatalogosAdmin);
    modalPag .addEventListener('shown.bs.modal', requisitarCatalogosAdmin);

    btnCarregar.addEventListener('click', () => carregarDia(dataInput.value));
    dataInput.addEventListener('change', () => carregarDia(dataInput.value));
    dataInput.addEventListener('input', () => carregarDia(dataInput.value));

    // Logout (desktop + mobile)
    const btnLogout = document.getElementById('btnLogout');
    const btnLogoutMobile = document.getElementById('btnLogoutMobile');
    async function doLogout() {
      try {
        await fetch('/logout', { method:'POST' });
      } catch {}
      window.location.href = '/login';
    }
    if (btnLogout) btnLogout.addEventListener('click', doLogout);
    if (btnLogoutMobile) btnLogoutMobile.addEventListener('click', doLogout);

    // ===== Web Push (se estiver usando) =====
    async function urlBase64ToUint8ArraySafe(base64String) {
      if (!base64String || typeof base64String !== 'string') throw new Error('VAPID key inválida');
      const clean = base64String.replace(/[^A-Za-z0-9\-_]/g, '');
      const padding = '='.repeat((4 - (clean.length % 4)) % 4);
      const base64  = (clean + padding).replace(/-/g, '+').replace(/_/g, '/');
      const rawData = atob(base64);
      const out = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) out[i] = rawData.charCodeAt(i);
      return out;
    }
    async function registerServiceWorker() {
      if (!('serviceWorker' in navigator)) return null;
      try {
        const reg = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;
        return reg;
      } catch { return null; }
    }
    async function subscribePush() {
      try {
        if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) return;
        const perm = await Notification.requestPermission();
        if (perm !== 'granted') return;
        const reg = await registerServiceWorker();
        if (!reg) return;

        let sub = await reg.pushManager.getSubscription();
        const sendToServer = async (subscription) => {
          const resp = await fetch('/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify(subscription)
          });
          return resp.ok;
        };
        if (sub) {
          const ok = await sendToServer(sub);
          if (ok) return;
          try { await sub.unsubscribe(); } catch {}
        }
        const keyResp = await fetch('/push/public-key', { cache: 'no-store', credentials: 'same-origin' });
        if (!keyResp.ok) return;
        const { key } = await keyResp.json();
        const applicationServerKey = await urlBase64ToUint8ArraySafe(key);
        if (applicationServerKey.length !== 65) return;
        sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey });
        await sendToServer(sub);
      } catch {}
    }

    // ======= Relatório diário: detalhe, edição e exclusão =======
const relDetModal   = new bootstrap.Modal(document.getElementById('relatorioDetalheModal'));
const relDetTitulo  = document.getElementById('relDetTitulo');
const relDetTbody   = document.getElementById('relDetTbody');
const relDetCards   = document.getElementById('relDetCards');
const relDetEmpty   = document.getElementById('relDetEmpty');

// Editar atendimento
const editModal     = new bootstrap.Modal(document.getElementById('editarAtendimentoModal'));
const fEdit         = {
  form:      document.getElementById('formEditarAtendimento'),
  id:        document.getElementById('editAgId'),
  cliente:   document.getElementById('editCliente'),
  servico:   document.getElementById('editServico'),
  presenca:  document.getElementById('editPresenca'),
  valor:     document.getElementById('editValor'),
  btnDel:    document.getElementById('btnExcluirAt'),
};

let relDetDataISOAtual = null;
function abrirRelatorioDetalhe(dataISO) {
  relDetDataISOAtual = dataISO;
  relDetTitulo.textContent = toBRDate(dataISO);
  // limpa
  relDetTbody.innerHTML = '';
  relDetCards.innerHTML = '';
  relDetEmpty.classList.add('d-none');

  socket.emit('admin/getDailyReportDetail', { dataISO });
  relDetModal.show();
}

function renderRelatorioDetalhe({ dataISO, items }) {
  // tabela
  relDetTbody.innerHTML = '';
  // cards
  relDetCards.innerHTML = '';

  const list = Array.isArray(items) ? items : [];
  if (!list.length) {
    relDetEmpty.classList.remove('d-none');
    return;
  }
  relDetEmpty.classList.add('d-none');

  list.forEach(row => {
    const hora = String(row.hora_ref).slice(0,5);
    const val  = Number(row.valor_aplicado || 0).toFixed(2);
    const pres = row.presenca || '—';

    // linha da tabela (≥ md)
    const tr = document.createElement('tr');
    tr.innerHTML = \`
      <td>\${hora}</td>
      <td>\${row.cliente_nome}</td>
      <td>\${row.servico_nome}</td>
      <td>\${row.barbeiro_nome || '-'}</td>
      <td>\${pres}</td>
      <td class="text-end">R$ \${val}</td>
      <td>
        <div class="btn-group btn-group-sm">
          <button class="btn btn-outline-primary" data-edit="\${row.id}">Corrigir</button>
          <button class="btn btn-outline-danger"  data-del="\${row.id}">Excluir</button>
        </div>
      </td>
    \`;
    relDetTbody.appendChild(tr);

    // card do mobile
    const card = document.createElement('div');
    card.className = 'card shadow-sm';
    card.innerHTML = \`
      <div class="card-body">
        <div class="mb-1"><strong>\${hora}</strong></div>
        <div class="mb-1"><span class="text-muted small">Cliente</span><br>\${row.cliente_nome}</div>
        <div class="mb-1"><span class="text-muted small">Serviço</span><br>\${row.servico_nome}</div>
        <div class="mb-1"><span class="text-muted small">Barbeiro</span><br>\${row.barbeiro_nome || '-'}</div>
        <div class="mb-1"><span class="text-muted small">Presença</span><br>\${pres}</div>
        <div class="mb-2"><span class="text-muted small">Valor</span><br><strong>R$ \${val}</strong></div>
        <div class="d-grid gap-2 d-md-none">
          <button class="btn btn-sm btn-outline-primary" data-edit="\${row.id}">Corrigir</button>
          <button class="btn btn-sm btn-outline-danger"  data-del="\${row.id}">Excluir</button>
        </div>
      </div>
    \`;
    relDetCards.appendChild(card);
  });

  // bind actions (ambiente inteiro: tabela + cards)
  relDetModal._element.querySelectorAll('button[data-edit]').forEach(bt => {
    bt.addEventListener('click', () => {
      const id = Number(bt.getAttribute('data-edit'));
      const row = items.find(x => x.id === id);
      if (!row) return;
      // preenche form
      fEdit.id.value      = row.id;
      fEdit.cliente.value = row.cliente_nome;
      fEdit.servico.value = row.servico_nome;
      fEdit.presenca.value= row.presenca || '';
      fEdit.valor.value   = Number(row.valor_aplicado || 0).toFixed(2);
      editModal.show();
    });
  });
  relDetModal._element.querySelectorAll('button[data-del]').forEach(bt => {
    bt.addEventListener('click', () => {
      const id = Number(bt.getAttribute('data-del'));
      if (!confirm('Excluir este atendimento?')) return;
      socket.emit('admin/deleteAttendance', { id, dataISO: relDetDataISOAtual });
    });
  });
}

// submit edição
fEdit.form.addEventListener('submit', (e) => {
  e.preventDefault();
  const id   = Number(fEdit.id.value);
  const val  = Number(fEdit.valor.value);
  const pres = fEdit.presenca.value || '';
  if (isNaN(val) || val < 0) return alert('Valor inválido.');
  socket.emit('admin/correctAttendance', {
    id, valor: val, presenca: pres || null, dataISO: relDetDataISOAtual
  });
});
// excluir dentro do modal de edição
fEdit.btnDel.addEventListener('click', () => {
  const id = Number(fEdit.id.value);
  if (!id) return;
  if (!confirm('Excluir este atendimento?')) return;
  socket.emit('admin/deleteAttendance', { id, dataISO: relDetDataISOAtual });
});

// sockets de detalhe/edição
socket.on('admin/dailyReportDetail', (payload) => {
  // payload: { dataISO, items: [...] }
  renderRelatorioDetalhe(payload || {});
});
socket.on('admin/attendanceUpdated', ({ ok, message, dataISO }) => {
  if (!ok) return alert(message || 'Erro ao salvar.');
  editModal.hide();
  // atualiza detalhe e cards-resumo
  socket.emit('admin/getDailyReportDetail', { dataISO: dataISO || relDetDataISOAtual });
  socket.emit('admin/getDailyReports', { days: 30 });
});
socket.on('admin/attendanceDeleted', ({ ok, message, dataISO }) => {
  if (!ok) return alert(message || 'Erro ao excluir.');
  editModal.hide();
  socket.emit('admin/getDailyReportDetail', { dataISO: dataISO || relDetDataISOAtual });
  socket.emit('admin/getDailyReports', { days: 30 });
});


    // Inicial
    function init() {
      dataHoje.textContent = toBRDate('${hojeISO}');
      socket.emit('admin/getDay', { dataISO: '${hojeISO}' });
      subscribePush(); // opcional
    }

    // === Toggle Barbearia (desktop + mobile) ===
    const chkLoja = document.getElementById('chkLojaAberta');
    const chkLojaMob = document.getElementById('chkLojaAbertaMobile');
    let syncingLoja = false;

    function setSwitches(aberta) {
      syncingLoja = true;
      if (chkLoja)    chkLoja.checked = !!aberta;
      if (chkLojaMob) chkLojaMob.checked = !!aberta;
      syncingLoja = false;
    }

    // Estado inicial
    socket.emit('store/getStatus');

    // Atualização em tempo real (vinda do servidor)
    socket.on('store/status', ({ aberta }) => setSwitches(aberta));

    // Mudanças locais: qualquer um dos switches dispara update global
    [chkLoja, chkLojaMob].forEach(el => {
      if (!el) return;
      el.addEventListener('change', () => {
        if (syncingLoja) return; // evita loop
        socket.emit('admin/setStoreStatus', { aberta: el.checked });
      });
    });


    init();
  </script>
</body>
</html>`;
}

module.exports = { renderAdminView };
