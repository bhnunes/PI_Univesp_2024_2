from flask import Flask, request, jsonify, render_template, send_from_directory
import fitz  # PyMuPDF for PDF handling
from langdetect import detect
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from datetime import datetime
import os
from werkzeug.utils import secure_filename
import shutil

app = Flask(__name__)

# Configura a pasta temporária
app.config['UPLOAD_FOLDER'] = os.path.join(app.root_path, 'uploads') 
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)  # Cria a pasta se não existir

def restart():
    uploads_path = os.path.join(app.root_path, 'uploads')
    if os.path.exists(uploads_path):
        shutil.rmtree(uploads_path)
        os.makedirs(uploads_path, exist_ok=True)
    return None


def pdf_to_text(file_path):
    """Extract text from PDF."""
    text = ""
    with fitz.open(file_path) as pdf:
        for page in pdf:
            text += page.get_text()
    return text

def has_more_than_two_pages(file_path):
    """Check if PDF has more than 2 pages."""
    with fitz.open(file_path) as pdf:
        return pdf.page_count > 2

def contains_image(file_path):
    """Check if PDF contains images."""
    with fitz.open(file_path) as pdf:
        for page_num in range(pdf.page_count):
            page = pdf.load_page(page_num)
            if len(page.get_images(full=True)) > 0:
                return True
    return False

def is_portuguese(text):
    """Check if the text is in Portuguese."""
    try:
        return detect(text) == 'pt'
    except:
        return False

def calculate_similarity(resume_text, job_description):
    """Calculate cosine similarity between resume text and job description."""
    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform([resume_text, job_description])
    similarity_score = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
    return similarity_score

@app.route('/')
def home():
    current_year = datetime.now().year  # Get the current year
    return render_template('index.html', current_year=current_year)

@app.route('/upload', methods=['POST'])
def upload_resume():
    if 'file' not in request.files or 'job_description' not in request.form:
        return jsonify({"error": "File or job description missing"}), 400
    
    file = request.files['file']
    job_description = request.form['job_description']
    
    # Salva o arquivo na pasta temporária
    filename = secure_filename(file.filename)
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(file_path)
    
    # Step 1: Convert PDF to text
    resume_text = pdf_to_text(file_path)
    
    # Step 2: Check page count
    if has_more_than_two_pages(file_path):
        return jsonify({"result": "Rejected", "reason": "Resume has more than 2 pages"}), 400
    
    # Step 3: Check for image (photo)
    if contains_image(file_path):
        return jsonify({"result": "Rejected", "reason": "Resume contains a photo"}), 400
    
    # Step 4: Check language
    if not is_portuguese(resume_text):
        return jsonify({"result": "Rejected", "reason": "Resume is not in Portuguese"}), 400
    
    # Step 5: Calculate similarity score with job description
    similarity_score = calculate_similarity(resume_text, job_description)

    restart()
    
    # If all checks pass
    return jsonify({
        "result": "Accepted",
        "reason": "Resume meets all criteria",
        "similarity_score": round(similarity_score * 100, 2)  # Return score as a percentage
    }), 200

@app.route('/dicas')
def dicas():
    current_year = datetime.now().year  # Get the current year
    return render_template('dicas.html', current_year=current_year)

@app.route('/validar')
def validar():
    current_year = datetime.now().year  # Get the current year
    return render_template('validar.html', current_year=current_year)


@app.route('/modelo')
def modelo():
    current_year = datetime.now().year  # Get the current year
    return render_template('modelo.html', current_year=current_year)


# Rotas para download dos modelos
@app.route('/download/<nome_arquivo>')
def download_modelo(nome_arquivo):
    return send_from_directory('static/modelos_CV', nome_arquivo, as_attachment=True)

if __name__== '_main_':
    app.run(debug=True)