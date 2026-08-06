from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from google.genai.errors import ClientError

from documents import extract_text_from_file
from entity_extraction import describe_gemini_error, extract_entities

load_dotenv()

app = FastAPI()


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/ocr")
async def ocr(file: UploadFile = File(...)):
    """
    File in, text out. Images go through Tesseract, PDFs through their own
    text layer — see documents.py.

    An empty string is a valid answer, not a failure: a scanned PDF has no
    text layer and a blank screenshot has nothing to read. The caller decides
    what to do about that, and the API already answers 400 rather than
    storing evidence with nothing in it.
    """
    data = await file.read()
    return {"text": extract_text_from_file(data)}


@app.post("/extract")
async def extract(file: UploadFile | None = File(None), text: str | None = Form(None)):
    if file is not None:
        data = await file.read()
        source_text = extract_text_from_file(data)
    elif text is not None:
        source_text = text
    else:
        raise HTTPException(status_code=400, detail="Provide either 'file' or 'text'")

    # Without this, a rate limit — an expected, self-clearing condition on the
    # free tier — reaches the browser as a bare "Internal Server Error", which
    # reads as a crash and tells the user nothing about waiting.
    try:
        return extract_entities(source_text)
    except ClientError as exc:
        status_code, message = describe_gemini_error(exc)
        raise HTTPException(status_code=status_code, detail=message) from exc
