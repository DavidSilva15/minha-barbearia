function renderClientIntroView() {
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Bem-vindo • Barbearia</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <style>
    body { background:#f8fafc; min-height:100dvh; }
    .page-wrap { min-height:100dvh; display:flex; flex-direction:column; }
    .hero-wrap { flex:1; display:flex; align-items:center; }

    /* Card mais largo e sem “acolchoamento” ao redor do carrossel */
    .hero-card {
      max-width: 1080px;        /* aumento da largura */
      margin: 0 auto;
      border-radius:16px;
      overflow:hidden;
      padding: 0;               /* remove padding interno pra o slide encostar nas bordas */
    }

    .logo { height:68px; width:auto; }
    .bottom-cta { position:sticky; bottom:0; background:#fff; border-top:1px solid #e5e7eb; }

    /* Carrossel full-bleed (sem bordas e mais alto) */
    .hero-carousel {
      margin: 0;
      border: 0;
      border-radius: 0;         /* remove cantos arredondados do próprio carrossel */
      overflow: hidden;
    }

    /* Faz o carrossel sangrar até as bordas do card (caso o card tenha padding em algum lugar) */
    .hero-carousel-bleed {
      margin-left: calc(-1 * var(--bs-card-spacer-x, 1rem));
      margin-right: calc(-1 * var(--bs-card-spacer-x, 1rem));
    }

    /* Altura maior do slide */
    .hero-carousel .carousel-item {
      height: 40vh;             /* mobile */
    }
    @media (min-width:768px){
      .hero-carousel .carousel-item { height: 70vh; } /* desktop/tablet */
    }

    /* Imagens sempre preenchendo sem distorcer */
    .hero-carousel .carousel-item img {
      width:100%;
      height:100%;
      object-fit:cover;
      display:block;
    }

    /* Animação de "subida da tela" ao concordar */
    @keyframes slideUpOut {
      0%   { transform: translateY(0);    opacity: 1; }
      100% { transform: translateY(-20%); opacity: 0; }
    }
    .leaving { animation: slideUpOut 480ms ease forwards; will-change: transform, opacity; }
</style>
</head>
<body>
  <div id="introRoot" class="page-wrap">
    <header class="bg-white border-bottom">
      <div class="container py-3 d-flex justify-content-center">
        <img src="/img/logo.png" alt="Barbearia" class="logo img-fluid" style="height: 150px;">
      </div>
    </header>

    <main class="container hero-wrap py-4">
      <div class="card shadow-sm hero-card p-3 p-md-4">
        <!-- Carrossel de cortes -->
        <div id="heroCarousel" class="carousel slide hero-carousel hero-carousel-bleed" data-bs-ride="carousel" data-bs-interval="3500" data-bs-touch="true">
          <div class="carousel-indicators">
            <button type="button" data-bs-target="#heroCarousel" data-bs-slide-to="0" class="active" aria-current="true" aria-label="Slide 1"></button>
            <button type="button" data-bs-target="#heroCarousel" data-bs-slide-to="1" aria-label="Slide 2"></button>
            <button type="button" data-bs-target="#heroCarousel" data-bs-slide-to="2" aria-label="Slide 3"></button>
          </div>
          <div class="carousel-inner">
            <!-- Substitua os src abaixo pelas suas fotos -->
            <div class="carousel-item active">
              <img src="/img/cortes/1.png" alt="Corte 1">
            </div>
            <div class="carousel-item">
              <img src="/img/cortes/2.png" alt="Corte 2">
            </div>
            <div class="carousel-item">
              <img src="/img/cortes/3.png" alt="Corte 3">
            </div>
          </div>
          <button class="carousel-control-prev" type="button" data-bs-target="#heroCarousel" data-bs-slide="prev">
            <span class="carousel-control-prev-icon" aria-hidden="true"></span><span class="visually-hidden">Anterior</span>
          </button>
          <button class="carousel-control-next" type="button" data-bs-target="#heroCarousel" data-bs-slide="next">
            <span class="carousel-control-next-icon" aria-hidden="true"></span><span class="visually-hidden">Próximo</span>
          </button>
        </div>

        <!--<h1 class="h4 text-center mb-2">Bem-vindo à nossa barbearia</h1>--><br>
        <p class="text-center text-muted mb-0">Toque no botão abaixo para acessar a fila de agendamentos.</p>
      </div>
    </main>

    <div class="bottom-cta">
      <div class="container py-3">
        <button id="btnIrFila" class="btn btn-primary btn-lg w-100">Ir para fila</button>
      </div>
    </div>
  </div>

  <!-- Modal: Regras -->
  <div class="modal fade" id="regrasModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Regras da barbearia</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
        </div>
        <div class="modal-body">
          <ul class="mb-0">
            <li>Chegue com 5 minutos de antecedência.</li>
            <li>Cancelamentos devem ser feitos antes do horário marcado.</li>
            <li>Em caso de atraso, o horário pode ser disponibilizado.</li>
            <li>Formas de pagamento conforme disponibilidade da unidade.</li>
          </ul>
        </div>
        <div class="modal-footer">
          <button id="btnConcordo" class="btn btn-primary">Li e concordo</button>
        </div>
      </div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script>
    const introRoot   = document.getElementById('introRoot');
    const btnIrFila   = document.getElementById('btnIrFila');
    const btnConcordo = document.getElementById('btnConcordo');
    const regrasModal = new bootstrap.Modal(document.getElementById('regrasModal'));

    // Abre o modal de regras
    btnIrFila.addEventListener('click', () => regrasModal.show());

    // Ao concordar: fecha o modal, anima a saída e navega para /client
    btnConcordo.addEventListener('click', () => {
      btnConcordo.disabled = true;
      regrasModal.hide();
      setTimeout(() => {
        introRoot.classList.add('leaving');
        introRoot.addEventListener('animationend', () => {
          window.location.href = '/client';
        }, { once: true });
      }, 150);
    });
  </script>
</body>
</html>`;
}



// Public/Js/clientView.js
function renderClientView() {
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Agendamentos • Barbearia</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
<link rel="stylesheet"
      href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
      referrerpolicy="no-referrer" />


  <style>
    body { background:#f8fafc; }
    .logo { height: 64px; }
    .card-ag { border-left: 4px solid #0d6efd; }
    /* Logo grande e central no mobile */
  .logo-mobile-lg {
    height: 172px;            /* tamanho maior */
    width: auto;
    display: block;
  }

  /* Barra fixa inferior no mobile com respeito ao notch/safe area */
  .mobile-cta {
    position: fixed;
    left: 0;
    right: 0;
    bottom: env(safe-area-inset-bottom, 0);
    background: #fff;
    border-top: 1px solid #e5e7eb;
    padding: 12px 0 calc(12px + env(safe-area-inset-bottom, 0));
    z-index: 1030; /* acima do conteúdo */
  }

  /* Evita que o conteúdo fique escondido atrás do botão fixo */
  .has-bottom-cta {
    padding-bottom: 96px; /* espaço para a barra + safe area */
  }

  /* Ajustes finos no mobile */
  @media (max-width: 767.98px) {
    .header-mobile .logo { height: 40px; }
  }
  </style>
</head>
<body>
  <!-- HEADER -->
  <header class="bg-white border-bottom header-mobile">
    <div class="container py-3 d-flex justify-content-between align-items-center d-none d-md-flex">
      <!-- Desktop/Tablet (≥ md): layout original -->
      <div class="d-flex align-items-center gap-3">
        <img src="/img/logo.png" class="logo" alt="Barbearia" style="height:40px">
        <strong>Agendamentos</strong>
      </div>

      <div class="d-flex align-items-center gap-2">
        <button id="btnNovoTop" class="btn btn-primary" aria-label="Agendar novo horário">
          <i class="fa-regular fa-calendar-plus me-2"></i>
          Agendar
        </button>
        <button id="btnRefreshTop" class="btn btn-outline-secondary" aria-label="Atualizar a página e a lista">
          <i class="fa-solid fa-rotate-right me-2"></i>
          Atualizar
        </button>
      </div>
    </div>

    <!-- Mobile (< md): logo grande centralizada -->
    <div class="container py-3 d-flex flex-column align-items-center d-md-none">
      <img src="/img/logo.png" class="logo-mobile-lg" alt="Barbearia">
      <strong class="mt-2">Agendamentos</strong>
    </div>
  </header>

  <!-- CONTEÚDO -->
  <main class="container my-4 has-bottom-cta">
    <div id="listaAgendamentos" class="row g-3"></div>

    <div id="vazio" class="text-center py-5 d-none">
      <p class="mb-2">Sem agendamentos no momento, agende agora seu horário</p>
      <img id="imgVazio" src="/img/cadeira.png" alt="Sem agendamentos" style="max-width:220px;">
    </div>
  </main>

  <!-- BOTÃO FIXO (MOBILE) -->
  <div class="mobile-cta d-md-none">
    <div class="container">
      <div class="d-flex gap-2">
        <button id="btnNovo" class="btn btn-primary w-100" aria-label="Agendar novo horário">
          <i class="fa-regular fa-calendar-plus me-2"></i>
          Agendar
        </button>
        <button id="btnRefresh" class="btn btn-outline-secondary w-100" aria-label="Atualizar a página e a lista">
          <i class="fa-solid fa-rotate-right me-2"></i>
          Atualizar
        </button>
      </div>
    </div>
  </div>

  <!-- Modal Agendar -->
  <div class="modal fade" id="agendarModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <form id="formAgendar" class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Novo agendamento</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
        </div>
        <div class="modal-body">
          <div class="mb-3">
            <label class="form-label">Nome do cliente</label>
            <input type="text" id="cliNome" class="form-control" placeholder="Seu nome" required>
          </div>

          <div class="row g-2">
            <div class="col-12 col-md-6 mb-3">
              <label class="form-label">Data</label>
              <input type="date" id="agData" class="form-control" required>
            </div>
            <div class="col-12 col-md-6 mb-3">
              <label class="form-label">Horário</label>
              <select id="agHora" class="form-select" required>
                <option value="">Selecione a data</option>
              </select>
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label">Serviço</label>
            <select id="agServico" class="form-select" required></select>
          </div>

          <div class="row g-2">
            <div class="col-12 col-md-6 mb-3">
              <label class="form-label">Preço (R$)</label>
              <input type="text" id="agPreco" class="form-control" disabled>
            </div>
            <div class="col-12 col-md-6 mb-3">
              <label class="form-label">Forma de pagamento</label>
              <select id="agPgto" class="form-select" required></select>
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label">Barbeiro</label>
            <select id="agBarbeiro" class="form-select" required></select>
          </div>

          <div id="agendarFeedback" class="small text-muted"></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" type="submit">Confirmar</button>
        </div>
      </form>
    </div>
  </div>

  <script src="/socket.io/socket.io.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script>
    const socket = io();
    const elLista = document.getElementById('listaAgendamentos');
    const elVazio = document.getElementById('vazio');
    const btnNovo = document.getElementById('btnNovo');

    const modal = new bootstrap.Modal(document.getElementById('agendarModal'));

    const btnNovoTop = document.getElementById('btnNovoTop');

  function abrirAgendamento() {
    f.form.reset();
    f.preco.value = '';
    f.data.value = hojeISO;
    carregarHorarios(f.data.value); // carrega horários para a data atual
    modal.show();
  }

  if (btnNovo)    btnNovo.addEventListener('click', abrirAgendamento);
  if (btnNovoTop) btnNovoTop.addEventListener('click', abrirAgendamento);
  
    const f = {
      nome: document.getElementById('cliNome'),
      data: document.getElementById('agData'),
      hora: document.getElementById('agHora'),
      servico: document.getElementById('agServico'),
      preco: document.getElementById('agPreco'),
      pgto: document.getElementById('agPgto'),
      barbeiro: document.getElementById('agBarbeiro'),
      feedback: document.getElementById('agendarFeedback'),
      form: document.getElementById('formAgendar')
    };

    // Identificador do navegador para controlar cancelamento
    function ensureClientGuid() {
      let g = localStorage.getItem('client_guid');
      if (!g) {
        g = (crypto && crypto.randomUUID) ? crypto.randomUUID() : (Date.now() + '-' + Math.random().toString(16).slice(2));
        localStorage.setItem('client_guid', g);
      }
      return g;
    }
    const CLIENT_GUID = ensureClientGuid();

    // Hoje para preencher o modal ao abrir
    const hoje = new Date();
    const yyyy = hoje.getFullYear();
    const mm = String(hoje.getMonth()+1).padStart(2,'0');
    const dd = String(hoje.getDate()).padStart(2,'0');
    const hojeISO = \`\${yyyy}-\${mm}-\${dd}\`;

    function brDate(iso) {
      if (!iso) return '';
      const s = String(iso).slice(0, 10); // 'YYYY-MM-DD'
      const [y, m, d] = s.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      return dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    function isPast(dataISO, hora) {
      if (!dataISO || !hora) return false;
      const s = String(dataISO).slice(0, 10); // garante 'YYYY-MM-DD'
      const [y, m, d] = s.split('-').map(Number);
      const [hh, mi] = hora.slice(0, 5).split(':').map(Number);
      const dt = new Date(y, m - 1, d, hh, mi, 0);
      return dt.getTime() < Date.now();
    }

    // Catálogos (serviços, pgtos, barbeiros)
    function carregarCatalogos() {
      socket.emit('client/getCatalogs');
    }

    // Carregar horários disponíveis para a data escolhida (apenas para o modal)
    function carregarHorarios(dataISO) {
      f.hora.innerHTML = '<option value="">Carregando...</option>';
      socket.emit('client/getAvailableSlots', { dataISO });
    }

    // Render da fila (sempre: todos os futuros)
    function renderFila(items) {
  elLista.innerHTML = '';
  const list = (items || [])
    .slice()
    .sort((a, b) => {
      const da = String(a.data_ref).slice(0, 10);
      const db = String(b.data_ref).slice(0, 10);
      const cmpD = da.localeCompare(db);
      if (cmpD !== 0) return cmpD;
      return String(a.hora_ref).localeCompare(String(b.hora_ref));
    });

  if (!list.length) {
    elVazio.classList.remove('d-none');
    return;
  }
  elVazio.classList.add('d-none');

  list.forEach(item => {
    const col = document.createElement('div');
    col.className = 'col-12';

    const card = document.createElement('div');
    card.className = 'card card-ag shadow-sm';

    const passou = isPast(item.data_ref, item.hora_ref);
    if (passou) card.classList.add('opacity-50');

    const horaHHMM = String(item.hora_ref).slice(0, 5);
    const precoFmt = Number(item.valor_aplicado || 0).toFixed(2);

    card.innerHTML = \`
      <div class="card-body">
        <!-- Cliente -->
        <div class="d-flex align-items-center gap-2 mb-2">
          <i class="fa-solid fa-user text-muted"></i>
          <div class="fw-semibold">Cliente: \${item.cliente_nome}</div>
        </div>

        <!-- Barbeiro -->
        <div class="d-flex align-items-center gap-2 mb-2">
          <i class="fa-solid fa-user-tie text-muted"></i>
          <div>Barbeiro: \${item.barbeiro_nome || '-'}</div>
        </div>

        <!-- Serviço -->
        <div class="d-flex align-items-center gap-2 mb-2">
          <i class="fa-solid fa-scissors text-muted"></i>
          <div>Serviço: \${item.servico_nome}</div>
        </div>

        <!-- Data -->
        <div class="d-flex align-items-center gap-2 mb-2">
          <i class="fa-regular fa-calendar text-muted"></i>
          <div>Data: \${brDate(item.data_ref)}</div>
        </div>

        <!-- Hora -->
        <div class="d-flex align-items-center gap-2 mb-2">
          <i class="fa-regular fa-clock text-muted"></i>
          <div>Hora: <strong>\${horaHHMM}</strong></div>
        </div>

        <!-- Preço -->
        <div class="d-flex align-items-center gap-2 mb-3">
          <i class="fa-solid fa-money-bill-wave text-muted"></i>
          <div>Preço: R$ \${precoFmt}</div>
        </div>

        <!-- Ação -->
        <div class="d-grid">
          <button class="btn btn-sm btn-outline-danger"
            \${(item.cliente_guid === CLIENT_GUID && !passou) ? '' : 'disabled'}>
            <i class="fa-regular fa-calendar-xmark me-1"></i> Desmarcar
          </button>
        </div>
      </div>
    \`;

    const btn = card.querySelector('button');
    btn.addEventListener('click', () => {
      if (item.cliente_guid !== CLIENT_GUID) return;
      socket.emit('client/cancelBooking', {
        agendamentoId: item.id,
        clientGuid: CLIENT_GUID,
        dataISO: String(item.data_ref).slice(0,10)
      });
    });

    col.appendChild(card);
    elLista.appendChild(col);
  });
}

    f.data.addEventListener('change', () => {
      if (f.data.value) {
        carregarHorarios(f.data.value);   // só para o modal
      }
    });

    f.servico.addEventListener('change', () => {
      const opt = f.servico.selectedOptions[0];
      const preco = opt ? opt.getAttribute('data-preco') : '';
      f.preco.value = preco ? Number(preco).toFixed(2) : '';
    });

    f.form.addEventListener('submit', (e) => {
      e.preventDefault();
      const payload = {
        clientGuid: CLIENT_GUID,
        nome: f.nome.value.trim(),
        dataISO: f.data.value,
        hora: f.hora.value,
        servicoId: Number(f.servico.value),
        formaPagamentoId: Number(f.pgto.value),
        barbeiroId: Number(f.barbeiro.value)
      };
      socket.emit('client/createBooking', payload);
    });

    // ===== Sockets =====

    // Pedir fila completa ao conectar/reconectar
    socket.on('connect', () => {
      socket.emit('client/listQueue', {}); // todos os futuros
    });
    socket.on('reconnect', () => {
      socket.emit('client/listQueue', {}); // todos os futuros
    });

    // Catálogos
    socket.on('client/catalogs', ({ servicos, formas, barbeiros }) => {
      f.servico.innerHTML = '<option value="">Selecione</option>';
      (servicos || []).forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = s.nome;
        opt.setAttribute('data-preco', s.preco);
        f.servico.appendChild(opt);
      });

      f.pgto.innerHTML = '<option value="">Selecione</option>';
      (formas || []).forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.nome;
        f.pgto.appendChild(opt);
      });

      f.barbeiro.innerHTML = '<option value="">Selecione</option>';
      (barbeiros || []).forEach(b => {
        const opt = document.createElement('option');
        opt.value = b.id;
        opt.textContent = b.nome;
        f.barbeiro.appendChild(opt);
      });
    });

    // Slots disponíveis do modal
    socket.on('client/availableSlots', ({ dataISO, slots }) => {
      if (dataISO !== f.data.value) return;
      f.hora.innerHTML = '<option value="">Selecione</option>';
      (slots || []).filter(s => s.disponivel).forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.hora;
        opt.textContent = s.hora;
        f.hora.appendChild(opt);
      });
    });

    // Fila completa (sempre renderiza)
    socket.on('client/queue', ({ items }) => {
      renderFila(items);
    });

    // Após criar/cancelar, sempre recarrega TODOS
    socket.on('client/bookingCreated', ({ ok, message }) => {
      f.feedback.textContent = message || (ok ? 'Agendado!' : 'Erro ao agendar');
      if (ok) {
        modal.hide();
        socket.emit('client/listQueue', {}); // todos
      }
    });
    socket.on('client/bookingCanceled', ({ ok, message }) => {
      if (!ok) alert(message || 'Falha ao desmarcar.');
      socket.emit('client/listQueue', {});   // todos
    });

    // Quando o admin mexe nos slots, atualize lista completa e os horários do modal se a data coincidir
    socket.on('admin/slotUpdated', (payload) => {
      socket.emit('client/listQueue', {});   // todos
      if (f.data.value === payload.dataISO) {
        socket.emit('client/getAvailableSlots', { dataISO: f.data.value });
      }
    });

    // Atualizador automático (fila completa, para esconder passado e refletir mudanças)
    setInterval(() => {
      socket.emit('client/listQueue', {});   // todos
    }, 60 * 1000);

    // Inicial
    function init() {
      carregarCatalogos();
      // pedido inicial já é feito no 'connect'
    }

    function refreshPage() { window.location.reload(); }

    const btnRefreshTop = document.getElementById('btnRefreshTop');
    const btnRefresh    = document.getElementById('btnRefresh');
    if (btnRefreshTop) btnRefreshTop.addEventListener('click', refreshPage);
    if (btnRefresh)    btnRefresh.addEventListener('click', refreshPage);

    init();
  </script>
</body>
</html>`;
}

// Public/Js/clientView.js (ATUALIZAR EXPORT)
module.exports = { renderClientView, renderClientIntroView };