"use client";

import { useEffect, useRef, useState } from "react";

type ClassificationStatus = "READY" | "REVIEW" | "UNKNOWN" | "FAILED" | "NEEDS_VISION";
type ClassificationRow = {
  productCode: string;
  slug: string;
  title: string;
  imageUrl: string | null;
  oldCategory: string | null;
  oldSubcategory: string | null;
  suggestedCategory: string | null;
  suggestedSubcategory: string | null;
  confidence: number | null;
  reason: string | null;
  status: ClassificationStatus;
  source: "title-rule" | "deepseek" | "needs-vision" | "kimi-vision" | null;
  imageAvailable: boolean;
  errorMessage?: string | null;
};

const statusLabels: Record<ClassificationStatus | "ALL", string> = {
  ALL: "全部",
  READY: "Ready",
  REVIEW: "Review",
  UNKNOWN: "Unknown",
  FAILED: "Failed",
  NEEDS_VISION: "Needs Vision",
};

const sourceLabels: Record<NonNullable<ClassificationRow["source"]>, string> = {
  "title-rule": "Title Rule",
  deepseek: "DeepSeek",
  "needs-vision": "Needs Vision",
  "kimi-vision": "Kimi Vision",
};

function categoryText(category: string | null, subcategory: string | null) {
  return [category, subcategory].filter(Boolean).join(" / ") || "未设置";
}

