let conjuntoCounter = 0;

function adicionarConjunto() {
    conjuntoCounter++;
    const container = document.getElementById('conjuntosContainer');
    
    const div = document.createElement('div');
    div.id = `Partido-${conjuntoCounter}`;
    div.innerHTML = `
        <input type="text" id="nome-${conjuntoCounter}" placeholder="Nome do partido">
        <input type="number" id="votosp-${conjuntoCounter}" placeholder="Votos por partido">
        <button onclick="removerConjunto(${conjuntoCounter})">Remover</button>
    `;
    container.appendChild(div);
}

function removerConjunto(conjuntoId) {
    const conjunto = document.getElementById(`Partido-${conjuntoId}`);
    conjunto.remove();
    // recalcularValores(); // Recalcular os valores após a remoção
}

function recalcularValores() {
    const resultadosContainer = document.getElementById('resultadosContainer');
    const mensagemMaiorResto = document.getElementById('mensagemMaiorResto');
    resultadosContainer.innerHTML = ''; // Limpa os valores anteriores
    mensagemMaiorResto.innerHTML = ''; // Limpa a mensagem anterior

    let maxResto = -Infinity;
    let partidoMaxResto = '';

    for (let i = 1; i <= conjuntoCounter; i++) {
        const conjunto = document.getElementById(`Partido-${i}`);
        if (!conjunto) continue; // Pula se o conjunto foi removido

        const nome = document.getElementById(`nome-${i}`).value;
        const votos = parseFloat(document.getElementById("votos").value);
        const votosp = parseFloat(document.getElementById(`votosp-${i}`).value);
        const vagas = parseFloat(document.getElementById('vagas').value);
        
        if (isNaN(votos) || isNaN(votosp) || isNaN(vagas)) {
            alert("Por favor, preencha todos os campos numéricos no conjunto " + i);
            continue; // Ignora este conjunto e passa para o próximo
        }
        
        let qe = votos / vagas;
        let decimais = 0;
        let roundedQe = qe.toFixed(decimais);
    
        let QP = votosp / qe;
        if (QP < 1) {
            QP = 0;
        }
        let roundedQP = Math.floor(QP);

        let resto = votosp / (QP + 1);
        
        let roundedQeP = resto.toFixed(2);

        if (resto > maxResto) {
            maxResto = resto;
            partidoMaxResto = nome;
        }
        
        const valorDiv = document.createElement('div');
        valorDiv.innerHTML = `
            <p>Partido ${i}:</p>
            <p>Nome do Partido: ${nome}</p>
            <p>Votos Válidos: ${votos}</p>
            <p>Votos por Partido: ${votosp}</p>
            <p>Quantidade de Vagas: ${vagas}</p>
            <p>Quociente Eleitoral: ${roundedQe}</p>
            <p>Quantidade de vereadores: ${roundedQP}</p>
            <p>Resto: ${roundedQeP}</p>
        `;
        resultadosContainer.appendChild(valorDiv);
    }

    if (partidoMaxResto) {
        mensagemMaiorResto.innerHTML = `<p>O partido com maior resto é ${partidoMaxResto} e tem direito a mais um vereador.</p>`;
    }
}

function recarregarPagina() {
    window.location.reload();
}
