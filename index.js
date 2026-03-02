// Configurações Globais
const PESO_LIQUIDO_P13 = 13;
const PESO_BRUTO = { 'P13L': 28, 'P13C': 28, 'P45': 80, 'P20': 41, 'P8': 18, 'P5': 12 };
const FATOR = { 'P13L': 1.0, 'P13C': 1.0, 'P45': 3.0, 'P20': 2.0, 'P8': 0.8524, 'P5': 0.6723 };

let cols, rows, limite_liquido;

// Base de dados local com o QRF pré-configurado
let frota = JSON.parse(localStorage.getItem('frota_caminhoes')) || {
    "QRF": { placa: "QRF", cols: 22, rows: 6, max_p13: 477 }
};

function buscarCaminhao() {
    let placa = document.getElementById('placa_busca').value.trim().toUpperCase();
    if(placa.length < 3) return;

    if (frota[placa]) {
        ativarCaminhao(placa);
    } else {
        document.getElementById('msg-frota').innerText = "Matrícula não encontrada. Cadastre abaixo:";
        document.getElementById('cad_placa').value = placa;
        document.getElementById('form-cadastro').style.display = 'block';
    }
}

function ativarCaminhao(placa) {
    let cam = frota[placa];
    cols = cam.cols; rows = cam.rows;
    limite_liquido = cam.max_p13 * PESO_LIQUIDO_P13;

    document.getElementById('painel-frota').style.display = 'none';
    document.getElementById('area-calculo').style.display = 'block';
    document.getElementById('titulo-caminhao-ativo').innerText = `Camião: ${placa} (${cols}x${rows})`;
    document.getElementById('qtd_p13_liq').value = cam.max_p13;
}

function gerarMapa() {
    const q = {
        liq: parseInt(document.getElementById('qtd_p13_liq').value) || 0,
        cop: parseInt(document.getElementById('qtd_p13_cop').value) || 0,
        p45: parseInt(document.getElementById('qtd_p45').value) || 0,
        p20: parseInt(document.getElementById('qtd_p20').value) || 0,
        p8: parseInt(document.getElementById('qtd_p8').value) || 0,
        p5: parseInt(document.getElementById('qtd_p5').value) || 0
    };

    let prio = document.querySelector('input[name="desc_primeiro"]:checked').value;

    // Cálculo de Peso
    let eq = (q.liq * FATOR.P13L) + (q.cop * FATOR.P13C) + (q.p45 * FATOR.P45) + (q.p20 * FATOR.P20) + (q.p8 * FATOR.FATOR_P8 || 0.85) + (q.p5 * 0.67);
    let total_kg = Math.ceil(eq) * PESO_LIQUIDO_P13;
    
    atualizarResumo(total_kg);

    // Algoritmo de Distribuição
    let grid = Array.from({length: rows}, () => Array.from({length: cols}, () => []));
    let l_liq = q.liq, l_cop = q.cop, l_p45 = q.p45, l_p20 = q.p20, l_p8 = q.p8, l_p5 = q.p5;

    for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
            let h_max = (c < 3 || c >= cols - 3) ? 3 : 4;
            let p13_neste_slot = 0;

            // Lógica de Prioridade: Se Liquigás descarrega 1º, ela deve ficar no fundo (fim do grid).
            // Portanto, carregamos a Copagaz primeiro (perto da cabine).
            let marcas = prio === 'L' ? ['P13C', 'P13L'] : ['P13L', 'P13C'];
            
            while(p13_neste_slot < h_max) {
                if (marcas[0] === 'P13L' && l_liq > 0) { grid[r][c].push('P13L'); l_liq--; }
                else if (marcas[0] === 'P13C' && l_cop > 0) { grid[r][c].push('P13C'); l_cop--; }
                else if (marcas[1] === 'P13L' && l_liq > 0) { grid[r][c].push('P13L'); l_liq--; }
                else if (marcas[1] === 'P13C' && l_cop > 0) { grid[r][c].push('P13C'); l_cop--; }
                else break;
                p13_neste_slot++;
            }

            // Preenche topos com P8/P5
            let sobra = h_max - grid[r][c].length;
            while(sobra > 0) {
                if(l_p8 > 0) { grid[r][c].push('P8'); l_p8--; }
                else if(l_p5 > 0) { grid[r][c].push('P5'); l_p5--; }
                else break;
                sobra--;
            }

            // Se ainda vazio, tenta P45 ou P20
            if (grid[r][c].length === 0) {
                if(l_p45 > 0) { grid[r][c].push('P45'); l_p45--; }
                else if(l_p20 > 0) { grid[r][c].push('P20'); l_p20--; }
            }
        }
    }

    renderizarGrids(grid);
}

