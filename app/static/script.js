document.addEventListener('DOMContentLoaded', () => {
    const analiseButton = document.getElementById('analiseButton');
    const fileInput = document.getElementById('pdfFile'); // Declaração fora do try
    const jobDescriptionInput = document.getElementById('jobDescription'); // Declaração fora do try
    const loadingMessage = document.getElementById('loading-message');
    const analysisResults = document.getElementById('analysis-results');
    const resultMessage = document.getElementById('result-message');
    const similarityScore = document.getElementById('similarity-score');
    const keywordsMatching = document.getElementById('keywords-matching');
    const keywordsMissing = document.getElementById('keywords-missing');
    const errorList = document.getElementById('error-list');

    analiseButton.addEventListener('click', async () => {
        // Validação do arquivo
        if (!fileInput.files[0]) {
            resultMessage.textContent = 'Por favor, selecione um arquivo de currículo (PDF, DOCX ou TXT).';
            resultMessage.classList.add('text-danger');
            resultMessage.classList.remove('text-success');
            analysisResults.classList.add('alert-danger');
            analysisResults.classList.remove('alert-success');
            analysisResults.style.display = 'block';
            return; // Encerra a função
        }

        // Validação da descrição da vaga
        if (jobDescriptionInput.value.trim() === '') {
            resultMessage.textContent = 'Por favor, insira a descrição da vaga.';
            resultMessage.classList.add('text-danger');
            resultMessage.classList.remove('text-success');
            analysisResults.classList.add('alert-danger');
            analysisResults.classList.remove('alert-success');
            analysisResults.style.display = 'block';
            return; // Encerra a função
        }

        // Se os dados são válidos, prossegue com a análise
        loadingMessage.style.display = 'block';
        analiseButton.disabled = true;

        try {
            const file = fileInput.files[0];
            const jobDescription = jobDescriptionInput.value;

            const formData = new FormData();
            formData.append('file', file);
            formData.append('job_description', jobDescription);

            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                loadingMessage.style.display = 'none';
                analiseButton.disabled = false;
                displayAnalysisResults(data);

                // Atualizar o botão e adicionar o evento de recarga
                analiseButton.textContent = 'Iniciar Nova Análise';
                analiseButton.removeEventListener('click', analiseButton.clickHandler);
                analiseButton.addEventListener('click', () => {
                    window.location.reload();
                });

            } else {
                console.error('Erro ao analisar o currículo.');
                loadingMessage.style.display = 'none';
                analiseButton.disabled = false;

                // Atualizar o botão e adicionar o evento de recarga
                analiseButton.textContent = 'Iniciar Nova Análise';
                analiseButton.removeEventListener('click', analiseButton.clickHandler);
                analiseButton.addEventListener('click', () => {
                    window.location.reload();
                });
            }

        } catch (error) {
            console.error('Erro durante a requisição:', error);
            loadingMessage.style.display = 'none';
            analiseButton.disabled = false;

            // Atualizar o botão e adicionar o evento de recarga
            analiseButton.textContent = 'Iniciar Nova Análise';
            analiseButton.removeEventListener('click', analiseButton.clickHandler);
            analiseButton.addEventListener('click', () => {
                window.location.reload();
            });
        }
    });


    function displayAnalysisResults(data) {
        analysisResults.style.display = 'block';

        if (data.result === 'Accepted') {
            // Resultados do CV aprovado
            resultMessage.textContent = data.reason;
            resultMessage.classList.add('text-success');
            resultMessage.classList.remove('text-danger');

            similarityScore.textContent = data.similarity_score;
            keywordsMatching.textContent = data.keywords_matching;
            keywordsMissing.textContent = data.keywords_missing;

            analysisResults.classList.add('alert-success');
            analysisResults.classList.remove('alert-danger');

            // Exibir os campos de 'Percentual de Match Textual', etc.
            similarityScore.parentElement.style.display = 'block';
            keywordsMatching.parentElement.style.display = 'block';
            keywordsMissing.parentElement.style.display = 'block';
        } else if (data.result === 'Rejected') {
            // Resultados do CV rejeitado
            resultMessage.textContent = data.reason;
            resultMessage.classList.add('text-danger');
            resultMessage.classList.remove('text-success');

            analysisResults.classList.add('alert-danger');
            analysisResults.classList.remove('alert-success');

            // Esconder os campos de 'Percentual de Match Textual', etc.
            similarityScore.parentElement.style.display = 'none';
            keywordsMatching.parentElement.style.display = 'none';
            keywordsMissing.parentElement.style.display = 'none';
        } else if (data.result === 'Attention') {
            // Resultados do CV com atenção necessária
            resultMessage.textContent = data.reason;
            resultMessage.classList.add('text-warning');
            resultMessage.classList.remove('text-success');
            resultMessage.classList.remove('text-danger');

            analysisResults.classList.add('alert-warning');
            analysisResults.classList.remove('alert-success');
            analysisResults.classList.remove('alert-danger');

            // Exibir os campos de 'Percentual de Match Textual', etc.
            similarityScore.parentElement.style.display = 'block';
            keywordsMatching.parentElement.style.display = 'block';
            keywordsMissing.parentElement.style.display = 'block';

            // Mostrar erros de português
            errorList.innerHTML = ''; 
            for (const error of data.errors) {
                const listItem = document.createElement('li');
                listItem.innerHTML = `<strong>Termo:</strong> ${error.termo} <br> <strong>Correções:</strong> ${error.correcao} <br> <strong>Mensagem:</strong> ${error.mensagem}`;
                errorList.appendChild(listItem);
            }
        } else {
            errorList.innerHTML = ''; 
        }
    }
});