from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from datetime import datetime
import threading
import time

import pandas as pd
import numpy as np
import os
from datetime import datetime, timedelta

BASE_GROWTH_DIR = os.path.abspath("data/clean/growth_indicators")

# --- دالة لجلب إحصائيات القيم الحية خلال نافذة زمنية ---
def get_recent_sensor_stats(plant, window_minutes=15):
    csv_path = f"data/raw/{plant}_live.csv"
    if not os.path.exists(csv_path):
        return None
    df = pd.read_csv(csv_path)
    if "timestamp" not in df.columns:
        # إذا لم يوجد عمود الوقت، اعتبر كل القيم حديثة (للتجربة فقط)
        df["timestamp"] = datetime.now()
    else:
        df["timestamp"] = pd.to_datetime(df["timestamp"], errors='coerce')
        df = df.dropna(subset=["timestamp"])
    now = datetime.now()
    recent = df[df["timestamp"] >= now - timedelta(minutes=window_minutes)]
    if recent.empty:
        return None
    stats = {
        "temperature_mean": recent["temperature"].mean(),
        "humidity_mean": recent["humidity"].mean(),
        "ph_level_mean": recent["ph_level"].mean(),
        "light_intensity_mean": recent["light_intensity"].mean(),
        "temperature_std": recent["temperature"].std(),
        "humidity_std": recent["humidity"].std(),
        "ph_level_std": recent["ph_level"].std(),
        "light_intensity_std": recent["light_intensity"].std(),
        "start_time": recent["timestamp"].min(),
        "end_time": recent["timestamp"].max(),
        "n_samples": len(recent)
    }
    return stats

# --- دالة توقع المرض/الاضطراب من الصورة (نموذج تجريبي) ---
def predict_disease_and_disorder(image_path):
    fname = os.path.basename(image_path).lower()
    if "fungus" in fname or "فطر" in fname:
        return "مرض فطري", 0.95, None
    elif "bacteria" in fname or "بكتيريا" in fname:
        return "مرض بكتيري", 0.92, None
    elif "water" in fname or "dry" in fname or "ماء" in fname:
        return "سليم", 0.7, "نقص ماء"
    elif "light" in fname or "dark" in fname or "ضوء" in fname:
        return "سليم", 0.7, "نقص ضوء"
    elif "fertilizer" in fname or "سماد" in fname:
        return "سليم", 0.7, "نقص سماد"
    elif "heat" in fname or "حرارة" in fname:
        return "سليم", 0.7, "إجهاد حراري"
    elif "healthy" in fname or "سليم" in fname:
        return "سليم", 0.99, None
    else:
        return "سليم", 0.6, None

# --- دالة توقع الظروف المثلى (نموذج تجريبي) ---
def predict_optimal_env(plant):
    # يمكنك هنا تحميل نموذج فعلي لكل نبتة
    return {
        "temperature": 25,
        "humidity": 65,
        "ph_level": 6.5,
        "light_intensity": 350
    }

from flask import request, jsonify
import os, tempfile, shutil
from datetime import datetime

import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import MobileNetV2, ResNet50, VGG16
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Flatten
from tensorflow.keras.models import Model, Sequential

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in {'jpg','jpeg','png'}

def build_model(model_type, num_classes, input_shape=(224,224,3)):
    if model_type == "mobilenet":
        base = MobileNetV2(weights='imagenet', include_top=False, input_shape=input_shape)
        x = GlobalAveragePooling2D()(base.output)
        x = Dense(128, activation='relu')(x)
        out = Dense(num_classes, activation='softmax')(x)
        model = Model(inputs=base.input, outputs=out)
        for layer in base.layers:
            layer.trainable = False
        return model
    elif model_type == "resnet":
        base = ResNet50(weights='imagenet', include_top=False, input_shape=input_shape)
        x = GlobalAveragePooling2D()(base.output)
        x = Dense(128, activation='relu')(x)
        out = Dense(num_classes, activation='softmax')(x)
        model = Model(inputs=base.input, outputs=out)
        for layer in base.layers:
            layer.trainable = False
        return model
    elif model_type == "vgg":
        base = VGG16(weights='imagenet', include_top=False, input_shape=input_shape)
        x = Flatten()(base.output)
        x = Dense(128, activation='relu')(x)
        out = Dense(num_classes, activation='softmax')(x)
        model = Model(inputs=base.input, outputs=out)
        for layer in base.layers:
            layer.trainable = False
        return model
    elif model_type == "simple_cnn":
        model = Sequential([
            tf.keras.layers.Conv2D(32, (3,3), activation='relu', input_shape=input_shape),
            tf.keras.layers.MaxPooling2D(2,2),
            tf.keras.layers.Conv2D(64, (3,3), activation='relu'),
            tf.keras.layers.MaxPooling2D(2,2),
            tf.keras.layers.Flatten(),
            tf.keras.layers.Dense(128, activation='relu'),
            tf.keras.layers.Dense(num_classes, activation='softmax')
        ])
        return model
    else:
        raise ValueError("Model not supported")

app = Flask(__name__)
CORS(app, supports_credentials=True)
CORS(app, resources={r"/*": {"origins": "*"}})

device_health = {
    "tomato": {"pump": 100, "fan": 100},
    "cucumber": {"pump": 100, "fan": 100},
    "pepper": {"pump": 100, "fan": 100}
}
device_usage_stats = {
    "tomato": {"pump": [], "fan": []},
    "cucumber": {"pump": [], "fan": []},
    "pepper": {"pump": [], "fan": []}
}

# --- ملفات الموديلات والبيانات ---
device_states = {
    "tomato": {"pump": False, "fan": False},
    "cucumber": {"pump": False, "fan": False},
    "pepper": {"pump": False, "fan": False}
}

device_modes = {
    "tomato": {"pump": "auto", "fan": "auto"},
    "cucumber": {"pump": "auto", "fan": "auto"},
    "pepper": {"pump": "auto", "fan": "auto"}
}

sensor_states = {
    "tomato": {"temperature": True, "humidity": True, "ph_level": True, "light_intensity": True},
    "cucumber": {"temperature": True, "humidity": True, "ph_level": True, "light_intensity": True},
    "pepper": {"temperature": True, "humidity": True, "ph_level": True, "light_intensity": True}
}

event_log = []

community_posts = []

