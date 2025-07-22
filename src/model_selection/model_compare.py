import pandas as pd
from sklearn.metrics import mean_squared_error, accuracy_score
import joblib

def compare_regression_models(models_paths, test_data_path):
    """
    يقارن بين نماذج انحدار مختلفة من حيث MSE و R^2.
    """
    df_test = pd.read_csv(test_data_path)
    X_test = df_test[["humidity", "ph_level", "light_intensity"]]
    y_test = df_test["optimal_temperature"]
    
    results = []
    for model_path in models_paths:
        model = joblib.load(model_path)
        preds = model.predict(X_test)
        mse = mean_squared_error(y_test, preds)
        results.append((model_path, mse))
        
    # ترتيب النتائج حسب MSE تصاعديًا
    results = sorted(results, key=lambda x: x[1])
    return results

def compare_classification_models(models_paths, test_data):
    """
    كمثال: تقارن بين نماذج تصنيف الآفات أو اكتشاف الأمراض (يمكن استخدام accuracy_score أو غيره).
    """
    # سنترك الحشو بسيطًا
    # يفترض أننا نملك تنبؤات خاتمة (inference) جاهزة، وهنا مثال مبسط
    results = []
    X_test, y_test = test_data
    for model_path in models_paths:
        model = joblib.load(model_path)
        y_pred = model.predict(X_test)
        acc = accuracy_score(y_test, y_pred)
        results.append((model_path, acc))
    # ترتيب النتائج تنازليًا لأن الدقة الأعلى أفضل
    results = sorted(results, key=lambda x: x[1], reverse=True)
    return results

if __name__ == "__main__":
    # مثال للمقارنة بين نماذج انحدار
    test_data_path = "../../data/processed/cleaned_sensor_data.csv"
    models_regression = [
        "../../models/regression_model/regressor.pkl",
        # يمكن إضافة مسارات نماذج أخرى
    ]
    reg_comparison = compare_regression_models(models_regression, test_data_path)
    print("نتائج مقارنة النماذج للانحدار:")
    for path, mse in reg_comparison:
        print(f"Model: {path}, MSE: {mse:.3f}")
