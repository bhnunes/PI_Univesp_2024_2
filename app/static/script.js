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
            resultDiv.innerHTML = `<p style="color: green;">✔️ ${result.result}: ${result.reason}</p>`;
            resultDiv.innerHTML += `<p style="color: green;">Percentual de Match Textual: ${result.similarity_score}%</p>`;
            resultDiv.innerHTML += `<p style="color: green;">Percentual de Match Contextual: ${result.contextual_score}%</p>`;
            if (result.keywords_missing.value !=='') {
                resultDiv.innerHTML += `<p style="color: green;">Adicione esses termos ao seu CV para melhorar seu score: ${result.keywords_missing}</p>`;
            };

            // Após a análise, muda o botão para 'Recarregar' e habilita
            analiseButton.textContent = 'Recarregar';
            analiseButton.disabled = false;
            analiseButton.onclick = function() {
                location.reload(); // Recarrega a página quando o botão é clicado
            };
        } else {
            resultDiv.innerHTML = `<p style="color: red;">❌ ${result.result}: ${result.reason}</p>`;
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