def send_alert(user, message):
    # يمكنك لاحقًا ربطها بإرسال بريد أو رسالة واتساب أو SMS
    print(f"تنبيه للمستخدم {user}: {message}")


# --- Endpoints ---
@app.route("/collect-disease-image", methods=["POST"])
def collect_disease_image():
    plant = request.form.get("plant", "unknown")
    label = request.form.get("label", "unknown")
    image = request.files.get("image")
    if not image:
        return {"status": "error", "message": "لم يتم رفع صورة"}, 400
    folder = f"data/disease_images/{plant}/{label}"
    os.makedirs(folder, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    path = os.path.join(folder, f"{timestamp}.jpg")
    image.save(path)
    return {"status": "success", "message": f"تم حفظ الصورة في {path}"}

@app.route("/latest-image")
def latest_image():
    plant = request.args.get("plant", "tomato")
    import glob, os
    folder = f"data/disease_images/{plant}/unknown"
    files = glob.glob(os.path.join(folder, "*.jpg"))
    if not files:
        return {"url": ""}
    latest = max(files, key=os.path.getctime)
    # يجب أن تجعل Flask يسمح بخدمة static من هذا المجلد أو تنسخ الصورة لمجلد static
    url = f"/static/{os.path.basename(latest)}"
    return {"url": url}

@app.route("/clean-growth-indicators-data", methods=["POST"])
def clean_growth_indicators_data():
    import os, json
    images = request.files.getlist("images")
    labels = json.loads(request.form.get("labels"))
    save_dir = "data/clean/growth_indicators"
    os.makedirs(save_dir, exist_ok=True)
    for img in images:
        img.save(os.path.join(save_dir, img.filename))
    with open(os.path.join(save_dir, "labels.json"), "w", encoding="utf-8") as f:
        json.dump(labels, f, ensure_ascii=False, indent=2)
    return {"status": "success", "message": "تم حفظ الصور والوسوم النظيفة"}

@app.route("/feature-importance", methods=["POST"])
def feature_importance():
    return jsonify({"importances": []})

@app.route("/error-analysis", methods=["POST"])
def error_analysis():
    data = request.get_json()
    data_path = data.get("data_path")
    features = data.get("features", ["temperature", "humidity", "ph_level", "light_intensity"])
    target_col = data.get("target_col", "temperature")
    model_path = f"models/regression_model/tomato_random_forest_model.pkl"  # يمكنك جعله ديناميكياً حسب الحاجة

    import pandas as pd
    import pickle
    import numpy as np

    df = pd.read_csv(data_path)
    for col in features + [target_col]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce')
    df = df.dropna(subset=features + [target_col])

    X = df[features]
    y = df[target_col]

    if isinstance(data_path, list):
        data_path = data_path[0]
    try:
        with open(model_path, "rb") as f:
            model = pickle.load(f)
        preds = model.predict(X)
        errors = y - preds
        abs_errors = np.abs(errors)
        analysis = {
            "متوسط الخطأ المطلق": round(float(np.mean(abs_errors)), 4),
            "أكبر خطأ مطلق": round(float(np.max(abs_errors)), 4),
            "أصغر خطأ مطلق": round(float(np.min(abs_errors)), 4),
            "الخطأ المعياري": round(float(np.std(errors)), 4),
            "عدد العينات": int(len(errors)),
            "أكبر 5 أخطاء (رقم العينة: الخطأ)": {int(i): round(float(e), 4) for i, e in abs_errors.sort_values(ascending=False).head(5).items()},
            "توزيع الأخطاء (أول 10)": [round(float(e), 4) for e in errors[:10]]
        }
    except Exception as e:
        analysis = {"خطأ": str(e)}

    return jsonify({"analysis": analysis})

@app.route("/list-files", methods=["GET"])
def list_files():
    folder = request.args.get("folder", "")
    allowed_folders = [
        "data/raw",
        "data/processed",
        "models/regression_model",
        "models/object_detection_model"
    ]
    if folder not in allowed_folders:
        return jsonify({"files": []})
    try:
        files = []
        for filename in os.listdir(folder):
            if filename.endswith(".csv") or filename.endswith(".pkl"):
                files.append({
                    "name": filename,
                    "path": os.path.join(folder, filename)
                })
        return jsonify({"files": files})
    except Exception as e:
        return jsonify({"files": [], "error": str(e)})

@app.route("/preprocess", methods=["POST", "OPTIONS"])
def clean_raw_data():
    if request.method == "OPTIONS":
        return '', 200
    data = request.get_json()
    raw_path = data.get("raw_path")
    plant = data.get("plant")
    if not raw_path or not plant:
        return jsonify({"status": "error", "message": "يرجى تحديد اسم النبتة وملف البيانات الخام"}), 400

    processed_path = f"data/processed/{plant}_train.csv"

    import pandas as pd
    import numpy as np

    df = pd.read_csv(raw_path)

    # حذف الصفوف غير المكتملة في الأعمدة الأساسية
    df = df.dropna(subset=["temperature", "humidity", "ph_level", "light_intensity", "optimal_temperature"])

    # تحويل الأعمدة الرقمية إلى أرقام والتعامل مع القيم غير الرقمية
    for col in ["temperature", "humidity", "ph_level", "light_intensity", "optimal_temperature"]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce')

    # حذف القيم غير المنطقية
    if "temperature" in df.columns:
        df = df[(df["temperature"] >= -10) & (df["temperature"] <= 60)]
    if "optimal_temperature" in df.columns:
        df = df[(df["optimal_temperature"] >= -10) & (df["optimal_temperature"] <= 60)]

    # حذف الصفوف المكررة
    df = df.drop_duplicates()

    # حذف الصفوف التي تحتوي على نسبة كبيرة من القيم المفقودة
    thresh = int(0.5 * len(df.columns))
    df = df.dropna(thresh=thresh)

    # تعويض القيم المفقودة في الأعمدة الرقمية بمتوسط العمود
    num_cols = df.select_dtypes(include=['number']).columns
    df[num_cols] = df[num_cols].fillna(df[num_cols].mean())

    # إعادة ضبط الفهارس
    df = df.reset_index(drop=True)

    # حفظ البيانات النظيفة
    df.to_csv(processed_path, index=False)

    return jsonify({"status": "success", "message": f"تمت عملية تنظيف البيانات بنجاح وحفظها في {processed_path}"})

@app.route("/explain-model", methods=["POST"])
def explain_model():
    data = request.get_json()
    data_path = data.get("data_path")
    df = pd.read_csv(data_path)
    feature_cols = ["temperature", "humidity", "ph_level", "light_intensity"]
    X = df[feature_cols]
    with open("models/rf_model.pkl", "rb") as f:
        model = pickle.load(f)
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X)
    # نعيد أهم 4 ميزات أثرت في القرار لأول صف
    feature_importance = sorted(
        zip(feature_cols, shap_values[0]), key=lambda x: abs(x[1]), reverse=True
    )
    explanation = [
        {"feature": f, "impact": round(val, 3)}
        for f, val in feature_importance[:4]
    ]
    return jsonify({"explanation": explanation})

