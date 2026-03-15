import React, { useRef, useState } from 'react';
import { FurusatoDonation, parseFurusatoTaxPdfs, FurusatoTaxSummary } from '../utils/furusatoTaxPdfParser';

const fmt = (n: number) => n.toLocaleString('ja-JP');

interface FurusatoSectionProps {
  donations: FurusatoDonation[];
  onDonationsChange: (donations: FurusatoDonation[]) => void;
}

export const FurusatoSection: React.FC<FurusatoSectionProps> = ({ donations, onDonationsChange }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ date: '', municipality: '', amount: '' });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setStatus('loading');
    setErrorMsg('');
    try {
      const summary: FurusatoTaxSummary = await parseFurusatoTaxPdfs(Array.from(files));
      // Merge with existing, deduplicate
      const existing = new Set(donations.map(d => `${d.municipality}|${d.amount}|${d.date}`));
      const newDonations = summary.donations.filter(d => !existing.has(`${d.municipality}|${d.amount}|${d.date}`));
      onDonationsChange([...donations, ...newDonations]);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'PDF読み込みに失敗しました');
    }
    e.target.value = '';
  };

  const handleDelete = (idx: number) => {
    onDonationsChange(donations.filter((_, i) => i !== idx));
  };

  const handleAdd = () => {
    setEditingIdx(-1);
    setEditForm({ date: new Date().toISOString().slice(0, 10), municipality: '', amount: '' });
  };

  const handleEdit = (idx: number) => {
    const d = donations[idx];
    setEditingIdx(idx);
    setEditForm({ date: d.date, municipality: d.municipality, amount: String(d.amount) });
  };

  const handleSave = () => {
    if (!editForm.municipality || !editForm.amount) return;
    const donation: FurusatoDonation = {
      date: editForm.date,
      municipality: editForm.municipality,
      amount: parseInt(editForm.amount, 10) || 0,
      source: 'other',
    };
    if (editingIdx === -1) {
      onDonationsChange([...donations, donation]);
    } else if (editingIdx !== null) {
      const updated = [...donations];
      updated[editingIdx] = { ...updated[editingIdx], ...donation };
      onDonationsChange(updated);
    }
    setEditingIdx(null);
  };

  const totalAmount = donations.reduce((s, d) => s + d.amount, 0);
  const deductible = Math.max(0, totalAmount - 2000);

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <input type="file" accept=".pdf" multiple ref={fileRef} onChange={handleUpload} style={{ display: 'none' }} />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={status === 'loading'}
          className="px-4 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          {status === 'loading' ? '読込中...' : 'ふるさと納税PDFを読み込む'}
        </button>
        <button
          onClick={handleAdd}
          className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          手動追加
        </button>
      </div>

      {status === 'success' && (
        <div className="mb-2 p-2 bg-green-50 border border-green-300 rounded text-sm text-green-800">
          PDFから寄附金データを読み込みました。
        </div>
      )}
      {status === 'error' && (
        <div className="mb-2 p-2 bg-red-50 border border-red-300 rounded text-sm text-red-800">{errorMsg}</div>
      )}

      <table className="w-full border-collapse border border-gray-300 text-sm mb-3">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-3 py-1 text-left">日付</th>
            <th className="border border-gray-300 px-3 py-1 text-left">自治体</th>
            <th className="border border-gray-300 px-3 py-1 text-right">金額</th>
            <th className="border border-gray-300 px-3 py-1 text-center">ソース</th>
            <th className="border border-gray-300 px-3 py-1 text-center w-20">操作</th>
          </tr>
        </thead>
        <tbody>
          {donations.length === 0 && (
            <tr><td colSpan={5} className="border border-gray-300 px-3 py-4 text-center text-gray-400">寄附金データがありません</td></tr>
          )}
          {donations.map((d, i) => (
            <tr key={i}>
              <td className="border border-gray-300 px-3 py-1">{d.date}</td>
              <td className="border border-gray-300 px-3 py-1">{d.municipality}</td>
              <td className="border border-gray-300 px-3 py-1 text-right">{fmt(d.amount)}</td>
              <td className="border border-gray-300 px-3 py-1 text-center text-xs">
                {d.source === 'furusato_choice' ? 'ふるさとチョイス' : d.source === 'rakuten' ? '楽天' : '手動'}
              </td>
              <td className="border border-gray-300 px-3 py-1 text-center">
                <button onClick={() => handleEdit(i)} className="text-blue-600 hover:underline text-xs mr-2">編集</button>
                <button onClick={() => handleDelete(i)} className="text-red-600 hover:underline text-xs">削除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Edit/Add modal inline */}
      {editingIdx !== null && (
        <div className="mb-3 p-3 bg-gray-50 border border-gray-300 rounded">
          <div className="flex gap-3 items-end">
            <div>
              <label className="text-xs text-gray-600 block">日付</label>
              <input type="date" value={editForm.date} onChange={e => setEditForm({ ...editForm, date: e.target.value })}
                className="border border-gray-300 rounded px-2 py-1 text-sm" />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-600 block">自治体名</label>
              <input type="text" value={editForm.municipality} onChange={e => setEditForm({ ...editForm, municipality: e.target.value })}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-600 block">金額</label>
              <input type="number" value={editForm.amount} onChange={e => setEditForm({ ...editForm, amount: e.target.value })}
                className="border border-gray-300 rounded px-2 py-1 text-sm w-32 text-right" />
            </div>
            <button onClick={handleSave} className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">保存</button>
            <button onClick={() => setEditingIdx(null)} className="px-3 py-1 text-sm bg-gray-300 text-black rounded hover:bg-gray-400">キャンセル</button>
          </div>
        </div>
      )}

      <div className="flex gap-6 text-sm font-bold">
        <span>寄附金合計: {fmt(totalAmount)} 円</span>
        <span>控除額 (合計 - 2,000): {fmt(deductible)} 円</span>
      </div>
    </div>
  );
};
