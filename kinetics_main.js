// kinetics_main.js (Stable Version with Number Formatting)

// --- Variáveis Globais e Elementos do DOM ---
let pyodide = null, pyodideReady = false, lastData = null, chart = null, logX = false;
const loader = document.getElementById("loader-overlay"),
      loaderText = document.getElementById("loader-text"),
      btnSim = document.getElementById("btnSim"),
      btnCSV = document.getElementById("btnCSV"),
      btnSteady = document.getElementById("btnSteady"),
      btnLogX = document.getElementById("btnLogX"),
      reactorTypeSelect = document.getElementById("reactorType"),
      cstrInputs = document.getElementById("cstr-inputs"),
      themeToggle = document.getElementById('theme-toggle'),
      themeIcon = document.getElementById('theme-icon');

// --- Inicialização ---
async function main() {
  loaderText.textContent = 'Carregando ambiente de simulação...';
  loader.style.display = 'flex';
  try {
    pyodide = await loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/" });
    const response = await fetch("kinetics_batch.py");
    if (!response.ok) throw new Error(`Falha ao buscar código Python: ${response.statusText}`);
    const pythonCode = await response.text();
    pyodide.runPython(pythonCode);
    pyodideReady = true;
    console.log("Pyodide e código Python carregados com sucesso.");
  } catch (error) {
    console.error("Initialization failed:", error);
    loaderText.textContent = `Erro ao carregar: ${error.message}`;
    return;
  }
  loader.style.display = 'none';
}

// --- Event Listeners ---
document.addEventListener("DOMContentLoaded", () => {
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        themeIcon.classList.replace('fa-moon', 'fa-sun');
    }
    main();
});
btnSim.addEventListener("click", runSimulation);
btnSteady.addEventListener("click", calculateSteadyState);
btnCSV.addEventListener("click", downloadCSV);
btnLogX.addEventListener("click", toggleLogScale);
reactorTypeSelect.addEventListener("change", (e) => {
    const isCstr = e.target.value === "cstr";
    cstrInputs.classList.toggle("visible", isCstr);
    document.getElementById("steadyStateInfo").innerHTML = "";
});
themeToggle.addEventListener('click', toggleTheme);

// --- Funções Utilitárias e de Validação ---
function getNumber(id) {
  const value = document.getElementById(id).value.replace(",", ".").trim();
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
}

function validateInputs() {
    const fields = ["X0", "S0", "P0", "mu_max", "Ks", "Yxs", "mS", "kd", "alpha", "beta", "t_final", "dt"];
    if (reactorTypeSelect.value === 'cstr') fields.push("Sin", "D");
    for (const id of fields) {
        if (getNumber(id) === null) {
            alert(`Entrada inválida para o campo '${id}'. Por favor, insira um número.`);
            return false;
        }
    }
    return true;
}

// --- Lógica Principal (Simulação e Cálculo) ---
async function runSimulation() {
  if (!pyodideReady || !validateInputs()) return;
  loaderText.textContent = 'Simulando...';
  loader.style.display = 'flex';
  btnSim.disabled = true;

  try {
    const simulate_batch_func = pyodide.globals.get('simulate_batch');
    const simulate_cstr_func = pyodide.globals.get('simulate_cstr');

    let resultProxy;
    if (reactorTypeSelect.value === "batch") {
      resultProxy = simulate_batch_func(
          getNumber("t_final"), getNumber("dt"),
          getNumber("X0"), getNumber("S0"), getNumber("P0"),
          getNumber("mu_max"), getNumber("Ks"), getNumber("Yxs"),
          getNumber("mS"), getNumber("kd"), getNumber("alpha"), getNumber("beta"),
          document.getElementById("method").value
      );
    } else {
      resultProxy = simulate_cstr_func(
          getNumber("t_final"), getNumber("dt"),
          getNumber("X0"), getNumber("S0"), getNumber("P0"),
          getNumber("Sin"), getNumber("D"),
          getNumber("mu_max"), getNumber("Ks"), getNumber("Yxs"),
          getNumber("mS"), getNumber("kd"), getNumber("alpha"), getNumber("beta"),
          document.getElementById("method").value
      );
    }
    
    const [t, X, S, P, mu] = resultProxy.toJs({ destroy_proxies: true });
    lastData = { t, X, S, P, mu };
    plotData(lastData);
    updateIndicators(lastData, { X0: getNumber("X0"), S0: getNumber("S0"), P0: getNumber("P0") });
    renderResultsTable(lastData);
    btnCSV.disabled = false;
    document.getElementById("steadyStateInfo").innerHTML = "";

  } catch (error) {
    console.error("Simulation error:", error);
    alert(`Ocorreu um erro na simulação: ${error.message}`);
  } finally {
    loader.style.display = 'none';
    btnSim.disabled = false;
  }
}

