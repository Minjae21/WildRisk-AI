# WildRisk-AI
WildFire AI is a next-generation AI assistant that provides hyper-local wildfire risk predictions, explanations of contributing factors, and interactive visualizations of wildfire risk. As wildfires grow more frequent and intense — particularly in areas like Los Angeles — WildFire AI empowers homeowners, community members, and officials to make informed, proactive decisions.

## Features:
1. Get a 1–10 wildfire risk score for your location based on historical burn data, live weather, and geographical features.
2. Plain-language descriptions of your top risk factors (e.g., “Your area has dry brush within 1 mile and a 35% increase in fire-prone winds this month”).
3. Visualize risk levels of nearby towns within a 10-mile radius to stay informed and advocate for safety measures like brush-clearing.
4. Ask questions about local risks, safety strategies, and more — and get AI-powered, data-informed answers in real time.

## Set up Instructions:

### Backend Setup

1. Navigate to Backend Directory

```bash
# Assuming you are in /software/
cd backend
```

2. Create and Activate Python Virtual Environment

```bash
# Create the virtual environment
python -m venv venv

# Activate the virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows
.\venv\Scripts\activate
```

3. Install Python Dependencies

```bash
pip install -r requirements.txt
```

4. Set Up Environment Variables

```bash
cp .env.example .env
```

- Open the newly created `.env` file in a text editor
- Review and modify any necessary variables. For local development, the defaults are usually fine. Key variables might include:

  - `BACKEND_CORS_ORIGINS`: Ensure this includes your frontend development server URL (e.g., `"[\"http://localhost:5173\"]"`). The default is usually set up for this.
  - `MODEL_PATH`: If you have a specific local path for your ML model.

5. Run the Backend Server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend server should now be running at `http://localhost:8000/api/v1/docs` in your browser to see the API documentation.

### Frontend Setup

1. Navigate to Frontend Directory

```bash
# Assuming you are in /software/
cd frontend
```

2. Install Node.js Dependencies

```bash
npm install
```

3. Set Up Environment Variables

```bash
cp .env.example .env
```

- Open the newly created `.env` file in a text editor.

- Add your Google Maps API Key

```dotenv
VITE_GOOGLE_MAPS_API_KEY=YOUR_ACTUAL_GOOGLE_MAPS_API_KEY_HERE
```

- Ensure `VITE_API_BASE_URL` points to your running backend (e.g., `http://localhost:8000`). The default in `.env.example` should be set for this.

4. Run the Frontend Development Server

```bash
npm run dev
```

## Instruction for use:
We ask that you put in your location in the following format when first asking for your risk rate. 
* Community = name of the town or city you live in. Please capitalize the first letter of every word.
* County = name of the county you live in
* State = the 2-letter postal code for the state you live in.

Once you see the prediction, you can then navigate to the chatbot and ask more personalized questions there. 

## Acknowledgment:

This project was part of the CS 222 course at UIUC.

## Weights and Dataset:
To obtain the weights of the model, please go to ```software/backend/ml_models```. The full implementations and fine-tuning of the model can also be found in the ```cs222-models.py```.
The dataset used for training the models can be found in ```Wildfire_dataset```.