@app.route("/train-model", methods=["POST", "OPTIONS"])
def train_model():
    if request.method == "OPTIONS":
        return '', 200
    data = request.get_json()
    data_path = data.get("data_path")
    target_col = data.get("target_col")
    model_save_path = data.get("model_save_path")
    algorithm = data.get("algorithm", "linear")
    features = data.get("features", ["temperature", "humidity", "ph_level", "light_intensity"])
    params = data.get("params", {})

    if not data_path or not target_col or not model_save_path:
        return jsonify({"status": "error", "message": "يرجى تحديد ملف التدريب وعمود الهدف واسم النموذج"}), 400

    import pandas as pd
    import pickle
    import time
    from sklearn.metrics import mean_squared_error, mean_absolute_error
    from math import sqrt

    from sklearn.linear_model import LinearRegression
    from sklearn.tree import DecisionTreeRegressor
    from sklearn.ensemble import RandomForestRegressor

    df = pd.read_csv(data_path)
    for col in features + [target_col]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce')
    df = df.dropna(subset=features + [target_col])

    X = df[features]
    y = df[target_col]

    # اختيار النموذج المناسب مع المعلمات
    if algorithm == "linear":
        model = LinearRegression()
        start = time.time()
        model.fit(X, y)
        train_time = time.time() - start
        with open(model_save_path, "wb") as f:
            pickle.dump(model, f)
        preds = model.predict(X)
        score = model.score(X, y)
    elif algorithm == "decision_tree":
        model = DecisionTreeRegressor(**params)
        start = time.time()
        model.fit(X, y)
        train_time = time.time() - start
        with open(model_save_path, "wb") as f:
            pickle.dump(model, f)
        preds = model.predict(X)
        score = model.score(X, y)
    elif algorithm == "random_forest":
        model = RandomForestRegressor(**params)
        start = time.time()
        model.fit(X, y)
        train_time = time.time() - start
        with open(model_save_path, "wb") as f:
            pickle.dump(model, f)
        preds = model.predict(X)
        score = model.score(X, y)
    elif algorithm == "neural_network":
        from tensorflow.keras.models import Sequential
        from tensorflow.keras.layers import Dense
        import numpy as np

        # إعداد معلمات الشبكة العصبية
        epochs = int(params.get("epochs", 30))
        layers = int(params.get("layers", 2))
        units = int(params.get("units", 16))

        model = Sequential()
        model.add(Dense(units, activation='relu', input_shape=(len(features),)))
        for _ in range(layers - 1):
            model.add(Dense(units, activation='relu'))
        model.add(Dense(1))

        model.compile(optimizer='adam', loss='mse')
        start = time.time()
        model.fit(np.array(X), np.array(y), epochs=epochs, verbose=0)
        train_time = time.time() - start
        model.save(model_save_path.replace(".pkl", ".h5"))

        preds = model.predict(np.array(X)).flatten()
        # score = 1 - (MSE / variance) (R2 score يدوي)
        mse = mean_squared_error(y, preds)
        score = 1 - mse / np.var(y)
    else:
        return jsonify({"status": "error", "message": "خوارزمية غير مدعومة"}), 400

    mse = mean_squared_error(y, preds)
    mae = mean_absolute_error(y, preds)
    rmse = sqrt(mse)
    return jsonify({
        "status": "success",
        "message": "...",
        "score": float(score),
        "metrics": {
            "mse": float(mse),
            "mae": float(mae),
            "rmse": float(rmse),
            "train_time": float(train_time)
        }
    })

@app.route("/shap-explain", methods=["POST"])
def shap_explain():
    data = request.get_json()
    features = data.get("features", [])
    # مثال: أرجع قيم SHAP عشوائية (للتجربة فقط)
    import numpy as np
    shap_values = {f: float(np.random.randn()) for f in features}
    return jsonify({"shap_values": shap_values})

@app.route("/compare-models", methods=["POST", "OPTIONS"])
def compare_models():
    if request.method == "OPTIONS":
        return '', 200
    data = request.get_json()
    model1_path = data.get("model1_path")
    model2_path = data.get("model2_path")
    test_data_path = data.get("test_data_path")

    for path, name in zip([model1_path, model2_path, test_data_path], ["النموذج الأول", "النموذج الثاني", "ملف البيانات"]):
        if not path or not os.path.exists(path):
            return jsonify({"status": "error", "message": f"{name} غير موجود: {path}"}), 400

    import pandas as pd
    import pickle
    from sklearn.metrics import mean_squared_error

    # استخدم نفس الأعمدة ونفس الترتيب
    feature_cols = ["temperature", "humidity", "ph_level", "light_intensity"]
    target_col = "optimal_temperature"

    df = pd.read_csv(test_data_path)

    # تنظيف الأعمدة الرقمية
    for col in feature_cols + [target_col]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce')

    # حذف الصفوف التي فيها قيم مفقودة في أي من الأعمدة المطلوبة
    df = df.dropna(subset=feature_cols + [target_col])

    X = df[feature_cols]
    y = df[target_col]

    with open(model1_path, "rb") as f:
        model1 = pickle.load(f)
    with open(model2_path, "rb") as f:
        model2 = pickle.load(f)

    pred1 = model1.predict(X)
    pred2 = model2.predict(X)

    mse1 = mean_squared_error(y, pred1)
    mse2 = mean_squared_error(y, pred2)

    msg = f"النموذج الأول MSE: {mse1:.3f} | النموذج الثاني MSE: {mse2:.3f}"
    return {"status": "success", "message": msg}

