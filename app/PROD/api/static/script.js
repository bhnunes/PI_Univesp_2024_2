async function runAnalysis() {
    const pdfFile = document.getElementById('pdfFile').files[0];
    const jobDescription = document.getElementById('jobDescription').value;
    const resultDiv = document.getElementById('result');
    const analiseButton = document.getElementById('analiseButton'); // Pega o botão

    if (!pdfFile || !jobDescription) {
        resultDiv.innerHTML = "<p style='color: red;'>⚠️ Por favor, faça o upload de um PDF, TXT ou DOCx e insira a descrição da vaga.</p>";
        return;
    }

    analiseButton.disabled = true; // Desabilita o botão durante a análise
    analiseButton.textContent = "Analisando..."; // Altera o texto do botão

    const formData = new FormData();
    formData.append('file', pdfFile);
    formData.append('job_description', jobDescription);

    //resultDiv.innerHTML = "Analisando... <i class='fas fa-spinner fa-spin'></i>";

    resultDiv.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="sr-only">Loading...</span></div>';

    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        if (response.ok) {
            resultDiv.innerHTML = `<p style="color: green;">✔️ <b>${result.result}</b>: ${result.reason}</p>`;
            // Calculate the color based on the similarity score
            let similarityColor = (result.similarity_score < 50) ? 'red' : 'green';
            resultDiv.innerHTML += `<p style="color: green;"><b>📝 Percentual de Match Textual</b>: <span style="font-size: 1.4em; color: ${similarityColor};">${result.similarity_score}%</span></p>`;
            resultDiv.innerHTML += `<p style="color: green;">(O quão próximo o texto do seu currículo está do texto da vaga. Quando maior a porcentagem, melhor seu ranking no sistema!)</p>`;
            // Calculate the color based on the contextual score
            let contextualColor = (result.contextual_score < 50) ? 'red' : 'green';
            resultDiv.innerHTML += `<p style="color: green;"><b>🧠 Percentual de Match Contextual</b>: <span style="font-size: 1.4em; color: ${contextualColor};">${result.contextual_score}%</span></p>`;
            resultDiv.innerHTML += `<p style="color: green;">(O quão correlacionado com o contexto da vaga está o seu currículo. Quando maior a porcentagem, mais sentido faz você se candidatar à posição!)</p>`;
            if (result.keywords_missing.value !=='') {
                resultDiv.innerHTML += `<p style="color: green;"><b>🔥 Adicione esses termos ao seu CV para melhorar seu Score</b>: ${result.keywords_missing}</p>`;
            };

            // Após a análise, muda o botão para 'Recarregar' e habilita
            analiseButton.textContent = 'Recarregar';
            analiseButton.disabled = false;
            analiseButton.onclick = function() {
                location.reload(); // Recarrega a página quando o botão é clicado
            };
        } else {
            resultDiv.innerHTML = `<p style="color: red;">❌ <b>${result.result}</b>: ${result.reason}</p>`;
            if (result.errors) { // Verifica se há erros
                resultDiv.innerHTML += "<ul>";
                for (const error of result.errors) {
                    resultDiv.innerHTML += `<li><strong>Termo:</strong> ${error.termo}</li>`;
                    resultDiv.innerHTML += `<li><strong>Correções:</strong> ${error.correcao}</li>`;
                    resultDiv.innerHTML += `<li><strong>Mensagem:</strong> ${error.mensagem}</li>`;
                    resultDiv.innerHTML += "<hr>"; // Adiciona uma linha horizontal para separar os erros
                }
                resultDiv.innerHTML += "</ul>";
            }
            analiseButton.textContent = 'Recarregar'; // Reverte o texto do botão
            analiseButton.disabled = false; // Reativa o botão
            analiseButton.onclick = function() {
                location.reload(); // Recarrega a página quando o botão é clicado
            };
        }
    } catch (error) {
        resultDiv.innerHTML = "<p style='color: red;'>❗⚠️ Erro durante a análise. Por favor, tente novamente.</p>";
        analiseButton.textContent = 'Recarregar'; // Reverte o texto do botão
        analiseButton.disabled = false; // Reativa o botão
        analiseButton.onclick = function() {
            location.reload(); // Recarrega a página quando o botão é clicado
        };
    }
}
