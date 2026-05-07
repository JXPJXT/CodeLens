# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend application code
COPY backend/ ./backend/
COPY training/ ./training/

# Expose port 8000
EXPOSE 8000

# Set environment variables
ENV BACKEND_PORT=8000
ENV PYTHONPATH=/app

# Initialize the database (if needed) and run the app using uvicorn
CMD ["uvicorn", "backend.app:app", "--host", "0.0.0.0", "--port", "8000"]
