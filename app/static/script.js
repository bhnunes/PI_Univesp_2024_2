async function runAnalysis() {
    const pdfFile = document.getElementById('pdfFile').files[0];
    const jobDescription = document.getElementById('jobDescription').value;
    const resultDiv = document.getElementById('result');

    if (!pdfFile || !jobDescription) {
        resultDiv.innerHTML = "<p style='color: red;'>Please upload a PDF and enter a job description.</p>";
        return;
    }

    const formData = new FormData();
    formData.append('file', pdfFile);
    formData.append('job_description', jobDescription);

    resultDiv.innerHTML = "Analyzing...";

    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        if (response.ok) {
            resultDiv.innerHTML = `<p style="color: green;">${result.result}: ${result.reason}</p>`;
            resultDiv.innerHTML = `<p style="color: green;">Percentual de Match: ${result.similarity_score}</p>`;
        } else {
            resultDiv.innerHTML = `<p style="color: red;">${result.result}: ${result.reason}</p>`;
        }
    } catch (error) {
        resultDiv.innerHTML = "<p style='color: red;'>Error during analysis. Please try again.</p>";
    }
}