@app.route("/train-growth-indicators-models", methods=["POST"])
def train_growth_indicators_models():
    import tempfile, shutil, time, json
    from sklearn.preprocessing import MultiLabelBinarizer
    from tensorflow.keras.preprocessing import image as keras_image
    import numpy as np

    images = request.files.getlist("images")
    labels_file = request.files.get("labels_file")
    models = request.form.get("models")
    epochs = int(request.form.get("epochs", 10))
    params = request.form.get("params")
    if models:
        models = json.loads(models)
    else:
        models = ["mobilenet"]
    if params:
        params = json.loads(params)
    else:
        params = {}

    # 1. حفظ الصور مؤقتًا
    temp_dir = tempfile.mkdtemp()
    img_paths = []
    for img in images:
        if not allowed_file(img.filename): continue
        img_path = os.path.join(temp_dir, img.filename)
        os.makedirs(os.path.dirname(img_path), exist_ok=True)
        img.save(img_path)
        img_paths.append(img_path)

    # 2. تحميل ملف الوسوم
    import csv
    import io

    labels_dict = None
    if labels_file:
        filename = labels_file.filename.lower()
        if filename.endswith(".json"):
            print("DEBUG: labels_file.filename =", labels_file.filename)
            print("DEBUG: labels_file.read() =", labels_file.read())
            labels_file.seek(0)
            labels_dict = json.load(labels_file)
        elif filename.endswith(".csv"):
            # قراءة ملف CSV وتحويله إلى dict
            labels_dict = {}
            content = labels_file.read().decode("utf-8")
            reader = csv.reader(io.StringIO(content))
            next(reader, None)  # تخطي الرأس
            for row in reader:
                if len(row) >= 2:
                    labels_dict[row[0]] = [l.strip() for l in row[1].split(",") if l.strip()]
        else:
            raise Exception("صيغة ملف الوسوم غير مدعومة (يجب أن يكون CSV أو JSON)")
    else:
        raise Exception("لم يتم إرسال ملف الوسوم")

    labels_list = [labels_dict.get(os.path.basename(p), []) for p in img_paths]

    # 3. تجهيز MultiLabelBinarizer
    mlb = MultiLabelBinarizer()
    Y = mlb.fit_transform(labels_list)
    num_labels = len(mlb.classes_)

    # 4. مولد بيانات
    def data_generator(img_paths, Y, batch_size=16):
        while True:
            for i in range(0, len(img_paths), batch_size):
                batch_paths = img_paths[i:i+batch_size]
                batch_labels = Y[i:i+batch_size]
                batch_imgs = []
                for path in batch_paths:
                    img = keras_image.load_img(path, target_size=(224,224))
                    img = keras_image.img_to_array(img) / 255.0
                    batch_imgs.append(img)
                yield np.array(batch_imgs), np.array(batch_labels)

    steps_per_epoch = int(np.ceil(len(img_paths)/16))
    val_split = int(0.2 * len(img_paths))
    train_paths, val_paths = img_paths[val_split:], img_paths[:val_split]
    train_Y, val_Y = Y[val_split:], Y[:val_split]

    results = []
    for model_type in models:
        try:
            model_params = params.get(model_type, {})
            # بناء النموذج
            from tensorflow.keras.applications import MobileNetV2, ResNet50, VGG16
            from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Flatten
            from tensorflow.keras.models import Model, Sequential

            if model_type == "mobilenet":
                learning_rate = model_params.get("learning_rate", 0.001)
                freeze_base = model_params.get("freeze_base", True)
                base = MobileNetV2(weights='imagenet', include_top=False, input_shape=(224,224,3))
                x = GlobalAveragePooling2D()(base.output)
                x = Dense(128, activation='relu')(x)
                out = Dense(num_labels, activation='sigmoid')(x)
                model = Model(inputs=base.input, outputs=out)
                for layer in base.layers:
                    layer.trainable = not freeze_base
                model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate), loss='binary_crossentropy', metrics=[tf.keras.metrics.BinaryAccuracy()])
            elif model_type == "resnet":
                learning_rate = model_params.get("learning_rate", 0.001)
                freeze_base = model_params.get("freeze_base", True)
                base = ResNet50(weights='imagenet', include_top=False, input_shape=(224,224,3))
                x = GlobalAveragePooling2D()(base.output)
                x = Dense(128, activation='relu')(x)
                out = Dense(num_labels, activation='sigmoid')(x)
                model = Model(inputs=base.input, outputs=out)
                for layer in base.layers:
                    layer.trainable = not freeze_base
                model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate), loss='binary_crossentropy', metrics=[tf.keras.metrics.BinaryAccuracy()])
            elif model_type == "vgg":
                learning_rate = model_params.get("learning_rate", 0.001)
                freeze_base = model_params.get("freeze_base", True)
                base = VGG16(weights='imagenet', include_top=False, input_shape=(224,224,3))
                x = Flatten()(base.output)
                x = Dense(128, activation='relu')(x)
                out = Dense(num_labels, activation='sigmoid')(x)
                model = Model(inputs=base.input, outputs=out)
                for layer in base.layers:
                    layer.trainable = not freeze_base
                model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate), loss='binary_crossentropy', metrics=[tf.keras.metrics.BinaryAccuracy()])
            elif model_type == "simple_cnn":
                layers = model_params.get("layers", 2)
                filters = model_params.get("filters", 32)
                learning_rate = model_params.get("learning_rate", 0.001)
                model = Sequential()
                model.add(tf.keras.layers.Conv2D(filters, (3,3), activation='relu', input_shape=(224,224,3)))
                model.add(tf.keras.layers.MaxPooling2D(2,2))
                for _ in range(layers-1):
                    model.add(tf.keras.layers.Conv2D(filters, (3,3), activation='relu'))
                    model.add(tf.keras.layers.MaxPooling2D(2,2))
                model.add(tf.keras.layers.Flatten())
                model.add(tf.keras.layers.Dense(128, activation='relu'))
                model.add(tf.keras.layers.Dense(num_labels, activation='sigmoid'))
                model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate), loss='binary_crossentropy', metrics=[tf.keras.metrics.BinaryAccuracy()])
            else:
                raise ValueError("Model not supported")

            start = time.time()
            history = model.fit(
                data_generator(train_paths, train_Y),
                steps_per_epoch=max(1, int(np.ceil(len(train_paths)/16))),
                epochs=epochs,
                validation_data=data_generator(val_paths, val_Y),
                validation_steps=max(1, int(np.ceil(len(val_paths)/16))),
                verbose=0
            )
            train_time = time.time() - start
            val_acc = history.history.get('val_binary_accuracy', [0])[-1]
            # احفظ النموذج
            model_save_dir = f"models/growth_indicators_model/{model_type}"
            os.makedirs(model_save_dir, exist_ok=True)
            model.save(os.path.join(model_save_dir, "model.h5"))
            results.append({
                "model": model_type,
                "accuracy": float(val_acc),
                "train_time": float(train_time)
            })
        except Exception as e:
            results.append({
                "model": model_type,
                "error": str(e)
            })
    shutil.rmtree(temp_dir)
    return jsonify({"results": results})

