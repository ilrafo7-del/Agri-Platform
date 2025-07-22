import pandas as pd
from sklearn.ensemble import IsolationForest
import pickle

# مثال: بيانات الأعطال (يجب أن تجمعها فعليًا من سجل التشغيل)
df = pd.read_csv("device_usage_log.csv")  # يجب أن يحتوي على الأعمدة المذكورة أعلاه

features = ["duration", "num_starts_last_hour"]  # عدل حسب بياناتك
X = df[features]

model = IsolationForest(contamination=0.05, random_state=42)
model.fit(X)

with open("models/fault_detector.pkl", "wb") as f:
    pickle.dump(model, f)
