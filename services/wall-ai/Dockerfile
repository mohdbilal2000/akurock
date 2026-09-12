# CPU-only image. The default torch wheels pull ~2.5GB of CUDA that never
# runs on a Render web service, so we install from the CPU index explicitly.
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    HF_HOME=/models \
    TRANSFORMERS_VERBOSITY=error

# opencv-python-headless still needs libGL's loader stubs on slim.
RUN apt-get update \
 && apt-get install -y --no-install-recommends libglib2.0-0 libgomp1 \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /srv
COPY requirements.txt ./
RUN pip install --index-url https://download.pytorch.org/whl/cpu torch==2.6.0 \
 && pip install -r requirements.txt

COPY app ./app

# Bake the weights into the image. Downloading them on first request instead
# means the first visitor waits minutes and a cold dyno can fail outright.
ARG SEG_MODEL=nvidia/segformer-b2-finetuned-ade-512-512
ARG DEPTH_MODEL=depth-anything/Depth-Anything-V2-Metric-Indoor-Small-hf
RUN python -c "\
from transformers import AutoImageProcessor, AutoModelForSemanticSegmentation, pipeline; \
AutoImageProcessor.from_pretrained('${SEG_MODEL}'); \
AutoModelForSemanticSegmentation.from_pretrained('${SEG_MODEL}'); \
pipeline('depth-estimation', model='${DEPTH_MODEL}')"

ENV WALL_AI_SEG_MODEL=${SEG_MODEL} \
    WALL_AI_DEPTH_MODEL=${DEPTH_MODEL} \
    WALL_AI_WARM_ON_START=1

EXPOSE 8000
# One worker: each worker holds its own copy of the weights, and inference
# is CPU-bound anyway. Scale with instances, not workers.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