@app.route("/list-images-in-folder")
def list_images_in_folder():
    folder = request.args.get("folder")
    base_dir = BASE_GROWTH_DIR
    folder_path = os.path.join(base_dir, folder)
    if not os.path.isdir(folder_path):
        return jsonify({"images": []})
    images = [f for f in os.listdir(folder_path) if f.lower().endswith((".jpg", ".jpeg", ".png"))]
    # أعد الأسماء مع اسم المجلد إذا لزم الأمر
    images = [f"{folder}/{img}" for img in images]
    return jsonify({"images": images})

@app.route("/growth-indicators-labels")
def growth_indicators_labels():
    import os
    file = request.args.get("file")
    path = os.path.join(BASE_GROWTH_DIR, file)
    if os.path.exists(path):
        return send_from_directory(BASE_GROWTH_DIR, file)
    else:
        return "", 404

@app.route("/list-growth-indicators-data", methods=["GET"])
def list_growth_indicators_data():
    import os
    import csv
    import json
    data_dir = "data/clean/growth_indicators"
    images = []
    labels_dict = {}

    # جلب الصور
    if os.path.exists(data_dir):
        images = [f for f in os.listdir(data_dir) if f.lower().endswith((".jpg", ".jpeg", ".png"))]

    # جلب الوسوم (من labels.csv أو labels.json)
    csv_path = os.path.join(data_dir, "labels.csv")
    json_path = os.path.join(data_dir, "labels.json")
    if os.path.exists(csv_path):
        with open(csv_path, encoding="utf-8") as f:
            reader = csv.reader(f)
            next(reader, None)  # skip header
            for row in reader:
                if len(row) >= 2:
                    labels_dict[row[0]] = [l.strip() for l in row[1].split(",") if l.strip()]
    elif os.path.exists(json_path):
        with open(json_path, encoding="utf-8") as f:
            labels_dict = json.load(f)

    # دمج الصور مع وسومها
    data = []
    for img in images:
        data.append({
            "image": img,
            "labels": labels_dict.get(img, [])
        })
    return jsonify({"data": data})

