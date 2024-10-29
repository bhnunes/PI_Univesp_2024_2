from flask import Flask, request, jsonify
import fitz  # PyMuPDF for PDF handling
from langdetect import detect
from pdf2image import convert_from_path

app = Flask(__name__)

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

@app.route('/upload', methods=['POST'])
def upload_resume():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    
    file = request.files['file']
    
    # Save the file temporarily
    file_path = "/tmp/" + file.filename
    file.save(file_path)
    
    # Step 1: Convert PDF to text
    text = pdf_to_text(file_path)
    
    # Step 2: Check page count
    if has_more_than_two_pages(file_path):
        return jsonify({"result": "Rejected", "reason": "Resume has more than 2 pages"}), 400
    
    # Step 3: Check for image (photo)
    if contains_image(file_path):
        return jsonify({"result": "Rejected", "reason": "Resume contains a photo"}), 400
    
    # Step 4: Check language
    if not is_portuguese(text):
        return jsonify({"result": "Rejected", "reason": "Resume is not in Portuguese"}), 400
    
    # If all checks pass
    return jsonify({"result": "Accepted", "reason": "Resume meets all criteria"}), 200

if __name__ == '_main_':
    app.run(debug=True)