export function AdminClassificationPanel() {
  const [rows, setRows] = useState<ClassificationRow[]>([]);
  const [counts, setCounts] = useState<Record<ClassificationStatus, number>>({ READY: 0, REVIEW: 0, UNKNOWN: 0, FAILED: 0, NEEDS_VISION: 0 });
  const [workflow, setWorkflow] = useState({ total: 0, titleRule: 0, deepseek: 0, needsVision: 0, failed: 0 });
  const [averageConfidence, setAverageConfidence] = useState<number | null>(null);
  const [parentChangedCount, setParentChangedCount] = useState(0);
  const [filter, setFilter] = useState<"ALL" | ClassificationStatus>("ALL");
  const [scanning, setScanning] = useState(false);
  const [rescanningCode, setRescanningCode] = useState<string | null>(null);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [message, setMessage] = useState("");
  const controllerRef = useRef<AbortController | null>(null);

  async function refresh(nextFilter = filter) {
    const query = nextFilter === "ALL" ? "" : `?status=${nextFilter}`;
    const [summaryResponse, rowsResponse] = await Promise.all([
      fetch("/api/admin/classification/summary", { cache: "no-store" }),
      fetch(`/api/admin/classification/suggestions${query}`, { cache: "no-store" }),
    ]);
    const summary = await summaryResponse.json().catch(() => ({})) as { counts?: Record<ClassificationStatus, number>; workflow?: typeof workflow; averageConfidence?: number | null; parentChangedCount?: number };
    const result = await rowsResponse.json().catch(() => ({})) as { suggestions?: ClassificationRow[]; error?: string };
    if (summaryResponse.ok && summary.counts) setCounts({ READY: Number(summary.counts.READY) || 0, REVIEW: Number(summary.counts.REVIEW) || 0, UNKNOWN: Number(summary.counts.UNKNOWN) || 0, FAILED: Number(summary.counts.FAILED) || 0, NEEDS_VISION: Number(summary.workflow?.needsVision) || 0 });
    if (summaryResponse.ok && summary.workflow) setWorkflow({ total: Number(summary.workflow.total) || 0, titleRule: Number(summary.workflow.titleRule) || 0, deepseek: Number(summary.workflow.deepseek) || 0, needsVision: Number(summary.workflow.needsVision) || 0, failed: Number(summary.workflow.failed) || 0 });
    if (summaryResponse.ok) {
      setAverageConfidence(typeof summary.averageConfidence === "number" ? summary.averageConfidence : null);
      setParentChangedCount(Number(summary.parentChangedCount) || 0);
    }
    if (rowsResponse.ok) setRows(result.suggestions || []);
    else setMessage(result.error || "读取分类预览失败。");
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { void refresh(); }, 0);
    return () => {
      window.clearTimeout(timer);
      controllerRef.current?.abort();
    };
    // This panel intentionally loads once; changing the filter is handled by the filter buttons.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function scanSample() {
    if (scanning) return;
    setMessage("");
    const queueResponse = await fetch("/api/admin/classification/queue?limit=50", { cache: "no-store" });
    const queue = await queueResponse.json().catch(() => ({})) as { products?: Array<{ product_code: string }>; error?: string };
    if (!queueResponse.ok) {
      setMessage(queue.error || "读取扫描样本失败。请先执行本地 staging migration。");
      return;
    }
    const products = queue.products || [];
    if (!products.length) {
      setMessage("没有新的待扫描商品；已有成功预览会自动跳过。 ");
      return;
    }
    const controller = new AbortController();
    controllerRef.current = controller;
    setScanning(true);
    setProgress({ done: 0, total: products.length });
    let cursor = 0;
    let done = 0;
    async function worker() {
      while (!controller.signal.aborted) {
        const index = cursor;
        cursor += 1;
        if (index >= products.length) return;
        const response = await fetch("/api/admin/classification/scan-one", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productCode: products[index].product_code }),
          signal: controller.signal,
        });
        const result = await response.json().catch(() => ({})) as { error?: string };
        done += 1;
        setProgress({ done, total: products.length });
        if (!response.ok && (response.status === 503 || (response.status === 502 && /image|vision|multimodal|unsupported/i.test(result.error || "")))) {
          controller.abort();
          setMessage(result.error || "DeepSeek 尚未配置，扫描已停止。");
          return;
        }
      }
    }
    try {
      await Promise.all([worker(), worker()]);
      setMessage(controller.signal.aborted ? "扫描已停止，已保存的预览结果不会丢失。" : `样本扫描完成：${done} 件。`);
    } catch (error) {
      if ((error as { name?: string }).name !== "AbortError") setMessage("扫描中断；已保存的预览结果不会丢失。");
    } finally {
      controllerRef.current = null;
      setScanning(false);
      await refresh();
    }
  }

  function stopScan() {
    controllerRef.current?.abort();
  }

  async function rescanOne(productCode: string) {
    if (scanning || rescanningCode) return;
    setRescanningCode(productCode);
    setMessage("");
    try {
      const response = await fetch("/api/admin/classification/scan-one", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productCode }),
      });
      const result = await response.json().catch(() => ({})) as { error?: string };
      setMessage(response.ok ? `已重新扫描 ${productCode}。` : result.error || "单件重扫失败。");
    } catch {
      setMessage("单件重扫失败，请稍后重试。");
    } finally {
      setRescanningCode(null);
      await refresh();
    }
  }

  async function chooseFilter(nextFilter: "ALL" | ClassificationStatus) {
    setFilter(nextFilter);
    await refresh(nextFilter);
  }

  return (
    <section className="admin-classification-panel" aria-labelledby="admin-classification-heading">
      <div className="admin-classification-header">
        <div>
          <p className="eyebrow">AI 预览</p>
          <h2 id="admin-classification-heading">商品分类扫描（标题规则 → DeepSeek）</h2>
          <p>只读取商品标题：硬规则命中时不调用 AI，无法确定才调用 DeepSeek；结果只写入 staging 预览表，不会修改商品正式分类。</p>
        </div>
        <div className="admin-classification-actions">
          <button className="btn btn-solid" type="button" onClick={() => void scanSample()} disabled={scanning}>扫描样本 50</button>
          <button className="btn" type="button" onClick={stopScan} disabled={!scanning}>停止扫描</button>
          <button className="btn" type="button" disabled title="第二阶段 A 只开放 50 件样本扫描">扫描全部（暂不可用）</button>
        </div>
      </div>
      {scanning ? <p className="admin-status">正在扫描：{progress.done}/{progress.total}。并发 2，停止后可继续。</p> : null}
      {message ? <p className="admin-status">{message}</p> : null}
      <div className="admin-classification-filters" role="tablist" aria-label="分类预览状态">
        {(["ALL", "READY", "NEEDS_VISION", "REVIEW", "UNKNOWN", "FAILED"] as const).map((status) => (
          <button key={status} className={`btn ${filter === status ? "btn-solid" : ""}`} type="button" onClick={() => void chooseFilter(status)}>
            {statusLabels[status]}{status !== "ALL" ? ` (${counts[status]})` : ""}
          </button>
        ))}
      </div>
      <p className="admin-classification-metrics">总计：{workflow.total} · Title Rule：{workflow.titleRule} · DeepSeek：{workflow.deepseek} · Needs Vision：{workflow.needsVision} · Failed：{workflow.failed}</p>
      <p className="admin-classification-metrics">平均 confidence：{averageConfidence === null ? "—" : `${Math.round(averageConfidence * 100)}%`} · 一级分类变化：{parentChangedCount}</p>
      <div className="admin-classification-results">
        {rows.map((row) => (
          <article className="admin-classification-card" key={row.productCode}>
            <div className="admin-classification-image">
              {row.imageUrl ? <img src={row.imageUrl} alt={row.title} /> : <span>暂无图片</span>}
            </div>
            <div className="admin-classification-copy">
              <h3>{row.title}</h3>
              <p>商品编号：{row.productCode}</p>
              <p>当前：{categoryText(row.oldCategory, row.oldSubcategory)}</p>
              <p>分类建议：{categoryText(row.suggestedCategory, row.suggestedSubcategory)}</p>
              <p>来源：{row.source ? sourceLabels[row.source] : "—"} · 置信度：{row.confidence === null ? "—" : `${Math.round(row.confidence * 100)}%`} · 状态：{statusLabels[row.status]}</p>
              <p>{row.reason || row.errorMessage || "暂无说明"}</p>
              <button className="btn" type="button" onClick={() => void rescanOne(row.productCode)} disabled={scanning || rescanningCode !== null}>
                {rescanningCode === row.productCode ? "重扫中…" : "单件重扫"}
              </button>
            </div>
          </article>
        ))}
        {!rows.length ? <p>还没有对应状态的预览结果。</p> : null}
      </div>
    </section>
  );
}
