"""Vietnamese text correction API on Modal — bmd1905/vietnamese-correction-v2.

Deploy (from repo root, with Modal auth):
  modal deploy modal/vietnamese_correction.py

Local smoke test:
  modal run modal/vietnamese_correction.py --text "côn viec kin doanh thì rất kho khan"

GitHub Actions workflow syncs secrets then deploys:
  HF_TOKEN → Modal secret hf-token
  MODAL_VIETNAMESE_API_KEY → Modal secret modal-vietnamese-api-key
"""

import modal

MODEL_ID = "bmd1905/vietnamese-correction-v2"
DEFAULT_MAX_LENGTH = 512

image = modal.Image.debian_slim(python_version="3.11").pip_install(
    "transformers==4.46.3",
    "torch==2.5.1",
    "fastapi[standard]==0.124.4",
)

app = modal.App("reword-stories-vietnamese-correction", image=image)

with image.imports():
    import os

    from fastapi import Depends, FastAPI, HTTPException, Security
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.security import APIKeyHeader
    from pydantic import BaseModel, Field

    api_key_scheme = APIKeyHeader(
        name="x-api-key",
        scheme_name="ApiKeyAuth",
        auto_error=False,
    )

    def verify_api_key(x_api_key: str | None = Security(api_key_scheme)):
        expected = os.environ.get("MODAL_VIETNAMESE_API_KEY", "")
        if not expected or x_api_key != expected:
            raise HTTPException(status_code=403, detail="Invalid API key")
        return x_api_key

    class CorrectRequest(BaseModel):
        text: str = Field(..., min_length=1)
        max_length: int = Field(default=DEFAULT_MAX_LENGTH, ge=64, le=512)

    class CorrectResponse(BaseModel):
        corrected_text: str


@app.cls(
    gpu="T4",
    max_containers=1,
    scaledown_window=300,
    secrets=[
        modal.Secret.from_name("hf-token"),
        modal.Secret.from_name("modal-vietnamese-api-key"),
    ],
)
@modal.concurrent(max_inputs=5)
class VietnameseCorrection:
    @modal.enter()
    def load_model(self):
        from transformers import pipeline

        self.corrector = pipeline(
            "text2text-generation",
            model=MODEL_ID,
            device=0,
        )

    @modal.method()
    def correct(self, text: str, max_length: int = DEFAULT_MAX_LENGTH) -> str:
        predictions = self.corrector(text, max_length=max_length)
        return predictions[0]["generated_text"].strip()

    @modal.asgi_app()
    def serve(self):
        web_app = FastAPI(
            title="Reword Stories Vietnamese Correction API",
            description="Vietnamese spelling and diacritic correction",
            docs_url="/docs",
            dependencies=[Depends(verify_api_key)],
        )
        web_app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

        @web_app.post("/correct")
        def correct_text(request: CorrectRequest):
            try:
                corrected = self.correct.local(request.text, request.max_length)
                return CorrectResponse(corrected_text=corrected)
            except Exception as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to correct text: {e}",
                ) from e

        return web_app


@app.local_entrypoint()
def test(text: str = "côn viec kin doanh thì rất kho khan"):
    corrector = VietnameseCorrection()
    result = corrector.correct.remote(text)
    print(result)
