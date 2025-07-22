import joblib
import pandas as pd

def predict_optimal_temperature(model_path, current_data):
    """
    يأخذ بيانات حية (رطوبة، إضاءة، ... إلخ) ويتنبأ بقيمة درجة الحرارة المثلى.
    """
    model = joblib.load(model_path)
    df = pd.DataFrame([current_data])  # تحويل dict إلى DataFrame
    prediction = model.predict(df)[0]
    return prediction

if __name__ == "__main__":
    # مثال لبيانات حساسات آتية لحظيًا:
    current_input = {
        "humidity": 65.0,
        "ph_level": 6.5,
        "light_intensity": 1200
    }
    best_temperature = predict_optimal_temperature(
        "../../models/regression_model/regressor.pkl", 
        current_data=current_input
    )
    print(f"الدرجة المثلى المقترحة: {best_temperature:.2f} درجة مئوية")