function renderizarGrids(grid) {
    document.querySelectorAll('.secao').forEach(s => s.style.display = 'block');
    const estiloCols = `repeat(${cols}, minmax(30px, 1fr))`;
    
    // Vista Superior
    const m = document.getElementById('grid_mapa');
    m.style.gridTemplateColumns = estiloCols;
    m.innerHTML = '';
    
    // Vista Acumulada e Pesos
    const ac = document.getElementById('grid_acumulado');
    ac.style.gridTemplateColumns = estiloCols;
    ac.innerHTML = '';
    
    const gp = document.getElementById('grid_peso');
    gp.style.gridTemplateColumns = estiloCols;
    gp.innerHTML = '';

    let total_acumulado = 0;
    let pesos_colunas = [];

    for(let c=0; c<cols; c++) {
        let peso_col = 0;
        let botijas_col = 0;
        for(let r=0; r<rows; r++) {
            let pilha = grid[r][c];
            botijas_col += pilha.length;
            pilha.forEach(item => peso_col += PESO_BRUTO[item]);
            
            // Só desenha no mapa superior a última linha processada para visualização
            if(r === rows-1) {
                // (Aqui simplificamos: o mapa superior mostra o resumo da coluna ou o topo)
            }
        }
        total_acumulado += botijas_col;
        pesos_colunas.push(peso_col);

        let d = document.createElement('div');
        d.className = 'celula-acumulado';
        d.innerText = total_acumulado;
        ac.appendChild(d);
    }

    // Preencher as células do mapa superior (raciocínio de empilhamento)
    for (let r = rows - 1; r >= 0; r--) {
        for (let c = 0; c < cols; c++) {
            let pilha = grid[r][c];
            let cell = document.createElement('div');
            cell.className = 'celula ' + (pilha.length ? 'bg-' + pilha[pilha.length-1] : 'bg-vazio');
            cell.innerText = pilha.length || '';
            m.appendChild(cell);
        }
    }

    // Desenhar barras de peso
    let maxP = Math.max(...pesos_colunas, 1);
    pesos_colunas.forEach(p => {
        let container = document.createElement('div');
        container.className = 'barra-container';
        container.innerHTML = `<div class="label-peso">${p}k</div><div class="barra-peso" style="height:${(p/maxP)*100}%"></div>`;
        gp.appendChild(container);
    });

    // Lado Esquerdo (Fila rows-1)
    renderLateral('grid_lat_esq', grid, rows-1);
    // Lado Direito (Fila 0)
    renderLateral('grid_lat_dir', grid, 0);
}

function renderLateral(id, grid, filaIndex) {
    const el = document.getElementById(id);
    el.style.gridTemplateColumns = `repeat(${cols}, minmax(30px, 1fr))`;
    el.innerHTML = '';
    for(let h=3; h>=0; h--) {
        for(let c=0; c<cols; c++) {
            let item = grid[filaIndex][c][h];
            let cell = document.createElement('div');
            cell.className = 'celula ' + (item ? 'bg-' + item : 'bg-vazio');
            el.appendChild(cell);
        }
    }
}

function atualizarResumo(total) {
    const res = document.getElementById('resumo');
    res.style.display = 'block';
    const ok = total <= limite_liquido;
    res.className = ok ? 'alerta-ok' : 'alerta-erro'; // Adicione estas classes no CSS se desejar
    res.innerHTML = `${ok ? '✅' : '⚠️'} Carga: ${total}kg / Limite: ${limite_liquido}kg`;
    res.style.padding = "15px";
    res.style.textAlign = "center";
    res.style.fontWeight = "bold";
    res.style.backgroundColor = ok ? "#d4edda" : "#f8d7da";
}

function trocarCaminhao() { location.reload(); }
function fecharCadastro() { document.getElementById('form-cadastro').style.display = 'none'; }
