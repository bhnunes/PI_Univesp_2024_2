from flask import Flask, request, jsonify, render_template, send_from_directory
import fitz  # PyMuPDF for PDF handling
from langdetect import detect
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from datetime import datetime
import os
from werkzeug.utils import secure_filename
import shutil
import re
import requests
import json
from dotenv import load_dotenv
from docx import Document
import io  # For handling in-memory file objects
from docx.oxml.shared import OxmlElement
from docx.oxml.ns import qn

app = Flask(__name__)

load_dotenv()

api_key = os.getenv('API_KEY')

APY_KEY=api_key

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


def docx_to_text(file_path):
    """Extract text from DOCX."""
    doc = Document(file_path)
    text = '\n'.join([paragraph.text for paragraph in doc.paragraphs])
    return text

def txt_to_text(file_path):
    """Extract text from TXT."""
    with open(file_path, 'r', encoding='utf-8') as f:
        text = f.read()
    return text

def has_more_than_two_pages(file_path):
    """Check if a file has more than 2 pages (PDF) or a certain character limit (TXT)."""
    extension = os.path.splitext(file_path)[1].lower()
    if extension == '.pdf':
        with fitz.open(file_path) as pdf:
            return pdf.page_count > 2
    elif extension == '.docx':
        doc = Document(file_path)
        return len(doc.paragraphs) > 75
    elif extension == '.txt':
        with open(file_path, 'r', encoding='utf-8') as f:
            text = f.read()
            return len(text) > 5000  # Verifica se o arquivo TXT tem mais de 10k caracteres
    else:
        return False

def contains_image(file_path):
    """Check if PDF or DOCX contains images."""
    extension = os.path.splitext(file_path)[1].lower()
    if extension == '.pdf':
        with fitz.open(file_path) as pdf:
            for page_num in range(pdf.page_count):
                page = pdf.load_page(page_num)
                if len(page.get_images(full=True)) > 0:
                    return True
        return False
    elif extension == '.docx':
        doc = Document(file_path)
        for paragraph in doc.paragraphs:
            for run in paragraph.runs:
                if run._element.xml.find(qn('w:drawing')) is not None:
                    return True
        return False
    else:
        return False

def is_portuguese(text):
    """Check if the text is in Portuguese."""
    try:
        return detect(text) == 'pt'
    except:
        return False

def check_personalinfo(text):
    phone_pattern = r'\s*\(\d{2}\)\s*\d{5}-\d{4}'
    email_pattern = r'\s*[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    linkedin_pattern= r'(?:\/\/(?:www|m)\.)?(?:linkedin\.com|linked-in\.co\.uk)(?:\/in\/)[a-zA-Z0-9-]+'
    github_pattern = r'(?:\/\/(?:www\.)?github\.com|github\.io)\/[A-Za-z0-9-]+'
    phone = re.search(phone_pattern, text)
    email = re.search(email_pattern, text)
    linkedin = re.search(linkedin_pattern, text)
    github = re.search(github_pattern, text)
    if (phone is not None) or (email is not None) or (linkedin is not None) or (github is not None) :
        return True 
    else:
        return False 


def check_portuguese_errors(text):
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent"
    headers = {"Content-Type": "application/json"}
    data = {
        "contents": [
            {"parts": [{"text": f"Analise o seguinte texto em português e me retorne em formato JSON uma lista de termos que possuem erros gramaticais, incluindo sugestões de correção. Caso o texto não tenha erros, retorne uma lista vazia. \n\n**Texto:** {text}\n\n**Formato JSON:** {{'errors': [{{'term': 'termo_com_erro', 'corrections': ['correção1', 'correção2'], 'message': 'Mensagem sobre o erro (opcional).'}}]}}\n```"}]}
        ]
    }

    response = requests.post(url, headers=headers, json=data, params={"key": APY_KEY})
    print(response.text)

    if response.status_code == 200:
        try:
            result = response.json()
            results=result["candidates"][0]["content"]['parts'][0]["text"]
            results=str(results).replace("```json","")
            results=results.replace("```","")
            result = json.loads(results)
            return result["errors"]
        except (KeyError, IndexError):
            print("Erro ao processar a resposta do Gemini.")
            return {"errors": []}
    else:
        print(f"Erro ao comunicar com o Gemini: {response.status_code}")
        return {"errors": []}


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
    
    # Verifica a extensão do arquivo
    extension = os.path.splitext(filename)[1].lower()
    
    # Lê o conteúdo do arquivo de acordo com a extensão
    if extension == '.pdf':
        resume_text = pdf_to_text(file_path)
    elif extension == '.docx':
        resume_text = docx_to_text(file_path)
    elif extension == '.txt':
        resume_text = txt_to_text(file_path)
    else:
        restart()
        return jsonify({"result": "Rejected", "reason": "Invalid file format. Please upload a PDF, DOCX, or TXT file."}), 400

    # Step 2: Check page count
    if has_more_than_two_pages(file_path):
        return jsonify({"result": "Rejected", "reason": "Resume has more than 2 pages"}), 400
    
    # Step 3: Check for image (photo)
    if contains_image(file_path):
        return jsonify({"result": "Rejected", "reason": "Resume contains a photo"}), 400
    
    # Step 4: Check language
    if not is_portuguese(resume_text):
        return jsonify({"result": "Rejected", "reason": "Resume is not in Portuguese"}), 400
    
    # Step 5: Personal ID
    if not check_personalinfo(resume_text):
        return jsonify({"result": "Rejected", "reason": "Resume Has no Email or Phone Number or Linkedin or Github for contact"}), 400
    
    # Verifica erros de português
    errors = check_portuguese_errors(resume_text)
    if errors:
        return jsonify({"result": "Rejected", "reason": "Resume contains Portuguese grammar errors", "errors": errors}), 400

    # Step 6: Calculate similarity score with job description
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