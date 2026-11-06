/**
 * AICEE Benchmark & Evaluation Runner
 * Kiểm thử tự động trên bộ dữ liệu thực nghiệm chuẩn và tính toán các chỉ số kỹ thuật:
 * Accuracy, Precision, Recall, F1-Score, Confusion Matrix, Latency.
 */

const path = require('path');
const fs = require('fs');

// Import các engine phân tích cốt lõi của AICEE
const { analyzeUrl, analyzeEmail, analyzePhone } = require('../services/scanService');
const { analyzeQRPayload } = require('../services/qrService');
const { analyzeWithHeuristic } = require('../services/aiService');

async function runBenchmark() {
  console.log('================================================================================');
  console.log('       AICEE CYBERSECURITY BENCHMARK & EVALUATION TEST SUITE');
  console.log('================================================================================\n');

  const datasetPath = path.join(__dirname, '..', 'data', 'benchmark_dataset.json');
  if (!fs.existsSync(datasetPath)) {
    console.error(`Không tìm thấy file dataset: ${datasetPath}`);
    process.exit(1);
  }

  const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
  console.log(`Đã nạp thành công bộ dữ liệu: ${dataset.length} ca kiểm thử thực tế.\n`);

  let tp = 0; // Thực tế là Nguy cơ (danger/warning), đoán đúng là Nguy cơ
  let fp = 0; // Thực tế là An toàn/Thông tin (safe/info), đoán nhầm là Nguy cơ
  let tn = 0; // Thực tế là An toàn/Thông tin (safe/info), đoán đúng là An toàn/Thông tin
  let fn = 0; // Thực tế là Nguy cơ (danger/warning), đoán nhầm là An toàn/Thông tin

  let exactMatches = 0;
  const results = [];
  const mismatches = [];

  const startTime = Date.now();

  for (const item of dataset) {
    const itemStart = process.hrtime();
    let predictedStatus = 'info';

    // Điều hướng theo loại đầu vào
    if (item.type === 'url') {
      const res = analyzeUrl(item.input);
      predictedStatus = res.status;
    } else if (item.type === 'email') {
      const res = analyzeEmail(item.input, item.subject || '', item.body || '');
      predictedStatus = res.status;
    } else if (item.type === 'phone') {
      const res = analyzePhone(item.input);
      predictedStatus = res.status;
    } else if (item.type === 'qr') {
      const res = analyzeQRPayload(item.input);
      predictedStatus = res.status;
    } else if (item.type === 'text') {
      const res = analyzeWithHeuristic(item.input);
      predictedStatus = res.status;
    }

    const itemDiff = process.hrtime(itemStart);
    const latencyMs = Number(((itemDiff[0] * 1000) + (itemDiff[1] / 1e6)).toFixed(2));

    const isExactMatch = predictedStatus === item.groundTruth;
    if (isExactMatch) exactMatches++;

    // Phân loại nhị phân An ninh (Threat vs Benign)
    const isActualThreat = item.groundTruth === 'danger' || item.groundTruth === 'warning';
    const isPredictedThreat = predictedStatus === 'danger' || predictedStatus === 'warning';

    if (isActualThreat && isPredictedThreat) tp++;
    else if (!isActualThreat && isPredictedThreat) fp++;
    else if (!isActualThreat && !isPredictedThreat) tn++;
    else if (isActualThreat && !isPredictedThreat) fn++;

    const resultRow = {
      ID: item.id,
      Loại: item.type.toUpperCase(),
      "Thực tế": item.groundTruth.toUpperCase(),
      "Dự đoán": predictedStatus.toUpperCase(),
      "Khớp": isExactMatch ? '✅ MATCH' : '❌ DIFF',
      "Độ trễ": `${latencyMs}ms`,
      "Mục tiêu kiểm thử": item.scenario
    };

    results.push(resultRow);

    if (!isExactMatch) {
      mismatches.push({
        id: item.id,
        scenario: item.scenario,
        groundTruth: item.groundTruth,
        predicted: predictedStatus
      });
    }
  }

  const totalTime = Date.now() - startTime;
  const avgLatency = (totalTime / dataset.length).toFixed(2);

  // In bảng chi tiết các ca kiểm thử
  console.table(results.map(r => ({
    ID: r.ID,
    Loại: r.Loại,
    "Thực tế": r["Thực tế"],
    "Dự đoán": r["Dự đoán"],
    "Kết quả": r["Khớp"],
    "Độ trễ": r["Độ trễ"]
  })));

  // Tính toán các chỉ số khoa học
  const total = dataset.length;
  const exactAccuracy = ((exactMatches / total) * 100).toFixed(2);
  const binaryAccuracy = (((tp + tn) / total) * 100).toFixed(2);
  const precision = ((tp / (tp + fp)) * 100).toFixed(2);
  const recall = ((tp / (tp + fn)) * 100).toFixed(2);
  const f1 = (2 * ((precision * recall) / (Number(precision) + Number(recall)))).toFixed(2);

  console.log('\n================================================================================');
  console.log('                        MA TRẬN NHẦM LẪN (CONFUSION MATRIX)');
  console.log('================================================================================');
  console.log(`  • True Positive (TP)  [Đoán đúng Nguy cơ]   : ${tp}`);
  console.log(`  • False Positive (FP) [Báo nhầm An toàn]    : ${fp}`);
  console.log(`  • True Negative (TN)  [Xác nhận đúng Sạch]  : ${tn}`);
  console.log(`  • False Negative (FN) [Bỏ sót Nguy cơ]      : ${fn}`);

  console.log('\n================================================================================');
  console.log('                    BẢNG CHỈ SỐ ĐÁNH GIÁ KỸ THUẬT (METRICS)');
  console.log('================================================================================');
  console.log(`  1. Độ chính xác tuyệt đối (Exact Match Rate) : ${exactAccuracy}% (${exactMatches}/${total})`);
  console.log(`  2. Độ chính xác an ninh (Binary Accuracy)    : ${binaryAccuracy}%`);
  console.log(`  3. Độ chuẩn xác cảnh báo (Precision)         : ${precision}%`);
  console.log(`  4. Độ nhạy bắt lừa đảo (Recall / Sensitivity): ${recall}%`);
  console.log(`  5. Chỉ số F1-Score                           : ${f1}%`);
  console.log(`  6. Thời gian xử lý trung bình mỗi mẫu        : ${avgLatency} ms`);
  console.log('================================================================================\n');

  if (mismatches.length > 0) {
    console.log('PHÂN TÍCH CÁC TRƯỜNG HỢP LỆCH NHÃN (ERROR ANALYSIS):');
    mismatches.forEach(m => {
      console.log(`  - [${m.id}] ${m.scenario}`);
      console.log(`    -> Nhãn mong đợi: ${m.groundTruth} | Nhãn thực tế: ${m.predicted}`);
    });
    console.log('');
  } else {
    console.log('Toàn bộ 100% mẫu thử nghiệm đều khớp hoàn hảo với nhãn mong đợi!\n');
  }

  // Xuất file kết quả JSON để phục vụ lưu trữ minh chứng
  const reportOutPath = path.join(__dirname, '..', 'data', 'benchmark_result.json');
  const summaryReport = {
    timestamp: new Date().toISOString(),
    datasetSize: total,
    metrics: {
      exactAccuracy: Number(exactAccuracy),
      binaryAccuracy: Number(binaryAccuracy),
      precision: Number(precision),
      recall: Number(recall),
      f1Score: Number(f1),
      avgLatencyMs: Number(avgLatency)
    },
    confusionMatrix: { tp, fp, tn, fn },
    mismatches
  };
  fs.writeFileSync(reportOutPath, JSON.stringify(summaryReport, null, 2), 'utf8');
  console.log(`Đã xuất báo cáo minh chứng định dạng JSON: ${reportOutPath}\n`);
}

runBenchmark().catch(err => {
  console.error('Lỗi khi chạy benchmark:', err);
});
