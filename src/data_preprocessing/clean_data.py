import pandas as pd
import numpy as np

def remove_outliers(df, columns, z_threshold=3):
    """
    يزيل القيم الشاذة في الأعمدة المحددة بناء على إحصائية Z-score.
    """
    for col in columns:
        mean_col = df[col].mean()
        std_col = df[col].std()
        z_score = (df[col] - mean_col) / (std_col + 1e-9)
        df = df[np.abs(z_score) < z_threshold]
    return df

def fill_missing_values(df, method='mean'):
    """
    يملأ القيم المفقودة بإحدى الطرق: 'mean' أو 'median' أو 'ffill' أو غيرها.
    """
    if method == 'mean':
        return df.fillna(df.mean())
    elif method == 'median':
        return df.fillna(df.median())
    elif method in ['ffill','bfill']:
        return df.fillna(method=method)
    else:
        raise ValueError("الطريقة غير مدعومة")

def preprocess_data(df, outlier_cols, fill_method='mean'):
    """
    يقوم بإجراءات التنظيف الرئيسية: إزالة الشوائب + تعبئة القيم المفقودة.
    """
    # إزالة القيم الشاذة
    df_clean = remove_outliers(df, outlier_cols)
    # تعبئة القيم الناقصة
    df_clean = fill_missing_values(df_clean, method=fill_method)
    return df_clean

if __name__ == "__main__":
    # مثال سريع لتطبيق الدوال:
    data_path = "../../data/raw/sensor_readings.csv"  
    df_raw = pd.read_csv(data_path)
    
    # نفترض أن لدينا أعمدة باسم "temperature" و "humidity" الخ...
    df_processed = preprocess_data(df_raw, outlier_cols=["temperature", "humidity"], fill_method="mean")
    
    # حفظ البيانات المعالجة
    df_processed.to_csv("../../data/processed/cleaned_sensor_data.csv", index=False)
    print("تم تنظيف البيانات وحفظها في المجلد processed.")
