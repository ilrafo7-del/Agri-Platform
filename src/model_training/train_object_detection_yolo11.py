import os
import subprocess

def train_object_detection(data_dir, model_save_path):
    """
    مثال توضيحي لتشغيل تدريب YOLO11 عبر سطر الأوامر (قد تعتمد على مكتبة Ultralytics).
    """
    # قد تحتاج إلى ضبط سطر الأوامر بما يناسب إعدادات مشروعك
    # هذا مجرد مثال افتراضي
    command = [
        "yolo11", "train", 
        "--data", os.path.join(data_dir, "agri_dataset.yaml"),
        "--weights", "yolov11.pt",
        "--epochs", "50",
        "--project", model_save_path,
        "--name", "agri_detection"
    ]
    subprocess.run(command)

if __name__ == "__main__":
    # يُفترض أننا جهزنا ملف agri_dataset.yaml وفيه مسارات train/test وصور الآفات
    data_directory = "../../data/images/"
    save_path = "../../models/object_detection_model/"
    train_object_detection(data_directory, save_path)
    print("تم تدريب نموذج الكشف عن الآفات (YOLO11) وحفظه في المجلد المحدد.")