async function calculateSteadyState() {
    if (!pyodideReady) return;
    const cstr_steady_state_func = pyodide.globals.get('cstr_steady_state');

    loaderText.textContent = 'Calculando...';
    loader.style.display = 'flex';
    btnSteady.disabled = true;

    try {
        const resultProxy = cstr_steady_state_func(
            getNumber("Sin"), getNumber("D"), getNumber("mu_max"), getNumber("Ks"), getNumber("Yxs"),
            getNumber("mS"), getNumber("kd"), getNumber("alpha"), getNumber("beta")
        );
        const [S_star, X_star, P_star] = resultProxy.toJs({ destroy_proxies: true });
        let infoHTML;
        if (X_star < 1e-6) {
             infoHTML = `<div><strong>Washout (Lavagem):</strong> Nenhum estado estacionário viável foi encontrado.</div>`;
        } else {
            infoHTML = `<div><strong>Estado Estacionário:</strong> S* = ${S_star.toFixed(4)} | X* = ${X_star.toFixed(4)} | P* = ${P_star.toFixed(4)} (g·L⁻¹)</div>`;
        }
        document.getElementById("steadyStateInfo").innerHTML = infoHTML;
    } catch(error) {
        console.error("Steady state error:", error);
        document.getElementById("steadyStateInfo").innerHTML = `<div style="color:red">Erro: ${error.message}</div>`;
    } finally {
        loader.style.display = 'none';
        btnSteady.disabled = false;
    }
}

// --- Atualização da UI e Tema ---
function plotData(data) {
  if (chart) chart.destroy();
  const ctx = document.getElementById("chartMain").getContext("2d");
  const isDarkMode = document.body.classList.contains('dark-mode');
  const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  const textColor = isDarkMode ? '#e0e0e0' : '#333';
  
  chart = new Chart(ctx, {
    type: 'line', 
    data: {
        labels: data.t,
        datasets: [
            { label: "Biomassa X", data: data.X, borderColor: 'hsl(210, 100%, 56%)', yAxisID: "y" },
            { label: "Substrato S", data: data.S, borderColor: 'hsl(145, 63%, 42%)', yAxisID: "y2" },
            { label: "Produto P", data: data.P, borderColor: 'hsl(354, 70%, 54%)', yAxisID: "y2" }
        ]
    },
    options: {
      responsive: true, maintainAspectRatio: false, tension: 0.1,
      scales: {
        x: { 
          title: { display: true, text: "Tempo (h)", color: textColor }, 
          grid: { color: gridColor }, 
          ticks: { 
            color: textColor,
            // Adiciona um formatador para os números do eixo X
            callback: function(value, index, values) {
              const label = this.getLabelForValue(value);
              // Mostra o número com no máximo 1 casa decimal
              return parseFloat(label).toFixed(1);
            }
          } 
        },
        y: { type: logX ? 'logarithmic' : 'linear', position: 'left', title: { display: true, text: "Biomassa X (g·L⁻¹)", color: textColor }, min: 0, grid: { color: gridColor }, ticks: { color: textColor } },
        y2: { type: 'linear', position: 'right', title: { display: true, text: "S / P (g·L⁻¹)", color: textColor }, min: 0, grid: { drawOnChartArea: false }, ticks: { color: textColor } }
      },
      plugins: { legend: { labels: { color: textColor } } }
    }
  });
}

function updateIndicators(data, params) {
  const final_idx = data.X.length - 1;
  const X_max = Math.max(...data.X);
  const t_X_max = data.t[data.X.indexOf(X_max)];
  const delta_X = data.X[final_idx] - params.X0;
  const delta_S = params.S0 - data.S[final_idx];
  const yield_obs = delta_S > 1e-6 ? (delta_X / delta_S) : 0;
  const productivity = data.t[final_idx] > 0 ? ((data.P[final_idx] - params.P0) / data.t[final_idx]) : 0;
  document.getElementById("indicators").innerHTML = `
    <div><strong>X máximo:</strong> ${X_max.toFixed(4)} g·L⁻¹ (em ${t_X_max.toFixed(2)} h)</div>
    <div><strong>Rendimento Ŷ (ΔX/ΔS):</strong> ${yield_obs.toFixed(4)} g/g</div>
    <div><strong>Produtividade em P:</strong> ${productivity.toFixed(4)} g·L⁻¹·h⁻¹</div>`;
}

function renderResultsTable(data) {
  const container = document.getElementById("resultsTableContainer");
  const n = data.t.length;
  if (n === 0) { container.innerHTML = `<p class="placeholder">Nenhum dado para exibir.</p>`; return; }
  let html = '<table><thead><tr><th>t (h)</th><th>X (g·L⁻¹)</th><th>S (g·L⁻¹)</th><th>P (g·L⁻¹)</th><th>μ (h⁻¹)</th></tr></thead><tbody>';
  const step = Math.max(1, Math.ceil(n / 100));
  for (let i = 0; i < n; i += step) {
    html += `<tr><td>${data.t[i].toFixed(2)}</td><td>${data.X[i].toFixed(4)}</td><td>${data.S[i].toFixed(4)}</td><td>${data.P[i].toFixed(4)}</td><td>${data.mu[i].toFixed(4)}</td></tr>`;
  }
  html += '</tbody></table>';
  container.innerHTML = html;
}

function toggleLogScale() {
  logX = !logX;
  btnLogX.classList.toggle('active', logX);
  if (lastData) plotData(lastData);
}

function downloadCSV() {
  if (!lastData) return;
  const header = ["time_h", "X_gL", "S_gL", "P_gL", "mu_h-1"];
  const rows = [header.join(",")];
  for (let i = 0; i < lastData.t.length; i++) {
    rows.push([ lastData.t[i].toFixed(4), lastData.X[i].toFixed(4), lastData.S[i].toFixed(4), lastData.P[i].toFixed(4), lastData.mu[i].toFixed(4) ].join(","));
  }
  const csvContent = rows.join("\n");
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "kinetics_simulation.csv";
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    themeIcon.classList.toggle('fa-sun', isDarkMode);
    themeIcon.classList.toggle('fa-moon', !isDarkMode);
    if (lastData) {
        plotData(lastData); 
    }
}

