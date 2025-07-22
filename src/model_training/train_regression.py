import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, r2_score

def train_regression_model(data_path, target_col="optimal_temperature"):
    """
    يدرب نموذج انحدار خطي للتنبؤ بقيمة (مثلاً درجة الحرارة المثلى).
    """
    df = pd.read_csv(data_path)
    # نفترض أن لدينا أعمدة كميزات (features): humidity, ph_level, light_intensity
    X = df[["humidity", "ph_level", "light_intensity"]]
    y = df[target_col]

    X_train, X_test, y_train, y_test = train_test_split(X, y, 
                                                        test_size=0.2, random_state=42)
    
    model = LinearRegression()
    model.fit(X_train, y_train)
    
    # تقييم النموذج
    predictions = model.predict(X_test)
    mse = mean_squared_error(y_test, predictions)
    r2 = r2_score(y_test, predictions)

    print(f"تم بناء نموذج الانحدار الخطي بنجاح.")
    print(f"MSE: {mse:.3f}, R^2: {r2:.3f}")
    
    return model

if __name__ == "__main__":
    processed_data_path = "../../data/processed/cleaned_sensor_data.csv"
    regression_model = train_regression_model(processed_data_path, target_col="optimal_temperature")
    # حفظ النموذج (Pickle)
    import joblib
    joblib.dump(regression_model, "../../models/regression_model/regressor.pkl")
    print("تم حفظ نموذج الانحدار في مجلد models/regression_model/")
