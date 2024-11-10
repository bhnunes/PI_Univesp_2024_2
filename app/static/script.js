document.addEventListener('DOMContentLoaded', () => {
    const analiseButton = document.getElementById('analiseButton');
    const loadingMessage = document.getElementById('loading-message');
    const analysisResults = document.getElementById('analysis-results');
    const resultMessage = document.getElementById('result-message');
    const similarityScore = document.getElementById('similarity-score');
    const keywordsMatching = document.getElementById('keywords-matching');
    const keywordsMissing = document.getElementById('keywords-missing');
    const errorList = document.getElementById('error-list');

    analiseButton.addEventListener('click', async () => {
        loadingMessage.style.display = 'block';
        analiseButton.disabled = true;

        try {
            const fileInput = document.getElementById('pdfFile');
            const jobDescriptionInput = document.getElementById('jobDescription');

            const file = fileInput.files[0];
            const jobDescription = jobDescriptionInput.value;

            const formData = new FormData();
            formData.append('file', file); 
            formData.append('job_description', jobDescription);

            const response = await fetch('/upload', {
                method: 'POST',
                body: formData // Envia o FormData
            });

            if (response.ok) {
                const data = await response.json();
                loadingMessage.style.display = 'none';
                analiseButton.disabled = false;
                displayAnalysisResults(data);
            } else {
                console.error('Erro ao analisar o currículo.');
                loadingMessage.style.display = 'none';
                analiseButton.disabled = false;
            }
        } catch (error) {
            console.error('Erro durante a requisição:', error);
            loadingMessage.style.display = 'none';
            analiseButton.disabled = false;
        }
    });
    
    function displayAnalysisResults(data) {
        analysisResults.style.display = 'block';
        resultMessage.textContent = data.reason;
        similarityScore.textContent = data.similarity_score;
        keywordsMatching.textContent = data.keywords_matching;
        keywordsMissing.textContent = data.keywords_missing;

        if (data.errors) {
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