@app.route("/add-growth-image", methods=["POST"])
def add_growth_image():
    import os
    import csv

    image = request.files.get("image")
    labels = request.form.get("labels")  # "green,seedling"
    if not image or not labels:
        return {"status": "error", "message": "يرجى رفع صورة واختيار وسوم"}, 400

    save_dir = "data/clean/growth_indicators"
    os.makedirs(save_dir, exist_ok=True)
    img_path = os.path.join(save_dir, image.filename)
    image.save(img_path)

    csv_path = os.path.join(save_dir, "labels.csv")
    file_exists = os.path.exists(csv_path)
    # إذا كانت الصورة موجودة مسبقًا في CSV، احذف السطر القديم
    rows = []
    if file_exists:
        with open(csv_path, "r", encoding="utf-8") as f:
            reader = csv.reader(f)
            rows = list(reader)
        rows = [row for row in rows if row[0] != image.filename]
    else:
        rows = [["image", "labels"]]
    rows.append([image.filename, labels])
    with open(csv_path, "w", newline='', encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerows(rows)
    return {"status": "success", "message": "تمت إضافة الصورة وتحديث ملف الوسوم"}

@app.route("/delete-growth-image", methods=["POST"])
def delete_growth_image():
    import os
    import csv
    data = request.get_json()
    img_name = data.get("image")
    save_dir = "data/clean/growth_indicators"
    img_path = os.path.join(save_dir, img_name)
    if os.path.exists(img_path):
        os.remove(img_path)
    csv_path = os.path.join(save_dir, "labels.csv")
    if os.path.exists(csv_path):
        with open(csv_path, "r", encoding="utf-8") as f:
            rows = list(csv.reader(f))
        rows = [row for row in rows if row[0] != img_name]
        with open(csv_path, "w", newline='', encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerows(rows)
    return {"status": "success", "message": "تم حذف الصورة والوسوم"}

@app.route("/delete-growth-label", methods=["POST"])
def delete_growth_label():
    import os
    import csv
    data = request.get_json()
    img_name = data.get("image")
    label = data.get("label")
    save_dir = "data/clean/growth_indicators"
    csv_path = os.path.join(save_dir, "labels.csv")
    if os.path.exists(csv_path):
        with open(csv_path, "r", encoding="utf-8") as f:
            rows = list(csv.reader(f))
        for row in rows:
            if row[0] == img_name:
                labels = [l.strip() for l in row[1].split(",") if l.strip() and l.strip() != label]
                row[1] = ",".join(labels)
        with open(csv_path, "w", newline='', encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerows(rows)
    return {"status": "success", "message": "تم حذف الوسم من الصورة"}

@app.route("/list-growth-folders-csvs", methods=["GET"])
def list_growth_folders_csvs():
    import os
    base_dir = BASE_GROWTH_DIR
    folders = []
    csvs = []
    if os.path.exists(base_dir):
        for entry in os.listdir(base_dir):
            path = os.path.join(base_dir, entry)
            if os.path.isdir(path):
                folders.append(entry)
            elif entry.lower().endswith((".csv", ".json")):
                csvs.append(entry)
    return jsonify({"folders": folders, "csvs": csvs})

@app.route("/download-growth-data", methods=["POST"])
def download_growth_data():
    import os, zipfile, io, json
    data = request.get_json()
    folders = data.get("folders", [])
    csv_files = data.get("csvs", [])
    base_dir = BASE_GROWTH_DIR
    mem_zip = io.BytesIO()
    with zipfile.ZipFile(mem_zip, "w") as zf:
        # أضف الصور من المجلدات المختارة
        for folder in folders:
            folder_path = os.path.join(base_dir, folder)
            if os.path.isdir(folder_path):
                for fname in os.listdir(folder_path):
                    if fname.lower().endswith((".jpg", ".jpeg", ".png")):
                        zf.write(os.path.join(folder_path, fname), arcname=f"{folder}/{fname}")
        # أضف ملفات csv المختارة
        for csvf in csv_files:
            csv_path = os.path.join(base_dir, csvf)
            if os.path.isfile(csv_path):
                zf.write(csv_path, arcname=csvf)
    mem_zip.seek(0)
    return (
        mem_zip.read(),
        200,
        {
            "Content-Type": "application/zip",
            "Content-Disposition": "attachment; filename=growth_data.zip"
        }
    )

from flask import send_from_directory

@app.route("/growth-indicators-image/<path:filename>")
def growth_indicators_image(filename):
    return send_from_directory(BASE_GROWTH_DIR, filename)

@app.route("/train-disease-models", methods=["POST"])
def train_disease_models():
    images = request.files.getlist("images")
    labels = request.form.getlist("labels")
    models = request.form.get("models")
    epochs = int(request.form.get("epochs", 10))
    params = request.form.get("params")
    if models:
        import json
        models = json.loads(models)
    else:
        models = ["mobilenet"]
    if params:
        import json
        params = json.loads(params)
    else:
        params = {}

    temp_dir = tempfile.mkdtemp()
    label_set = set(labels)
    for img, label in zip(images, labels):
        if not allowed_file(img.filename): continue
        label_dir = os.path.join(temp_dir, label)
        os.makedirs(label_dir, exist_ok=True)
        img.save(os.path.join(label_dir, img.filename))
    datagen = ImageDataGenerator(rescale=1./255, validation_split=0.2)
    train_gen = datagen.flow_from_directory(
        temp_dir, target_size=(224,224), batch_size=16, class_mode='categorical', subset='training')
    val_gen = datagen.flow_from_directory(
        temp_dir, target_size=(224,224), batch_size=16, class_mode='categorical', subset='validation')
    num_classes = train_gen.num_classes

    results = []
    for model_type in models:
        try:
            model_params = params.get(model_type, {})
            # إعداد المعلمات الخاصة بكل نموذج
            if model_type == "mobilenet":
                learning_rate = model_params.get("learning_rate", 0.001)
                freeze_base = model_params.get("freeze_base", True)
                base = MobileNetV2(weights='imagenet', include_top=False, input_shape=(224,224,3))
                x = GlobalAveragePooling2D()(base.output)
                x = Dense(128, activation='relu')(x)
                out = Dense(num_classes, activation='softmax')(x)
                model = Model(inputs=base.input, outputs=out)
                for layer in base.layers:
                    layer.trainable = not freeze_base
                model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate), loss='categorical_crossentropy', metrics=['accuracy'])
            elif model_type == "resnet":
                learning_rate = model_params.get("learning_rate", 0.001)
                freeze_base = model_params.get("freeze_base", True)
                base = ResNet50(weights='imagenet', include_top=False, input_shape=(224,224,3))
                x = GlobalAveragePooling2D()(base.output)
                x = Dense(128, activation='relu')(x)
                out = Dense(num_classes, activation='softmax')(x)
                model = Model(inputs=base.input, outputs=out)
                for layer in base.layers:
                    layer.trainable = not freeze_base
                model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate), loss='categorical_crossentropy', metrics=['accuracy'])
            elif model_type == "vgg":
                learning_rate = model_params.get("learning_rate", 0.001)
                freeze_base = model_params.get("freeze_base", True)
                base = VGG16(weights='imagenet', include_top=False, input_shape=(224,224,3))
                x = Flatten()(base.output)
                x = Dense(128, activation='relu')(x)
                out = Dense(num_classes, activation='softmax')(x)
                model = Model(inputs=base.input, outputs=out)
                for layer in base.layers:
                    layer.trainable = not freeze_base
                model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate), loss='categorical_crossentropy', metrics=['accuracy'])
            elif model_type == "simple_cnn":
                layers = model_params.get("layers", 2)
                filters = model_params.get("filters", 32)
                learning_rate = model_params.get("learning_rate", 0.001)
                model = Sequential()
                model.add(tf.keras.layers.Conv2D(filters, (3,3), activation='relu', input_shape=(224,224,3)))
                model.add(tf.keras.layers.MaxPooling2D(2,2))
                for _ in range(layers-1):
                    model.add(tf.keras.layers.Conv2D(filters, (3,3), activation='relu'))
                    model.add(tf.keras.layers.MaxPooling2D(2,2))
                model.add(tf.keras.layers.Flatten())
                model.add(tf.keras.layers.Dense(128, activation='relu'))
                model.add(tf.keras.layers.Dense(num_classes, activation='softmax'))
                model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate), loss='categorical_crossentropy', metrics=['accuracy'])
            else:
                raise ValueError("Model not supported")

            import time
            start = time.time()
            history = model.fit(train_gen, validation_data=val_gen, epochs=epochs, verbose=0)
            train_time = time.time() - start
            val_acc = history.history.get('val_binary_accuracy', [0])[-1]
            results.append({
                "model": model_type,
                "accuracy": float(val_acc),
                "train_time": float(train_time)
            })
        except Exception as e:
            results.append({
                "model": model_type,
                "error": str(e)
            })
    shutil.rmtree(temp_dir)
    return jsonify({"results": results})

