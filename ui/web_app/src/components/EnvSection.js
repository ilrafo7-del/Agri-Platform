import React, { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import ModelExplanation from "../components/ModelExplanation";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const plants = [
  { value: "tomato", label: "الطماطم 🍅" },
  { value: "cucumber", label: "الخيار 🥒" },
  { value: "pepper", label: "الفلفل 🌶️" }
];

const allFeatures = [
  { value: "temperature", label: "درجة الحرارة" },
  { value: "humidity", label: "الرطوبة" },
  { value: "ph_level", label: "الرقم الهيدروجيني" },
  { value: "light_intensity", label: "شدة الإضاءة" }
];

const algorithms = [
  { value: "linear", label: "الانحدار الخطي", params: {} },
  { value: "decision_tree", label: "شجرة القرار", params: { max_depth: 5 } },
  { value: "random_forest", label: "الغابة العشوائية", params: { n_estimators: 100 } },
  { value: "neural_network", label: "الشبكة العصبية", params: { epochs: 30, layers: 2, units: 16 } }
];

function TrainModelForm() {
  const [selectedPlant, setSelectedPlant] = useState("tomato");
  const [trainFiles, setTrainFiles] = useState([]);
  const [selectedTrainFile, setSelectedTrainFile] = useState("");
  const [targetCol, setTargetCol] = useState("temperature");
  const [selectedFeatures, setSelectedFeatures] = useState(allFeatures.map(f => f.value));
  const [selectedAlgorithms, setSelectedAlgorithms] = useState(algorithms.map(a => a.value));
  const [hyperParams, setHyperParams] = useState({});
  const [status, setStatus] = useState("");
  const [results, setResults] = useState([]);
  const [featureImportances, setFeatureImportances] = useState([]);
  const [experimentLog, setExperimentLog] = useState([]);
  const [errorAnalysis, setErrorAnalysis] = useState(null);
  const [selectedExperiments, setSelectedExperiments] = useState([]);
  const [selectedSampleIndex, setSelectedSampleIndex] = useState(0);
  const [shapValues, setShapValues] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [smartAlert, setSmartAlert] = useState("");
  const [testFile, setTestFile] = useState("");
  const [testResults, setTestResults] = useState([]);
  const [autoRecommendations, setAutoRecommendations] = useState([]);

  useEffect(() => {
    setTrainFiles([`data/processed/${selectedPlant}_train.csv`]);
    setSelectedTrainFile(`data/processed/${selectedPlant}_train.csv`);
  }, [selectedPlant]);

  const handleParamChange = (alg, param, value) => {
    setHyperParams(prev => ({
      ...prev,
      [alg]: { ...prev[alg], [param]: value }
    }));
  };

  const handleTrain = async (e) => {
    e.preventDefault();
    setStatus("جاري التدريب...");
    setResults([]);
    setFeatureImportances([]);
    setErrorAnalysis(null);

    let allResults = [];
    let files = Array.isArray(selectedTrainFile) ? selectedTrainFile : [selectedTrainFile];
    for (let file of files) {
      for (let alg of selectedAlgorithms) {
        let params = hyperParams[alg] || {};
        let body = {
          data_path: file,
          target_col: targetCol,
          features: selectedFeatures,
          algorithm: alg,
          params,
          model_save_path: `models/regression_model/${selectedPlant}_${alg}_${file.split('/').pop()}_model.pkl`
        };

        let res = await fetch("http://127.0.0.1:5000/train-model", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });
        let data = await res.json();
        allResults.push({ algorithm: alg, data_file: file, ...data });
      }
    }
    setResults(allResults);
    setStatus("تم التدريب والمقارنة بنجاح.");

    // تنبيه ذكي متغير حسب النتائج
    let best = allResults.reduce((a, b) => (a.score || 0) > (b.score || 0) ? a : b, allResults[0]);
    let worst = allResults.reduce((a, b) => (a.score || 0) < (b.score || 0) ? a : b, allResults[0]);
    let alertMsg = "";

    if (best.score !== undefined && best.score >= 0.85) {
      alertMsg = `🌟 أداء ممتاز! النموذج "${algorithms.find(a => a.value === best.algorithm)?.label || best.algorithm}" حقق دقة ${best.score.toFixed(2)}.`;
    } else if (worst.score !== undefined && worst.score < 0.5) {
      if (worst.algorithm === "linear") {
        alertMsg = "يبدو أن الانحدار الخطي لم يلتقط الأنماط جيدًا. جرب نموذجًا أكثر تعقيدًا مثل الغابة العشوائية أو الشبكة العصبية.";
      } else if (worst.algorithm === "random_forest") {
        alertMsg = "الغابة العشوائية لم تحقق نتائج جيدة. جرب زيادة عدد الأشجار أو تعديل المتغيرات المدخلة.";
      } else if (worst.algorithm === "neural_network") {
        alertMsg = "الشبكة العصبية لم تتعلم جيدًا. جرب زيادة عدد التكرارات (epochs) أو الوحدات (units) أو تحقق من جودة البيانات.";
      } else {
        alertMsg = "الدقة منخفضة. جرب تعديل المتغيرات أو استخدام نموذج مختلف.";
      }
    } else if (best.metrics && best.metrics.mse > 10) {
      alertMsg = "الخطأ ما زال مرتفعًا رغم الدقة المقبولة. راجع جودة البيانات أو جرب معالجة القيم المتطرفة.";
    } else if (allResults.some(r => r.metrics && r.metrics.rmse > 5)) {
      alertMsg = "بعض النماذج لديها خطأ RMSE مرتفع. جرب إزالة المتغيرات الأقل أهمية أو تنظيف البيانات.";
    } else {
      alertMsg = ""; // لا تظهر أي تنبيه إذا كانت النتائج متوسطة أو جيدة
    }
    setSmartAlert(alertMsg);

    let detailedRecs = [];
    for (let r of allResults) {
      let modelName = algorithms.find(a => a.value === r.algorithm)?.label || r.algorithm;
      let rec = `🔹 <b>${modelName}</b>: `;
      if (r.score !== undefined) {
        if (r.score >= 0.85) {
          rec += "النموذج حقق دقة عالية جدًا. يمكنك استخدامه مباشرة أو محاولة تحسينه أكثر بتجربة معلمات إضافية.";
        } else if (r.score >= 0.7) {
          rec += "النموذج جيد لكن يمكن تحسينه. جرب تعديل المتغيرات أو ضبط المعلمات.";
        } else {
          rec += "الدقة منخفضة. جرب تنظيف البيانات، أو إضافة متغيرات مؤثرة، أو استخدام نموذج أكثر تعقيدًا.";
        }
      }
      if (r.metrics) {
        if (r.metrics.mse > 10) {
          rec += " | الخطأ (MSE) مرتفع. راجع القيم المتطرفة أو جرب تقنيات معالجة البيانات.";
        }
        if (r.metrics.rmse > 5) {
          rec += " | قيمة RMSE مرتفعة نسبيًا. جرب إزالة المتغيرات الأقل أهمية أو تعديل معلمات النموذج.";
        }
      }
      // توصيات خاصة بكل نموذج
      if (r.algorithm === "linear") {
        rec += " | إذا لاحظت أن الدقة منخفضة، فهذا طبيعي في حالة وجود علاقات غير خطية بين المتغيرات. جرب نماذج شجرية أو شبكات عصبية.";
      }
      if (r.algorithm === "decision_tree") {
        rec += " | جرب زيادة أو تقليل عمق الشجرة (max_depth) لموازنة الدقة والتعميم.";
      }
      if (r.algorithm === "random_forest") {
        rec += " | جرب زيادة عدد الأشجار (n_estimators) أو تعديل معلمات التقليم لتحسين الأداء.";
      }
      if (r.algorithm === "neural_network") {
        rec += " | جرب زيادة عدد التكرارات (epochs) أو الوحدات (units) أو الطبقات (layers) إذا لاحظت أن النموذج لم يتعلم جيدًا.";
      }
      detailedRecs.push(rec);
    }
    setAutoRecommendations(detailedRecs);


    setExperimentLog(prev => [
      ...prev,
      {
        time: new Date().toLocaleString(),
        plant: selectedPlant,
        features: [...selectedFeatures],
        target: targetCol,
        results: allResults,
        tag: "بدون وسم"
      }
    ]);
    if (selectedAlgorithms.includes("random_forest")) {
      fetch("http://127.0.0.1:5000/feature-importance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data_path: selectedTrainFile,
          features: selectedFeatures,
          target_col: targetCol
        })
      })
        .then(res => res.json())
        .then(data => setFeatureImportances(data.importances || []));
    }
    fetch("http://127.0.0.1:5000/error-analysis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data_path: Array.isArray(selectedTrainFile) ? selectedTrainFile[0] : selectedTrainFile,
        features: selectedFeatures,
        target_col: targetCol
      })
    })
      .then(res => res.json())
      .then(data => setErrorAnalysis(data.analysis || null));
  };

  const handleAutoML = async () => {
    setStatus("جاري تنفيذ التجارب التلقائية...");
    setResults([]);
    let allResults = [];
    const featureCombos = [];
    for (let i = 0; i < allFeatures.length; i++) {
      for (let j = i + 1; j < allFeatures.length; j++) {
        featureCombos.push([allFeatures[i].value, allFeatures[j].value]);
      }
    }
    for (let alg of algorithms.map(a => a.value)) {
      for (let features of featureCombos) {
        let body = {
          data_path: selectedTrainFile,
          target_col: targetCol,
          features,
          algorithm: alg,
          params: hyperParams[alg] || {},
          model_save_path: `models/regression_model/${selectedPlant}_${alg}_${features.join("_")}_auto.pkl`
        };
        let res = await fetch("http://127.0.0.1:5000/train-model", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });
        let data = await res.json();
        allResults.push({
          algorithm: alg,
          features,
          ...data
        });
      }
    }
    allResults.sort((a, b) => (b.score || 0) - (a.score || 0));
    setResults(allResults.slice(0, 5));
    setStatus("انتهت التجارب التلقائية. أفضل النتائج بالجدول.");
  };

  const exportExperiments = () => {
    const csv = [
      "الوقت,النبتة,المتغيرات,الهدف,النموذج,الدقة,المؤشرات,الوسم",
      ...experimentLog.flatMap(exp =>
        exp.results.map(r =>
          [
            exp.time,
            exp.plant,
            exp.features.join("|"),
            exp.target,
            r.algorithm,
            r.score || "",
            JSON.stringify(r.metrics || {}),
            exp.tag || ""
          ].join(",")
        )
      )
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "experiment_log.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const generatePDF = async () => {
    const input = document.getElementById("pdf-report-section");
    if (!input) return;
    // أظهر العنصر مؤقتًا
    input.style.visibility = "visible";
    input.style.position = "absolute";
    input.style.left = "-9999px";
    await new Promise(resolve => setTimeout(resolve, 100)); // انتظر ليتم رسم العنصر
    const canvas = await html2canvas(input, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pageWidth - 20;
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, "PNG", 10, 10, pdfWidth, pdfHeight);
    pdf.save("experiment_report.pdf");
    // أخف العنصر مجددًا
    input.style.visibility = "hidden";
    input.style.position = "absolute";
    input.style.left = "-9999px";
  };

  return (
    <div style={{minHeight: "100vh", background: "#f6f8fa"}}>
      <div className="main-card">
        <div className="section-title" style={{textAlign: "center"}}>
          <span>🤖</span> تدريب ومقارنة النماذج البحثية
        </div>
        <form onSubmit={handleTrain} style={{direction: "rtl", textAlign: "right"}}>
          <div style={{marginBottom: 16}}>
            <label>اختر النبتة:</label>
            <select
              value={selectedPlant}
              onChange={e => setSelectedPlant(e.target.value)}
              style={{marginRight: 8, borderRadius: 6, padding: "4px 12px"}}
            >
              {plants.map(plant => (
                <option key={plant.value} value={plant.value}>{plant.label}</option>
              ))}
            </select>
            <span title="النبتة التي ستجري عليها التجربة" style={{marginRight: 8, color: "#888"}}>🛈</span>
          </div>

            <div style={{textAlign: "center", margin: "16px 0"}}>
              <button
                style={{
                  background: "#1976d2",
                  color: "#fff",
                  borderRadius: 8,
                  padding: "10px 32px",
                  fontSize: "1.1rem"
                }}
                onClick={handleAutoML}
                type="button"
              >
                تجربة تلقائية (AutoML)
              </button>
            </div>

          <div style={{marginBottom: 16}}>
            <label>ملفات بيانات التدريب:</label>
            <select
              multiple
              value={Array.isArray(selectedTrainFile) ? selectedTrainFile : [selectedTrainFile]}
              onChange={e => {
                const options = Array.from(e.target.selectedOptions).map(opt => opt.value);
                setSelectedTrainFile(options);
              }}
              style={{marginRight: 8, borderRadius: 6, padding: "4px 12px", minWidth: 220, height: 60}}
            >
              {trainFiles.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
            <span style={{color: "#888", marginRight: 8}}>يمكنك اختيار أكثر من ملف بالضغط على Ctrl</span>
          </div>
          <div style={{marginBottom: 16}}>
            <label>عمود الهدف:</label>
            <input value={targetCol} onChange={e => setTargetCol(e.target.value)}
              style={{marginRight: 8, borderRadius: 6, padding: "4px 12px"}} />
            <span title="المتغير الذي تريد التنبؤ به" style={{marginRight: 8, color: "#888"}}>🛈</span>
          </div>
          <div style={{marginBottom: 16}}>
            <label>المتغيرات المدخلة:</label>
            {allFeatures.map(f => (
              <label key={f.value} style={{marginLeft: 12}}>
                <input
                  type="checkbox"
                  checked={selectedFeatures.includes(f.value)}
                  onChange={e => {
                    if (e.target.checked)
                      setSelectedFeatures([...selectedFeatures, f.value]);
                    else
                      setSelectedFeatures(selectedFeatures.filter(x => x !== f.value));
                  }}
                /> {f.label}
              </label>
            ))}
            <span title="اختر المتغيرات التي ستدخل في النموذج" style={{marginRight: 8, color: "#888"}}>🛈</span>
          </div>
          <div style={{marginBottom: 16}}>
            <label>النماذج المراد تدريبها:</label>
            {algorithms.map(a => (
              <label key={a.value} style={{marginLeft: 12}}>
                <input
                  type="checkbox"
                  checked={selectedAlgorithms.includes(a.value)}
                  onChange={e => {
                    if (e.target.checked)
                      setSelectedAlgorithms([...selectedAlgorithms, a.value]);
                    else
                      setSelectedAlgorithms(selectedAlgorithms.filter(x => x !== a.value));
                  }}
                /> {a.label}
              </label>
            ))}
          </div>
          {selectedAlgorithms.map(alg =>
            <div key={alg} style={{marginBottom: 12, marginRight: 24, background: "#f9f9f9", padding: 8, borderRadius: 6}}>
              <b>{algorithms.find(a => a.value === alg)?.label} - معلمات:</b>
              {alg === "decision_tree" && (
                <span>
                  <label style={{marginRight: 8}}>العمق الأقصى:</label>
                  <input
                    type="number"
                    value={hyperParams[alg]?.max_depth || 5}
                    onChange={e => handleParamChange(alg, "max_depth", Number(e.target.value))}
                    style={{width: 60, marginRight: 8}}
                  />
                </span>
              )}
              {alg === "random_forest" && (
                <span>
                  <label style={{marginRight: 8}}>عدد الأشجار:</label>
                  <input
                    type="number"
                    value={hyperParams[alg]?.n_estimators || 100}
                    onChange={e => handleParamChange(alg, "n_estimators", Number(e.target.value))}
                    style={{width: 60, marginRight: 8}}
                  />
                </span>
              )}
              {alg === "neural_network" && (
                <span>
                  <label style={{marginRight: 8}}>عدد الطبقات:</label>
                  <input
                    type="number"
                    value={hyperParams[alg]?.layers || 2}
                    onChange={e => handleParamChange(alg, "layers", Number(e.target.value))}
                    style={{width: 40, marginRight: 8}}
                  />
                  <label style={{marginRight: 8}}>عدد الوحدات/طبقة:</label>
                  <input
                    type="number"
                    value={hyperParams[alg]?.units || 16}
                    onChange={e => handleParamChange(alg, "units", Number(e.target.value))}
                    style={{width: 40, marginRight: 8}}
                  />
                  <label style={{marginRight: 8}}>عدد التكرارات:</label>
                  <input
                    type="number"
                    value={hyperParams[alg]?.epochs || 30}
                    onChange={e => handleParamChange(alg, "epochs", Number(e.target.value))}
                    style={{width: 40, marginRight: 8}}
                  />
                </span>
              )}
            </div>
          )}
          <div style={{textAlign: "center", marginTop: 24}}>
            <button type="submit" style={{
              background: "#1a237e",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px 32px",
              fontSize: "1.1rem"
            }}>درّب وقارن النماذج</button>
          </div>
        </form>
        {status && <div style={{marginTop: "20px", color: "#388e3c", textAlign: "center"}}>{status}</div>}
      </div>

      {results.length > 0 && (
        <div className="main-card" style={{marginTop: 32}}>
          <div className="section-title" style={{textAlign: "center"}}>📊 نتائج المقارنة</div>
          <table style={{width: "100%", direction: "rtl", marginBottom: 16}}>
            <thead>
              <tr>
                <th>النموذج</th>
                <th>ملف البيانات</th>
                <th>المتغيرات</th>
                <th>الدقة (R2)</th>
                <th>MSE</th>
                <th>MAE</th>
                <th>RMSE</th>
                <th>وقت التدريب (ث)</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i}>
                  <td>{algorithms.find(a => a.value === r.algorithm)?.label || r.algorithm}</td>
                  <td>{r.data_file ? r.data_file.split('/').pop() : ""}</td>
                  <td>{r.features ? r.features.join(", ") : selectedFeatures.join(", ")}</td>
                  <td>{r.score ? r.score.toFixed(3) : "-"}</td>
                  <td>{r.metrics?.mse ? r.metrics.mse.toFixed(3) : "-"}</td>
                  <td>{r.metrics?.mae ? r.metrics.mae.toFixed(3) : "-"}</td>
                  <td>{r.metrics?.rmse ? r.metrics.rmse.toFixed(3) : "-"}</td>
                  <td>{r.metrics?.train_time ? r.metrics.train_time.toFixed(2) : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {autoRecommendations.length > 0 && (
        <div style={{
          background: "#e3f2fd",
          color: "#0d47a1",
          border: "1px solid #90caf9",
          borderRadius: 10,
          padding: "12px 18px",
          margin: "24px auto",
          maxWidth: 700,
          direction: "rtl",
          textAlign: "right",
          fontWeight: "bold",
          fontSize: "1.08rem"
        }}>
          <div>🛠️ توصيات تفصيلية لكل نموذج:</div>
          <ul>
            {autoRecommendations.map((rec, i) => (
              <li key={i} dangerouslySetInnerHTML={{__html: rec}} />
            ))}
          </ul>
        </div>
      )}

      {smartAlert && (
        <div style={{
          background: "#f7fafc",
          color: "#1976d2",
          border: "1px solid #e3eaf2",
          borderRadius: 10,
          padding: "12px 18px",
          margin: "24px auto",
          maxWidth: 600,
          direction: "rtl",
          textAlign: "right",
          fontWeight: "bold",
          boxShadow: "0 2px 8px #0001",
          fontSize: "1.08rem"
        }}>
          {smartAlert}
        </div>
      )}

      {results.length > 0 && (
        <div className="main-card" style={{marginTop: 24, boxShadow: "0 2px 8px #0001"}}>
          <div className="section-title" style={{textAlign: "center", fontSize: "1.3rem", marginBottom: 8}}>
            📈 أفضل نتائج الدقة (R2) عبر التجارب
          </div>
          <Bar
            data={{
              labels: results.slice(0, 7).map((r, i) =>
                (r.features ? r.features.join(" + ") : selectedFeatures.join(" + ")) + " - " +
                (algorithms.find(a => a.value === r.algorithm)?.label || r.algorithm) +
                " (" + (r.data_file ? r.data_file.split("/").pop() : "") + ")"
              ),
              datasets: [{
                label: "الدقة (R2)",
                data: results.slice(0, 7).map(r => r.score || 0),
                backgroundColor: [
                  "#388e3c", "#1976d2", "#fbc02d", "#d32f2f", "#7b1fa2", "#0288d1", "#c2185b"
                ]
              }]
            }}
            options={{
              indexAxis: 'y',
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      return `الدقة (R2): ${context.parsed.x}`;
                    }
                  }
                }
              },
              scales: { x: { min: 0, max: 1 } }
            }}
            height={80}
          />
          <div style={{textAlign: "center", color: "#555", marginTop: 8, fontSize: "0.95rem"}}>
            هذا الرسم يوضح أفضل 7 نتائج للدقة (R2) حسب كل تجربة نموذج ومجموعة متغيرات.
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="main-card" style={{marginTop: 24, boxShadow: "0 2px 8px #0001"}}>
          <div className="section-title" style={{textAlign: "center", fontSize: "1.3rem", marginBottom: 8}}>
            📉 أقل قيم الخطأ (MSE) عبر التجارب
          </div>
          <Bar
            data={{
              labels: results
                .slice(0, 7)
                .map((r, i) =>
                  (r.features ? r.features.join(" + ") : selectedFeatures.join(" + ")) + " - " +
                  (algorithms.find(a => a.value === r.algorithm)?.label || r.algorithm) +
                " (" + (r.data_file ? r.data_file.split("/").pop() : "") + ")"
              ),
              datasets: [{
                label: "MSE",
                data: results.slice(0, 7).map(r => r.metrics?.mse || 0),
                backgroundColor: [
                  "#d32f2f", "#388e3c", "#1976d2", "#fbc02d", "#7b1fa2", "#0288d1", "#c2185b"
                ]
              }]
            }}
            options={{
              indexAxis: 'y',
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      return `MSE: ${context.parsed.x}`;
                    }
                  }
                }
              },
              scales: { x: { min: 0 } }
            }}
            height={80}
          />
          <div style={{textAlign: "center", color: "#555", marginTop: 8, fontSize: "0.95rem"}}>
            هذا الرسم يوضح أقل 7 قيم للخطأ (MSE) حسب كل تجربة نموذج ومجموعة متغيرات.
          </div>
        </div>
      )}

      <div
        id="pdf-report-section"
        style={{
          visibility: "hidden",
          position: "absolute",
          left: "-9999px",
          top: 0,
          width: "210mm", // عرض صفحة A4
          background: "#fff",
          zIndex: -1,
          direction: "rtl",
          fontFamily: "Cairo, Arial"
        }}
      >
        <h2 style={{textAlign: "center", color: "#1976d2"}}>تقرير تجربة النماذج البحثية</h2>
        <div style={{margin: "12px 0"}}>
          <b>تاريخ التجربة:</b> {new Date().toLocaleString()}
        </div>
        <div style={{margin: "12px 0"}}>
          <b>النبتة:</b> {plants.find(p => p.value === selectedPlant)?.label}
          <br/>
          <b>المتغيرات المدخلة:</b> {selectedFeatures.map(f => allFeatures.find(x => x.value === f)?.label).join(", ")}
          <br/>
          <b>الهدف:</b> {targetCol}
          <br/>
          <b>النماذج المستخدمة:</b> {selectedAlgorithms.map(a => algorithms.find(x => x.value === a)?.label).join(", ")}
          <br/>
          <b>ملفات البيانات:</b> {(Array.isArray(selectedTrainFile) ? selectedTrainFile : [selectedTrainFile]).map(f => f.split("/").pop()).join(", ")}
        </div>
        <div style={{margin: "12px 0"}}>
          <b>المعلمات:</b>
          <ul>
            {selectedAlgorithms.map(alg => (
              <li key={alg}>
                <b>{algorithms.find(a => a.value === alg)?.label}:</b>
                {Object.entries(hyperParams[alg] || {}).map(([k, v]) => `${k}: ${v}`).join(", ") || "الإعدادات الافتراضية"}
              </li>
            ))}
          </ul>
        </div>
        <div style={{margin: "12px 0"}}>
          <b>نتائج النماذج:</b>
          <table border="1" cellPadding="6" style={{borderCollapse: "collapse", width: "100%", marginTop: 8}}>
            <thead style={{background: "#f0f0f0"}}>
              <tr>
                <th>النموذج</th>
                <th>ملف البيانات</th>
                <th>الدقة (R2)</th>
                <th>MSE</th>
                <th>MAE</th>
                <th>RMSE</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i}>
                  <td>{algorithms.find(a => a.value === r.algorithm)?.label || r.algorithm}</td>
                  <td>{r.data_file ? r.data_file.split('/').pop() : ""}</td>
                  <td>{r.score ? r.score.toFixed(3) : "-"}</td>
                  <td>{r.metrics?.mse ? r.metrics.mse.toFixed(3) : "-"}</td>
                  <td>{r.metrics?.mae ? r.metrics.mae.toFixed(3) : "-"}</td>
                  <td>{r.metrics?.rmse ? r.metrics.rmse.toFixed(3) : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {smartAlert && (
          <div style={{margin: "16px 0", color: "#d32f2f", fontWeight: "bold"}}>
            <b>تنبيه ذكي:</b> {smartAlert}
          </div>
        )}
        <div style={{margin: "12px 0"}}>
          <b>أفضل نموذج:</b> {
            (() => {
              if (!results.length) return "-";
              const best = results.reduce((a, b) => (a.score || 0) > (b.score || 0) ? a : b, results[0]);
              return `${algorithms.find(a => a.value === best.algorithm)?.label || best.algorithm} (دقة: ${best.score ? best.score.toFixed(3) : "-"})`;
            })()
          }
        </div>
        <div style={{margin: "12px 0"}}>
          <b>ملاحظات:</b>
          <ul>
            <li>تم توليد هذا التقرير تلقائيًا من منصة الزراعة الذكية.</li>
            <li>يمكنك مشاركة التقرير مع فريقك أو حفظه للأرشفة.</li>
          </ul>
        </div>
      </div>

      <div className="main-card" style={{
        margin: "32px auto 0 auto",
        maxWidth: 650,
        background: "#f7fafd",
        borderRadius: 12,
        padding: 18,
        boxShadow: "0 2px 8px #0001",
        fontSize: "1.08rem",
        lineHeight: "2",
        direction: "rtl",
        textAlign: "right"
      }}>
        <div style={{fontWeight: "bold", color: "#1976d2", marginBottom: 10, fontSize: "1.15rem"}}>
          ما المقصود بالعينة وشرح <span dir="ltr" style={{fontFamily: "monospace"}}>SHAP</span>؟
        </div>
        <div>
          <span style={{color: "#388e3c", fontWeight: "bold"}}>العينة:</span>
          <span>
            &nbsp;العينة هي صف واحد من بياناتك (أي حالة واحدة أو تجربة واحدة من الجدول). عند اختيار رقم العينة، أنت تختار صفًا معينًا من بياناتك لتفسير لماذا أعطى النموذج هذا التنبؤ لهذه الحالة بالذات.
          </span>
        </div>
        <div style={{marginTop: 10}}>
          <span style={{color: "#d32f2f", fontWeight: "bold"}}>SHAP:</span>
          <span>
            &nbsp;<span dir="ltr" style={{fontFamily: "monospace"}}>SHAP</span> هي أداة حديثة تشرح لك كيف ولماذا اتخذ النموذج قراره لكل حالة، وذلك عبر حساب مساهمة كل متغير في النتيجة النهائية. إذا كانت قيمة <span dir="ltr" style={{fontFamily: "monospace"}}>SHAP</span> موجبة فهذا المتغير زاد من قيمة التنبؤ، وإذا كانت سالبة فقد خفّضها.
          </span>
        </div>
      </div>

      <div className="main-card" style={{marginTop: 24}}>
        <div className="section-title" style={{textAlign: "center"}}>🧠 تفسير قرار النموذج (SHAP)</div>
        <div style={{textAlign: "center", marginBottom: 12}}>
          <label>اختر رقم العينة: </label>
          <select
            value={selectedSampleIndex}
            onChange={e => setSelectedSampleIndex(Number(e.target.value))}
            style={{marginRight: 8, borderRadius: 6, padding: "4px 12px"}}
          >
            {[...Array(10).keys()].map(i => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>
          <button
            style={{
              background: "#1976d2",
              color: "#fff",
              borderRadius: 8,
              padding: "6px 18px",
              marginRight: 8
            }}
            onClick={async () => {
              setShapValues(null);
              setStatus("جاري حساب تفسير SHAP...");
              const res = await fetch("http://127.0.0.1:5000/shap-explain", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  data_path: selectedTrainFile,
                  features: selectedFeatures,
                  target_col: targetCol,
                  model_path: `models/regression_model/${selectedPlant}_random_forest_model.pkl`,
                  sample_index: selectedSampleIndex
                })
              });
              const data = await res.json();
              setShapValues(data.shap_values || null);
              setStatus("");
            }}
          >
            تفسير العينة
          </button>
        </div>
        {shapValues && (
          <table style={{width: "100%", direction: "rtl", background: "#f9f9f9", borderRadius: 8, marginBottom: 16}}>
            <thead>
              <tr>
                <th>المتغير</th>
                <th>قيمة SHAP</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(shapValues).map(([feature, value], idx) => (
                <tr key={idx}>
                  <td>{feature}</td>
                  <td>{value.toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {featureImportances.length > 0 && (
        <div className="main-card" style={{marginTop: 32}}>
          <div className="section-title" style={{textAlign: "center"}}>⭐ أهمية المتغيرات (Feature Importance)</div>
          <Bar
            data={{
              labels: featureImportances.map(f => f.feature),
              datasets: [{
                label: "الأهمية",
                data: featureImportances.map(f => f.importance),
                backgroundColor: "#1976d2"
              }]
            }}
            options={{
              indexAxis: 'y',
              plugins: { legend: { display: false } },
              scales: { x: { min: 0 } }
            }}
          />
        </div>
      )}

      {errorAnalysis && (
        <div className="main-card" style={{marginTop: 32}}>
          <div className="section-title" style={{textAlign: "center"}}>🔍 تحليل الأخطاء</div>
          <table style={{width: "100%", direction: "rtl", background: "#f9f9f9", borderRadius: 8, marginBottom: 16}}>
            <tbody>
              {Object.entries(errorAnalysis).map(([key, value], idx) => (
                <tr key={idx}>
                  <td style={{fontWeight: "bold", width: 220}}>{key}</td>
                  <td>
                    {typeof value === "object"
                      ? <pre style={{margin: 0, fontFamily: "monospace"}}>{JSON.stringify(value, null, 2)}</pre>
                      : value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{textAlign: "center", margin: "32px 0"}}>
        <button
          style={{
            background: "#1976d2",
            color: "#fff",
            borderRadius: 8,
            padding: "12px 32px",
            fontSize: "1.1rem"
          }}
          onClick={generatePDF}
        >
          توليد تقرير PDF
        </button>
      </div>

      {/* سجل التجارب */}
      <div className="main-card" style={{marginTop: 32}}>
        <div className="section-title" style={{textAlign: "center"}}>📚 سجل التجارب البحثية</div>
        <div style={{textAlign: "center", marginBottom: 12}}>
          <button onClick={exportExperiments} style={{background: "#388e3c", color: "#fff", borderRadius: 8, padding: "6px 18px"}}>تصدير النتائج (CSV)</button>
        </div>
        <div style={{textAlign: "center", margin: "8px 0"}}>
          <input
            type="text"
            placeholder="ابحث في سجل التجارب..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{width: "220px", borderRadius: 6, padding: "4px 12px", border: "1px solid #bbb"}}
          />
        </div>
        <table style={{width: "100%", direction: "rtl"}}>
          <thead>
            <tr>
              <th></th>
              <th>الوقت</th>
              <th>النبتة</th>
              <th>المتغيرات</th>
              <th>الهدف</th>
              <th>النموذج</th>
              <th>الدقة</th>
              <th>الوسم</th>
            </tr>
          </thead>
          <tbody>
            {experimentLog
              .filter(exp =>
                exp.tag?.includes(searchTerm) ||
                exp.time?.includes(searchTerm) ||
                exp.plant?.includes(searchTerm) ||
                exp.features.join(",").includes(searchTerm) ||
                exp.target?.includes(searchTerm)
              )
              .slice(-10)
              .reverse()
              .map((exp, i) =>
                exp.results.map((r, j) => {
                  const expId = `${exp.time}-${exp.plant}-${r.algorithm}`;
                  return (
                    <tr key={expId}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedExperiments.includes(expId)}
                          onChange={e => {
                            setSelectedExperiments(sel =>
                              e.target.checked
                                ? [...sel, expId]
                                : sel.filter(id => id !== expId)
                            );
                          }}
                        />
                      </td>
                      <td>{exp.time}</td>
                      <td>{exp.plant}</td>
                      <td>{exp.features.join(", ")}</td>
                      <td>{exp.target}</td>
                      <td>{algorithms.find(a => a.value === r.algorithm)?.label || r.algorithm}</td>
                      <td>{r.score ? r.score.toFixed(3) : "-"}</td>
                      <td>
                        <input
                          type="text"
                          value={exp.tag || ""}
                          onChange={e => {
                            setExperimentLog(log =>
                              log.map((item, idx) =>
                                idx === i ? { ...item, tag: e.target.value } : item
                              )
                            );
                          }}
                          style={{width: "90px", borderRadius: 4, border: "1px solid #ccc", padding: "2px 6px"}}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
          </tbody>
        </table>
        <div style={{textAlign: "center", margin: "12px 0"}}>
          <button
            onClick={() => {
              setExperimentLog(log =>
                log
                  .map(exp => ({
                    ...exp,
                    results: exp.results.filter(
                      r => !selectedExperiments.includes(`${exp.time}-${exp.plant}-${r.algorithm}`)
                    )
                  }))
                  .filter(exp => exp.results.length > 0)
              );
              setSelectedExperiments([]);
            }}
            style={{
              background: "#f44336",
              color: "#fff",
              borderRadius: 8,
              padding: "6px 18px",
              margin: "0 8px"
            }}
            disabled={selectedExperiments.length === 0}
          >
            حذف التجارب المختارة
          </button>
        </div>
      </div>
    </div>
  );
}

export default TrainModelForm;