from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import pandas as pd
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["POST"],
    allow_headers=["*"],
)

model = joblib.load("depression_model.pkl")

class PHQAnswers(BaseModel):
    phq1: float
    phq2: float
    phq3: float
    phq4: float
    phq5: float
    phq6: float
    phq7: float
    phq8: float
    phq9: float

@app.post("/predict")
def predict(answers: PHQAnswers):
    data = pd.DataFrame([answers.dict()])
    prediction = model.predict(data)[0]
    total_score = sum(answers.dict().values())
    return {"severity": prediction, "total_score": total_score}

anxiety_model = joblib.load("anxiety_model.pkl")

class GAD7Answers(BaseModel):
    q1: float
    q2: float
    q3: float
    q4: float
    q5: float
    q6: float
    q7: float

@app.post("/predict-anxiety")
def predict_anxiety(answers: GAD7Answers):
    # map your quiz's q1-q7 to the model's trained feature names
    feature_names = ['Q7A','Q9A','Q20A','Q28A','Q30A','Q36A','Q40A']
    values = [answers.q1, answers.q2, answers.q3, answers.q4, answers.q5, answers.q6, answers.q7]
    data = pd.DataFrame([values], columns=feature_names)
    prediction = anxiety_model.predict(data)[0]
    total_score = sum(values)
    return {"severity": prediction, "total_score": total_score}

stress_model = joblib.load("stress_model.pkl")

class StressAnswers(BaseModel):
    q1: float
    q2: float
    q3: float
    q4: float
    q5: float
    q6: float
    q7: float

@app.post("/predict-stress")
def predict_stress(answers: StressAnswers):
    feature_names = ['Q1A','Q6A','Q8A','Q11A','Q12A','Q14A','Q22A']
    values = [answers.q1, answers.q2, answers.q3, answers.q4, answers.q5, answers.q6, answers.q7]
    data = pd.DataFrame([values], columns=feature_names)
    prediction = stress_model.predict(data)[0]
    total_score = sum(values)
    return {"severity": prediction, "total_score": total_score}