# --- Endpoint القرار الذكي مع الزمن ---
@app.route("/smart-decision", methods=["POST"])
def smart_decision():
    plant = request.form.get("plant", "unknown")
    image = request.files.get("image")
    window_minutes = int(request.form.get("window_minutes", 15))
    os.makedirs("tmp", exist_ok=True)
    path = os.path.join("tmp", f"{datetime.now().strftime('%Y%m%d_%H%M%S')}.jpg")
    image.save(path)


    # 1. تحليل الصورة
    disease, disease_conf, disorder = predict_disease_and_disorder(path)

    # 2. جلب إحصائيات القيم الحية خلال نافذة زمنية
    stats = get_recent_sensor_stats(plant, window_minutes=window_minutes)
    if stats is None:
        return {"status": "error", "message": "لا توجد قراءات مستشعرات حديثة كافية"}, 400

    # 3. توقع الظروف المثلى
    optimal = predict_optimal_env(plant)
    diffs = {
        "temperature": stats["temperature_mean"] - optimal["temperature"],
        "humidity": stats["humidity_mean"] - optimal["humidity"],
        "ph_level": stats["ph_level_mean"] - optimal["ph_level"],
        "light_intensity": stats["light_intensity_mean"] - optimal["light_intensity"]
    }
    notes = []
    actions = []

    # 4. منطق القرار الذكي مع الزمن
    if disease == "مرض فطري" and disease_conf > 0.8:
        actions.append("رش مبيد فطري")
        notes.append("تم كشف مرض فطري بالصور بثقة عالية")
    elif disease == "مرض بكتيري" and disease_conf > 0.8:
        actions.append("رش مبيد بكتيري")
        notes.append("تم كشف مرض بكتيري بالصور بثقة عالية")
    elif disorder == "نقص ماء" or (diffs["humidity"] < -15):
        actions.append("تشغيل الري")
        notes.append("الرطوبة أقل بكثير من المثلى أو أعراض نقص ماء بالصور خلال آخر {} دقيقة".format(window_minutes))
    elif disorder == "نقص سماد" or (diffs["ph_level"] < -0.5):
        actions.append("إضافة سماد")
        notes.append("PH منخفض أو أعراض نقص سماد بالصور خلال آخر {} دقيقة".format(window_minutes))
    elif disorder == "نقص ضوء" or (diffs["light_intensity"] < -100):
        actions.append("تشغيل الإضاءة")
        notes.append("شدة الإضاءة أقل من المثلى أو أعراض نقص ضوء بالصور خلال آخر {} دقيقة".format(window_minutes))
    elif disorder == "إجهاد حراري" or (diffs["temperature"] > 7):
        actions.append("تشغيل التهوية")
        notes.append("درجة الحرارة أعلى من المثلى أو أعراض إجهاد حراري بالصور خلال آخر {} دقيقة".format(window_minutes))
    elif disease == "سليم" and all(abs(d) < 5 for d in diffs.values()):
        actions.append("لا إجراء")
        notes.append("النبات سليم وكل القيم قريبة من المثلى خلال آخر {} دقيقة".format(window_minutes))
    else:
        actions.append("مراجعة يدوية")
        notes.append("حالة غير واضحة أو تضارب في القيم خلال آخر {} دقيقة".format(window_minutes))

    # 5. سجل القرار مع الزمن
    event_log.append({
        "time": datetime.now().isoformat(),
        "plant": plant,
        "disease": disease,
        "disease_conf": disease_conf,
        "disorder": disorder,
        "sensor_stats": stats,
        "optimal": optimal,
        "diffs": diffs,
        "actions": actions,
        "notes": notes,
        "window_minutes": window_minutes
    })

    return {
        "status": "success",
        "actions": actions,
        "notes": notes,
        "disease": disease,
        "disease_conf": disease_conf,
        "disorder": disorder,
        "sensor_stats": stats,
        "optimal": optimal,
        "diffs": diffs,
        "window_minutes": window_minutes
    }

@app.route("/compare-live-optimal", methods=["POST", "OPTIONS"])
def compare_live_optimal():
    try:
        if request.method == "OPTIONS":
            return '', 200
        data = request.get_json()
        plant = data.get("plant")
        if not plant:
            return {"status": "error", "message": "يرجى اختيار النبتة"}, 400

        model_path = f"models/regression_model/{plant}_model.pkl"
        data_path = f"data/raw/{plant}_live.csv"

        import pandas as pd
        import pickle

        feature_cols = ["temperature", "humidity", "ph_level", "light_intensity"]
        target_col = "optimal_temperature"
        df = pd.read_csv(data_path)

        # تنظيف الأعمدة الرقمية
        for col in feature_cols + [target_col]:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')

        # حذف الصفوف التي فيها قيم مفقودة في أي من الأعمدة المطلوبة
        df = df.dropna(subset=feature_cols + [target_col])

        if df.empty:
            return {"status": "error", "message": "لا توجد بيانات صالحة للمقارنة"}, 400

        X = df[feature_cols]
        actual_target = df[target_col].tolist()

        with open(model_path, "rb") as f:
            model = pickle.load(f)

        preds = model.predict(X)
        if len(preds.shape) == 1:
            optimal_target = preds.tolist()
        else:
            optimal_target = preds[:, 0].tolist()

        indices = list(range(1, len(actual_target) + 1))

        return {
            "status": "success",
            "indices": indices,
            "actual_target": actual_target,
            "optimal_target": optimal_target
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}, 500

@app.route("/sensor-data", methods=["POST"])
def add_sensor_data():
    data = request.get_json()
    plant = data.get("plant")
    temperature = data.get("temperature")
    humidity = data.get("humidity")
    ph_level = data.get("ph_level")
    light_intensity = data.get("light_intensity")

    if not plant or temperature is None or humidity is None or ph_level is None or light_intensity is None:
        return jsonify({"status": "error", "message": "يرجى إدخال جميع القيم المطلوبة"}), 400

    import pandas as pd
    import os

    csv_path = f"data/raw/{plant}_live.csv"
    row = {
        "temperature": temperature,
        "humidity": humidity,
        "ph_level": ph_level,
        "light_intensity": light_intensity
    }
    df = pd.DataFrame([row])
    if os.path.exists(csv_path):
        df.to_csv(csv_path, mode='a', header=False, index=False)
    else:
        df.to_csv(csv_path, mode='w', header=True, index=False)
    return jsonify({"status": "success", "message": "تمت إضافة البيانات بنجاح"})

@app.route("/device-status")
def device_status():
    plant = request.args.get("plant")
    return {
        "status": device_states.get(plant, {}),
        "modes": device_modes.get(plant, {})
    }

@app.route("/event-log")
def get_event_log():
    return {"log": event_log[-50:]}  # آخر 50 حدث فقط

