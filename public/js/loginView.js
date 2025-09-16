// Public/Js/loginView.js
function renderLoginView() {
    return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Login • Barbearia</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <style>
    body{background:#0d1117;}
    .card{border:0;border-radius:16px;}
    .brand{font-weight:700;letter-spacing:.3px;}
  </style>
</head>
<body class="d-flex align-items-center" style="min-height:100vh;">
  <div class="container">
    <div class="row justify-content-center">
      <div class="col-12 col-sm-10 col-md-7 col-lg-5">
        <div class="text-center text-white mb-4">
          <img src="/img/logo.png" alt="Barbearia" style="height:64px" class="mb-2">
          <div class="brand">Painel do Administrador</div>
        </div>

        <div class="card shadow-lg">
          <div class="card-body p-4">
            <h5 class="mb-3">Entrar</h5>
            <form id="loginForm" novalidate>
              <div class="mb-3">
                <label class="form-label">E-mail</label>
                <input type="email" class="form-control" id="email" autocomplete="username" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Senha</label>
                <input type="password" class="form-control" id="senha" autocomplete="current-password" required>
              </div>
              <div class="d-flex justify-content-between align-items-center">
                <a href="/client" class="small">Ir para agendamentos públicos</a>
                <button class="btn btn-primary" type="submit">Entrar</button>
              </div>
              <div id="loginMsg" class="small text-danger mt-3"></div>
            </form>
          </div>
        </div>

        <p class="text-center text-muted small mt-3">
          Acesso restrito a administradores/barbeiros.
        </p>
      </div>
    </div>
  </div>

  <script>
    const form = document.getElementById('loginForm');
    const msg = document.getElementById('loginMsg');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      msg.textContent = '';
      const email = document.getElementById('email').value.trim();
      const senha = document.getElementById('senha').value;

      try {
        const res = await fetch('/login', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ email, senha })
        });
        const data = await res.json();
        if (data.ok) {
          // redireciona para o admin
          window.location.href = '/admin';
        } else {
          msg.textContent = data.message || 'Credenciais inválidas.';
        }
      } catch {
        msg.textContent = 'Falha ao conectar. Tente novamente.';
      }
    });
  </script>
</body>
</html>`;
}

module.exports = { renderLoginView };
