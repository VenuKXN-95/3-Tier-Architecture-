FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install dependencies first (better layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Start Uvicorn
# --host 0.0.0.0  → listen on all interfaces (required in Docker)
# --reload        → disabled in production; enable via env override if needed
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
