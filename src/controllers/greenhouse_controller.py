import requests
import time

def set_temperature(new_temp):
    """
    مثال لوظيفة تتحكم بجهاز التهوية/التدفئة عبر REST API أو بروتوكول محدد.
    """
    # نفترض لدينا واجهة API جاهزة لجهاز التكييف/التدفئة
    url = "http://greenhouse-device.local/temperature"
    payload = {"desired_temperature": new_temp}
    try:
        response = requests.post(url, json=payload, timeout=5)
        if response.status_code == 200:
            print(f"تم ضبط جهاز التحكم لتحقيق درجة الحرارة {new_temp}")
        else:
            print("فشل في الاتصال بجهاز التكييف/التدفئة.")
    except requests.exceptions.RequestException as e:
        print("خطأ في طلب التحكم:", e)

def set_humidity(new_hum):
    """
    مثال لوظيفة تتحكم بمستوى الرطوبة عبر نظام الرشّ أو المرذاذ.
    """
    url = "http://greenhouse-device.local/humidity"
    payload = {"desired_humidity": new_hum}
    try:
        response = requests.post(url, json=payload, timeout=5)
        if response.status_code == 200:
            print(f"تم ضبط جهاز الرطوبة لتحقق نسبة رطوبة {new_hum}%")
        else:
            print("فشل في الاتصال بجهاز الرطوبة.")
    except requests.exceptions.RequestException as e:
        print("خطأ في طلب التحكم:", e)

if __name__ == "__main__":
    # مثال على الاختبار المباشر:
    set_temperature(25)
    time.sleep(1)
    set_humidity(65)
