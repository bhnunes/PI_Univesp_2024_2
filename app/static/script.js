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
        const response = await fetch('/upload', {
            method: 'POST',
            body: new FormData(document.querySelector('form')) // Envia os dados do formulário
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
            // Você pode adicionar um alerta aqui para o usuário
        }
    } catch (error) {
        console.error('Erro durante a requisição:', error);
        loadingMessage.style.display = 'none';
        analiseButton.disabled = false;
        // Adicione um alerta para o usuário
    }
});

function displayAnalysisResults(data) {
    analysisResults.style.display = 'block';
    resultMessage.textContent = data.reason;
    similarityScore.textContent = data.similarity_score;
    keywordsMatching.textContent = data.keywords_matching;
    keywordsMissing.textContent = data.keywords_missing;

    if (data.errors) {
        errorList.innerHTML = ''; // Limpa a lista de erros
        for (const error of data.errors) {
            const listItem = document.createElement('li');
            listItem.innerHTML = `<strong>Termo:</strong> ${error.termo} <br> <strong>Correções:</strong> ${error.correcao} <br> <strong>Mensagem:</strong> ${error.mensagem}`;
            errorList.appendChild(listItem);
        }
    } else {
        errorList.innerHTML = ''; // Limpa a lista de erros se não houver
    }
}