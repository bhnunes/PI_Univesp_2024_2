// Função para atualizar a barra de progresso
function updateProgressBar(percentage) {
    const progressBar = document.getElementById('progress-bar');
    const progressBarElement = progressBar.querySelector('.progress-bar');
    progressBarElement.style.width = percentage + '%';
    progressBarElement.setAttribute('aria-valuenow', percentage);
}

// Função para enviar a requisição para o servidor
async function sendAnalysisRequest() {
    const pdfFile = document.getElementById('pdfFile').files[0];
    const jobDescription = document.getElementById('jobDescription').value;
    const resultDiv = document.getElementById('result');
    const analiseButton = document.getElementById('analiseButton');
    const progressBar = document.getElementById('progress-bar');
    const statusContainer = document.getElementById('status-container');

    if (!pdfFile || !jobDescription) {
        resultDiv.innerHTML = "<p style='color: red;'>Por favor, faça o upload de um PDF e insira a descrição da vaga.</p>";
        return;
    }

    analiseButton.disabled = true;
    analiseButton.textContent = "Analisando...";
    progressBar.style.display = 'block';
    statusContainer.innerHTML = ''; // Limpa as mensagens de status


    // Inicia a conexão com o SocketIO
    const socket = io.connect('http://127.0.0.1:5000', { path: '/analysis' })

    const formData = new FormData();
    formData.append('file', pdfFile);
    formData.append('job_description', jobDescription);

    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });
        if (response.ok) {
            // Wait for the file_uploaded event
            socket.on('file_uploaded', (data) => {
                const file_path = data.file_path; // Get the saved file path
                const job_description = data.job_description; // Get the job description 

                // Now you have the file_path, send it to SocketIO
                socket.emit('start_analysis', { 
                    file_path: file_path, 
                    job_description: job_description 
                });

                // Remove the listener to avoid multiple calls
                socket.off('file_uploaded'); 
            });
        } else {
            console.error("Post /upload files");
        }
    } catch (error) {
        console.log(error)
    }

    // Emite o evento 'start_analysis' para iniciar a análise
    socket.emit('start_analysis', formData);

    // Escuta o evento 'analysis_progress' para atualizar a barra de progresso
    socket.on('analysis_progress', (data) => {
        updateProgressBar(data.progress);
        const statusContainer = document.getElementById('status-container');
        const newMessage = document.createElement('p');
        newMessage.textContent = data.message;
        statusContainer.appendChild(newMessage);
    });

    // Escuta o evento 'analysis_result' para exibir os resultados
    socket.on('analysis_result', (data) => {
        displayAnalysisResults(data);
        analiseButton.textContent = 'Recarregar';
        analiseButton.disabled = false;
        analiseButton.onclick = function() {
            location.reload();
        };
    });
}


// Função para exibir os resultados da análise (sem alterações)
function displayAnalysisResults(result) {
    const resultMessage = document.getElementById('result-message');
    const similarityScore = document.getElementById('similarity-score');
    const keywordsMatching = document.getElementById('keywords-matching');
    const keywordsMissing = document.getElementById('keywords-missing');
    const errorList = document.getElementById('error-list');

    resultMessage.textContent = result.reason;
    similarityScore.textContent = result.similarity_score;
    keywordsMatching.textContent = result.keywords_matching;
    keywordsMissing.textContent = result.keywords_missing;

    // Mostra os erros, se houver
    if (result.errors) {
        errorList.innerHTML = ''; // Limpa a lista de erros
        for (const error of result.errors) {
            const listItem = document.createElement('li');
            listItem.innerHTML = `<strong>Termo:</strong> ${error.termo} <br> <strong>Correções:</strong> ${error.correcao} <br> <strong>Mensagem:</strong> ${error.mensagem}`;
            errorList.appendChild(listItem);
        }
    } else {
        errorList.innerHTML = ''; // Limpa a lista de erros se não houver
    }

    const analysisResults = document.getElementById('analysis-results');
    if (analysisResults) {
        analysisResults.style.display = 'block'; // Exibe os resultados após a análise
    } else {
        console.error("Elemento 'analysis-results' não encontrado.");
    }
}

// Função para simular um delay (ajuste conforme necessário)
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Adiciona o listener de eventos quando o HTML estiver totalmente carregado
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('analiseButton').addEventListener('click', sendAnalysisRequest);
});