@app.route("/control-device", methods=["POST"])
def control_device():
    data = request.get_json()
    plant = data.get("plant")
    device = data.get("device")
    action = data.get("action")
    if plant and device and action:
        device_states.setdefault(plant, {})[device] = (action == "on")
        event_log.append({
            "time": datetime.now().isoformat(),
            "plant": plant,
            "device": device,
            "action": action
        })
        print(f"أمر تحكم: النبتة={plant} | الجهاز={device} | الأمر={action}")
            # --- تتبع الاستخدام ومؤشر الصحة الاستباقي ---
        now = datetime.now().timestamp()
        device_usage_stats.setdefault(plant, {}).setdefault(device, []).append({"action": action, "time": now})
        # تحديث مؤشر الصحة بشكل مبسط: إذا التشغيل/الإيقاف متكرر جدًا خلال فترة قصيرة، قلل الصحة
        recent = [x for x in device_usage_stats[plant][device] if now - x["time"] < 3600]  # آخر ساعة
        if len(recent) > 10:
            device_health[plant][device] = max(0, device_health[plant][device] - 5)
        else:
            device_health[plant][device] = min(100, device_health[plant][device] + 1)
    return jsonify({"status": "success", "message": f"تم إرسال الأمر للجهاز {device} ({action}) بنجاح"})

@app.route("/set-device-mode", methods=["POST"])
def set_device_mode():
    data = request.get_json()
    plant = data.get("plant")
    device = data.get("device")
    mode = data.get("mode")  # "auto" أو "manual"
    if plant and device and mode in ["auto", "manual"]:
        device_modes.setdefault(plant, {})[device] = mode
        return jsonify({"status": "success", "message": f"تم تغيير وضع {device} إلى {mode} للنبتة {plant}"})
    return jsonify({"status": "error", "message": "بيانات غير صحيحة"}), 400

@app.route("/device-health")
def get_device_health():
    plant = request.args.get("plant")
    return {"health": device_health.get(plant, {})}

@app.route("/predict-fault", methods=["POST"])
def predict_fault():
    data = request.get_json()
    plant = data.get("plant")
    device = data.get("device")
    # مثال: احسب الميزات الحية (مدة التشغيل، عدد مرات التشغيل في الساعة الأخيرة)
    now = datetime.now().timestamp()
    usage = device_usage_stats.get(plant, {}).get(device, [])
    recent = [x for x in usage if now - x["time"] < 3600]
    duration = 0
    if usage and usage[-1]["action"] == "on":
        duration = now - usage[-1]["time"]
    num_starts_last_hour = sum(1 for x in recent if x["action"] == "on")
    features = [[duration, num_starts_last_hour]]

    # حمّل النموذج
    try:
        with open("models/fault_detector.pkl", "rb") as f:
            model = pickle.load(f)
        pred = model.predict(features)[0]  # -1 = شذوذ (خطر)، 1 = طبيعي
        score = model.decision_function(features)[0]
        return jsonify({
            "fault_risk": int(pred == -1),
            "anomaly_score": float(score),
            "duration": duration,
            "num_starts_last_hour": num_starts_last_hour
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/sensor-status")
def sensor_status():
    plant = request.args.get("plant")
    return {"status": sensor_states.get(plant, {})}

@app.route("/toggle-sensor", methods=["POST"])
def toggle_sensor():
    data = request.get_json()
    plant = data.get("plant")
    sensor = data.get("sensor")
    state = data.get("state")  # True أو False
    if plant and sensor in sensor_states.get(plant, {}):
        sensor_states[plant][sensor] = bool(state)
        return jsonify({"status": "success", "message": f"تم {'تفعيل' if state else 'إيقاف'} المستشعر {sensor} للنبتة {plant}"})
    return jsonify({"status": "error", "message": "بيانات غير صحيحة"}), 400

@app.route("/agri-assistant", methods=["POST"])
def agri_assistant():
    data = request.get_json()
    question = data.get("question", "")
    # هنا يمكنك ربط OpenAI أو أي نموذج محلي
    # مثال بسيط:
    if "ري" in question:
        answer = "ننصحك بري الطماطم في الصباح الباكر أو بعد الغروب."
    else:
        answer = "سؤالك مهم! قريبًا سأتمكن من الإجابة عليه بشكل أذكى."
    return jsonify({"answer": answer})

@app.route("/community-posts", methods=["GET", "POST"])
def community_posts_api():
    global community_posts
    if request.method == "POST":
        data = request.get_json()
        community_posts.append({"text": data.get("text", "")})
    return jsonify({"posts": community_posts[-20:]})

@app.route("/weekly-report")
def weekly_report():
    plant = request.args.get("plant", "tomato")
    # مثال: تحليل بسيط (يمكنك تطويره لاحقًا)
    report = f"خلال الأسبوع الماضي، كانت الرطوبة في {plant} منخفضة في 3 أيام. ننصح بزيادة الري."
    return jsonify({"report": report})

@app.route("/environmental-impact")
def environmental_impact():
    plant = request.args.get("plant", "tomato")
    # مثال: حساب بسيط (يمكنك تطويره لاحقًا)
    impact = f"تم توفير 20% من استهلاك المياه في {plant} هذا الشهر بفضل الأتمتة الذكية."
    return jsonify({"impact": impact})

# --- أتمتة الري بناءً على الرطوبة ---
def automation_loop():
    import pandas as pd
    while True:
        for plant in ["tomato", "cucumber", "pepper"]:
            csv_path = f"data/raw/{plant}_live.csv"
            if not os.path.exists(csv_path):
                continue
            try:
                df = pd.read_csv(csv_path)
            except pd.errors.EmptyDataError:
                continue
            if df.empty:
                continue
            last = df.iloc[-1]
            try:
                humidity = float(last.get("humidity", 100))
            except Exception:
                humidity = 100

            # فقط إذا كان الوضع "auto"
            if device_modes[plant]["pump"] == "auto":
                if humidity < 30:
                    if not device_states[plant]["pump"]:
                        device_states[plant]["pump"] = True
                        event_log.append({
                            "time": datetime.now().isoformat(),
                            "plant": plant,
                            "device": "pump",
                            "action": "on (auto)"
                        })
                        print(f"تشغيل الري تلقائيًا للنبتة {plant} (الرطوبة منخفضة)")
                        send_alert("user1", f"الرطوبة منخفضة جدًا في {plant}!")  # ← أضف هذا هنا
                else:
                    if device_states[plant]["pump"]:
                        device_states[plant]["pump"] = False
                        event_log.append({
                            "time": datetime.now().isoformat(),
                            "plant": plant,
                            "device": "pump",
                            "action": "off (auto)"
                        })
                        print(f"إيقاف الري تلقائيًا للنبتة {plant} (الرطوبة طبيعية)")
        time.sleep(10)


# شغل الأتمتة في خيط منفصل عند بدء السيرفر
threading.Thread(target=automation_loop, daemon=True).start()

if __name__ == "__main__":
    app.run(debug=True, port=5000)
