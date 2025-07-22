import os
import subprocess

def detect_pests(image_path, model_weights):
    """
    ينفذ أمر اكتشاف الآفات على صورة معينة باستخدام YOLO11 أو ما شابه.
    """
    command = [
        "yolo11", "detect",
        "--weights", model_weights,
        "--source", image_path,
        "--conf", "0.4" 
    ]
    subprocess.run(command)

if __name__ == "__main__":
    # افترضنا أننا نملك صورة جديدة لإحدى النباتات
    test_image = "../../data/images/new_crop.jpg"
    yolo_weights = "../../models/object_detection_model/agri_detection/weights/best.pt"
    detect_pests(test_image, yolo_weights)
    print("اكتشاف الآفات انتهى. راجع مخرجات التحليل/الصور الناتجة.")
