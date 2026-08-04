from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from google.genai.errors import ClientError

from entity_extraction import describe_gemini_error, extract_entities
from ocr import extract_text_from_image

load_dotenv()

app = FastAPI()


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/ocr")
async def ocr(file: UploadFile = File(...)):
    image_bytes = await file.read()
    text = extract_text_from_image(image_bytes)
    return {"text": text}


@app.post("/extract")
async def extract(file: UploadFile | None = File(None), text: str | None = Form(None)):
    if file is not None:
        image_bytes = await file.read()
        source_text = extract_text_from_image(image_bytes)
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
